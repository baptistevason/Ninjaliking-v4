// Script de debug pour identifier le problème de sauvegarde du budget
// À exécuter dans la console du navigateur

console.log('🔍 Debug du problème de sauvegarde du budget');

// Fonction de diagnostic complet
async function debugBudgetIssue() {
    console.log('🔍 Début du diagnostic du problème de budget...');
    
    try {
        // 1. Vérifier la connexion Supabase
        console.log('📊 1. Vérification de la connexion Supabase...');
        
        const defaultUrl = 'https://kckdjgedbjjuhmcqcmpe.supabase.co';
        const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2RqZ2VkYmpqdWhtY3FjbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjQzMzMsImV4cCI6MjA3MzcwMDMzM30.-TUGbwjk_8OUGZKJdnU5CqyJHI8wm4o1j1LdzRnSKhg';
        
        const supabaseUrl = localStorage.getItem('supabase-url') || defaultUrl;
        const supabaseKey = localStorage.getItem('supabase-anon-key') || defaultKey;
        
        console.log('🔧 Configuration Supabase:');
        console.log('- URL:', supabaseUrl);
        console.log('- Key:', supabaseKey ? 'Configurée' : 'Non configurée');
        
        // Charger Supabase si nécessaire
        if (typeof window.supabase === 'undefined') {
            console.log('📦 Chargement de Supabase...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase initialisé');
        
        // 2. Vérifier la colonne budget
        console.log('📊 2. Vérification de la colonne budget...');
        
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'projects')
            .eq('column_name', 'budget');
        
        if (columnsError) {
            console.log('❌ Erreur vérification colonne:', columnsError.message);
            return false;
        }
        
        if (columns && columns.length > 0) {
            console.log('✅ Colonne budget trouvée:', columns[0]);
        } else {
            console.log('❌ Colonne budget non trouvée');
            return false;
        }
        
        // 3. Vérifier les projets existants
        console.log('📊 3. Vérification des projets existants...');
        
        const { data: existingProjects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, budget, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (projectsError) {
            console.log('❌ Erreur récupération projets:', projectsError.message);
        } else {
            console.log(`📊 ${existingProjects.length} projets trouvés:`);
            existingProjects.forEach(project => {
                console.log(`- ${project.name} (ID: ${project.id}): budget = ${project.budget}`);
            });
        }
        
        // 4. Tester la sauvegarde directe
        console.log('🧪 4. Test de sauvegarde directe...');
        
        const testProject = {
            user_id: '00000000-0000-0000-0000-000000000000', // UUID temporaire
            name: 'Test Budget Debug ' + Date.now(),
            url: 'https://test-budget-debug-' + Date.now() + '.com',
            objective: 'SEO',
            traffic: 1000,
            trust_flow: 50,
            ttf: 'Business',
            referring_domains: 10,
            publication_goal: 5,
            budget: 1500.75,
            keywords: ['test', 'debug'],
            spots: []
        };
        
        console.log('📊 Projet de test:', testProject);
        
        const { data: savedProject, error: saveError } = await supabase
            .from('projects')
            .insert([testProject])
            .select()
            .single();
        
        if (saveError) {
            console.log('❌ Erreur sauvegarde directe:', saveError.message);
            console.log('📊 Détails de l\'erreur:', saveError);
            return false;
        }
        
        console.log('✅ Projet sauvegardé avec succès !');
        console.log('📊 Projet sauvegardé:', savedProject);
        console.log(`💰 Budget sauvegardé: ${savedProject.budget} €`);
        
        // 5. Vérifier immédiatement en base
        console.log('🔍 5. Vérification immédiate en base...');
        
        const { data: fetchedProject, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', savedProject.id)
            .single();
        
        if (fetchError) {
            console.log('❌ Erreur récupération:', fetchError.message);
        } else {
            console.log('✅ Projet récupéré de la base');
            console.log(`💰 Budget en base: ${fetchedProject.budget} €`);
            
            if (savedProject.budget === fetchedProject.budget) {
                console.log('✅ Budget cohérent entre sauvegarde et base');
            } else {
                console.log('❌ Budget incohérent !');
                console.log(`- Sauvegardé: ${savedProject.budget}`);
                console.log(`- En base: ${fetchedProject.budget}`);
            }
        }
        
        // 6. Nettoyer le projet de test
        console.log('🧹 6. Nettoyage du projet de test...');
        
        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', savedProject.id);
        
        if (deleteError) {
            console.log('⚠️ Erreur suppression projet test:', deleteError.message);
        } else {
            console.log('✅ Projet de test supprimé');
        }
        
        console.log('✅ Diagnostic terminé');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error);
        return false;
    }
}

// Fonction de test de la fonction saveProject du service
async function testServiceSaveProject() {
    console.log('🧪 Test de la fonction saveProject du service...');
    
    try {
        // Charger le service Supabase
        if (typeof SupabaseService === 'undefined') {
            console.log('📦 Chargement du service Supabase...');
            const script = document.createElement('script');
            script.src = 'supabase-service.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        const defaultUrl = 'https://kckdjgedbjjuhmcqcmpe.supabase.co';
        const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2RqZ2VkYmpqdWhtY3FjbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjQzMzMsImV4cCI6MjA3MzcwMDMzM30.-TUGbwjk_8OUGZKJdnU5CqyJHI8wm4o1j1LdzRnSKhg';
        
        const db = new SupabaseService();
        await db.initialize(defaultUrl, defaultKey);
        
        console.log('✅ Service Supabase initialisé');
        
        // Créer un projet de test
        const testProject = {
            name: 'Test Service Budget ' + Date.now(),
            url: 'https://test-service-' + Date.now() + '.com',
            objective: 'SEO',
            traffic: 1000,
            trustFlow: 50,
            ttf: 'Business',
            referringDomains: 10,
            publicationGoal: 5,
            budget: 2000.50,
            keywords: ['test', 'service'],
            spots: []
        };
        
        console.log('📊 Projet de test:', testProject);
        
        // Tenter la sauvegarde via le service
        const result = await db.saveProject(testProject);
        
        if (result) {
            console.log('✅ Projet sauvegardé via le service !');
            console.log('📊 Résultat:', result);
            console.log(`💰 Budget: ${result.budget} €`);
        } else {
            console.log('❌ Échec de la sauvegarde via le service');
        }
        
    } catch (error) {
        console.error('❌ Erreur test service:', error);
    }
}

// Fonction de vérification des données localStorage
function checkLocalStorageData() {
    console.log('📱 Vérification des données localStorage...');
    
    const projects = localStorage.getItem('ninjalinking-projects');
    const sites = localStorage.getItem('ninjalinking-sites');
    const supabaseUrl = localStorage.getItem('supabase-url');
    const supabaseKey = localStorage.getItem('supabase-anon-key');
    const isAuth = localStorage.getItem('isAuthenticated');
    
    console.log('📊 État localStorage:');
    console.log('- Projets:', projects ? 'Présent' : 'Absent');
    console.log('- Sites:', sites ? 'Présent' : 'Absent');
    console.log('- Supabase URL:', supabaseUrl || 'Non configuré');
    console.log('- Supabase Key:', supabaseKey ? 'Configurée' : 'Non configurée');
    console.log('- Authentifié:', isAuth || 'Non');
    
    if (projects) {
        const parsedProjects = JSON.parse(projects);
        console.log(`📊 Projets dans localStorage (${parsedProjects.length}):`);
        parsedProjects.forEach(project => {
            console.log(`- ${project.name}: budget = ${project.budget || 'Non défini'}`);
        });
    }
}

// Exécuter automatiquement le diagnostic
console.log('🚀 Démarrage du diagnostic...');
debugBudgetIssue();

// Exporter les fonctions pour utilisation manuelle
window.debugBudgetIssue = debugBudgetIssue;
window.testServiceSaveProject = testServiceSaveProject;
window.checkLocalStorageData = checkLocalStorageData;

console.log('✅ Script de debug chargé');
console.log('💡 Fonctions disponibles:');
console.log('- debugBudgetIssue() : Diagnostic complet');
console.log('- testServiceSaveProject() : Test du service');
console.log('- checkLocalStorageData() : Vérifier localStorage');
