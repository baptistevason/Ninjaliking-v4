// Script de réparation de la structure des spots
// À exécuter dans la console du navigateur (F12)

console.log('🔧 Début de la réparation de la structure des spots...');

// Fonction pour réparer la structure des spots
function fixSpotsStructure() {
    try {
        // Récupérer les projets depuis localStorage
        const savedProjects = localStorage.getItem('ninjalinking-projects');
        if (!savedProjects) {
            console.log('❌ Aucun projet trouvé dans localStorage');
            return;
        }
        
        let projects = JSON.parse(savedProjects);
        console.log(`📊 ${projects.length} projets trouvés`);
        
        let fixed = 0;
        
        projects.forEach((project, index) => {
            console.log(`🔍 Vérification du projet ${index + 1}: "${project.name}"`);
            
            // Vérifier si le projet a une structure spots
            if (!project.spots) {
                console.log(`⚡ Initialisation des spots pour "${project.name}"`);
                project.spots = [];
                fixed++;
            } else if (!Array.isArray(project.spots)) {
                console.log(`🔧 Réparation de la structure spots pour "${project.name}"`);
                project.spots = [];
                fixed++;
            } else {
                console.log(`✅ Projet "${project.name}" a déjà ${project.spots.length} spots`);
            }
            
            // S'assurer que les autres champs existent
            if (!project.keywords) {
                project.keywords = [];
            }
            if (!project.budget) {
                project.budget = 0;
            }
        });
        
        // Sauvegarder les projets réparés
        localStorage.setItem('ninjalinking-projects', JSON.stringify(projects));
        
        console.log(`✅ Réparation terminée: ${fixed} projets réparés`);
        console.log('🔄 Rechargez la page pour voir les changements');
        
        return projects;
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation:', error);
    }
}

// Exécuter la réparation
const repairedProjects = fixSpotsStructure();

// Afficher un résumé
if (repairedProjects) {
    console.log('📋 Résumé des projets réparés:');
    repairedProjects.forEach(project => {
        console.log(`- ${project.name}: ${project.spots.length} spots, ${project.keywords.length} mots-clés`);
    });
}

