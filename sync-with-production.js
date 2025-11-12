// Script de synchronisation avec la version de production
// À exécuter dans la console du navigateur

console.log('🔄 Script de synchronisation avec la production');

// Fonction de synchronisation complète
async function syncWithProduction() {
    console.log('🔄 Début de la synchronisation avec la production...');
    
    try {
        // 1. Vérifier l'état actuel
        console.log('📊 État actuel:');
        const currentProjects = localStorage.getItem('ninjalinking-projects');
        const currentSites = localStorage.getItem('ninjalinking-sites');
        
        console.log('- Projets actuels:', currentProjects ? JSON.parse(currentProjects).length : 0);
        console.log('- Sites actuels:', currentSites ? JSON.parse(currentSites).length : 0);
        
        // 2. Demander l'URL de production
        const productionUrl = prompt('🌐 Entrez l\'URL de votre site de production:');
        if (!productionUrl) {
            console.log('❌ URL de production requise');
            return;
        }
        
        console.log('🌐 URL de production:', productionUrl);
        
        // 3. Récupérer les données de production
        console.log('📥 Récupération des données de production...');
        
        try {
            // Essayer de récupérer les données via fetch (si CORS permet)
            const response = await fetch(productionUrl + '/api/data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const productionData = await response.json();
                console.log('✅ Données récupérées via API');
                await restoreProductionData(productionData);
                return;
            }
        } catch (error) {
            console.log('⚠️ API non disponible, méthode alternative...');
        }
        
        // 4. Méthode alternative : Instructions manuelles
        console.log('📋 Instructions de synchronisation manuelle:');
        console.log('');
        console.log('1. 🌐 Ouvrez votre site de production dans un nouvel onglet');
        console.log('2. 🔧 Ouvrez les outils de développement (F12)');
        console.log('3. 📋 Copiez et collez le script d\'export ci-dessous');
        console.log('4. 💾 Téléchargez le fichier .json généré');
        console.log('5. 📥 Revenez ici et utilisez la fonction d\'import');
        console.log('');
        
        // Afficher le script d'export
        showExportScript();
        
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
    }
}

// Script d'export pour la production
function showExportScript() {
    const exportScript = `
// Script d'export pour la version de production
// À exécuter sur votre site de production

function exportProductionData() {
    console.log('📤 Export des données de production...');
    
    // Récupérer toutes les données
    const projects = localStorage.getItem('ninjalinking-projects');
    const sites = localStorage.getItem('ninjalinking-sites');
    const supabaseUrl = localStorage.getItem('supabase-url');
    const supabaseKey = localStorage.getItem('supabase-anon-key');
    const isAuth = localStorage.getItem('isAuthenticated');
    const currentUser = localStorage.getItem('currentUser');
    
    const exportData = {
        timestamp: new Date().toISOString(),
        version: 'production',
        projects: projects ? JSON.parse(projects) : [],
        sites: sites ? JSON.parse(sites) : [],
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey,
        isAuthenticated: isAuth,
        currentUser: currentUser,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    console.log('📊 Données à exporter:');
    console.log('- Projets:', exportData.projects.length);
    console.log('- Sites:', exportData.sites.length);
    console.log('- Supabase:', supabaseUrl ? 'Configuré' : 'Non configuré');
    console.log('- Authentifié:', isAuth || 'Non');
    
    // Créer et télécharger le fichier
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'production-backup-' + Date.now() + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ Export terminé - Fichier téléchargé');
    console.log('💡 Revenez sur votre site de préprod pour importer ce fichier');
}

// Exécuter l'export
exportProductionData();
    `;
    
    console.log('📋 Script d\'export pour la production:');
    console.log(exportScript);
}

// Fonction de restauration des données de production
async function restoreProductionData(productionData) {
    console.log('💾 Restauration des données de production...');
    
    try {
        // Restaurer les projets
        if (productionData.projects && productionData.projects.length > 0) {
            localStorage.setItem('ninjalinking-projects', JSON.stringify(productionData.projects));
            console.log(`✅ ${productionData.projects.length} projets restaurés`);
        }
        
        // Restaurer les sites
        if (productionData.sites && productionData.sites.length > 0) {
            localStorage.setItem('ninjalinking-sites', JSON.stringify(productionData.sites));
            console.log(`✅ ${productionData.sites.length} sites restaurés`);
        }
        
        // Restaurer la configuration Supabase
        if (productionData.supabaseUrl) {
            localStorage.setItem('supabase-url', productionData.supabaseUrl);
            console.log('✅ URL Supabase restaurée');
        }
        
        if (productionData.supabaseKey) {
            localStorage.setItem('supabase-anon-key', productionData.supabaseKey);
            console.log('✅ Clé Supabase restaurée');
        }
        
        // Restaurer l'authentification
        if (productionData.isAuthenticated) {
            localStorage.setItem('isAuthenticated', productionData.isAuthenticated);
            console.log('✅ État d\'authentification restauré');
        }
        
        if (productionData.currentUser) {
            localStorage.setItem('currentUser', productionData.currentUser);
            console.log('✅ Utilisateur restauré');
        }
        
        console.log('✅ Synchronisation terminée');
        console.log('🔄 Rechargement de l\'application...');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur restauration:', error);
    }
}

// Fonction d'import depuis fichier
function importFromFile() {
    console.log('📥 Import depuis fichier...');
    console.log('💡 Utilisez l\'outil web: restore-production-version.html');
    console.log('💡 Ou créez un input file et utilisez la fonction handleFileImport()');
}

// Fonction de gestion d'import de fichier
function handleFileImport(fileContent) {
    try {
        const productionData = JSON.parse(fileContent);
        console.log('📥 Données de production chargées:', productionData);
        restoreProductionData(productionData);
    } catch (error) {
        console.error('❌ Erreur lecture fichier:', error);
    }
}

// Fonction de diagnostic de la production
function diagnoseProduction(productionUrl) {
    console.log('🔍 Diagnostic de la production...');
    console.log('🌐 URL:', productionUrl);
    console.log('💡 Instructions:');
    console.log('1. Allez sur votre site de production');
    console.log('2. Ouvrez les outils de développement (F12)');
    console.log('3. Allez dans Application > Local Storage');
    console.log('4. Vérifiez les clés: ninjalinking-projects, ninjalinking-sites');
    console.log('5. Notez les valeurs pour les restaurer ici');
}

// Exécuter automatiquement la synchronisation
console.log('🚀 Démarrage de la synchronisation...');
syncWithProduction();

// Exporter les fonctions pour utilisation manuelle
window.syncWithProduction = syncWithProduction;
window.restoreProductionData = restoreProductionData;
window.showExportScript = showExportScript;
window.handleFileImport = handleFileImport;
window.diagnoseProduction = diagnoseProduction;

console.log('✅ Script de synchronisation chargé');
console.log('💡 Fonctions disponibles:');
console.log('- syncWithProduction() : Synchronisation complète');
console.log('- restoreProductionData(data) : Restaurer des données');
console.log('- showExportScript() : Afficher le script d\'export');
console.log('- handleFileImport(content) : Importer depuis fichier');
console.log('- diagnoseProduction(url) : Diagnostiquer la production');




