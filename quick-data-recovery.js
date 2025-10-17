// Script de récupération rapide des données
// À exécuter dans la console du navigateur

console.log('🚨 Script de récupération rapide des données');

// Fonction de récupération complète
function quickRecovery() {
    console.log('🔍 Début de la récupération...');
    
    // 1. Vérifier les données existantes
    const projects = localStorage.getItem('ninjalinking-projects');
    const sites = localStorage.getItem('ninjalinking-sites');
    
    console.log('📊 État actuel:');
    console.log('- Projets:', projects ? JSON.parse(projects).length : 0);
    console.log('- Sites:', sites ? JSON.parse(sites).length : 0);
    
    // 2. Si aucune donnée, initialiser
    if (!projects && !sites) {
        console.log('⚠️ Aucune donnée trouvée, initialisation...');
        
        const defaultProjects = [
            {
                id: Date.now(),
                name: 'Projet de Récupération',
                url: 'https://example.com',
                objective: 'SEO',
                traffic: 0,
                trustFlow: 0,
                ttf: 'Business',
                referringDomains: 0,
                keywords: ['récupération'],
                spots: [],
                budget: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        const defaultSites = [
            {
                id: Date.now() + 1,
                url: 'https://example-blog.com',
                type: 'Blog',
                theme: 'Business',
                traffic: 10000,
                trustFlow: 50,
                ttf: 'Business',
                follow: 'Oui',
                notes: 'Site de récupération',
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                url: 'https://example-forum.com',
                type: 'Forum',
                theme: 'Technologie',
                traffic: 5000,
                trustFlow: 30,
                ttf: 'Computers',
                follow: 'Oui',
                notes: 'Forum de récupération',
                createdAt: new Date().toISOString()
            }
        ];
        
        // Sauvegarder
        localStorage.setItem('ninjalinking-projects', JSON.stringify(defaultProjects));
        localStorage.setItem('ninjalinking-sites', JSON.stringify(defaultSites));
        
        console.log('✅ Données de récupération initialisées');
        console.log('- Projets créés:', defaultProjects.length);
        console.log('- Sites créés:', defaultSites.length);
        
        // Recharger la page
        console.log('🔄 Rechargement de la page...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } else {
        console.log('✅ Données trouvées, pas de récupération nécessaire');
        
        // Forcer le rechargement des données
        if (typeof loadData === 'function') {
            loadData();
        }
        
        if (typeof renderProjects === 'function') {
            renderProjects();
        }
        
        if (typeof renderSites === 'function') {
            renderSites();
        }
    }
}

// Fonction de diagnostic
function diagnoseData() {
    console.log('🔍 Diagnostic des données:');
    
    // Vérifier localStorage
    const projects = localStorage.getItem('ninjalinking-projects');
    const sites = localStorage.getItem('ninjalinking-sites');
    const user = localStorage.getItem('currentUser');
    const auth = localStorage.getItem('isAuthenticated');
    const supabaseUrl = localStorage.getItem('supabase-url');
    const supabaseKey = localStorage.getItem('supabase-anon-key');
    
    console.log('📱 localStorage:');
    console.log('- Projets:', projects ? JSON.parse(projects).length : 'Aucun');
    console.log('- Sites:', sites ? JSON.parse(sites).length : 'Aucun');
    console.log('- Utilisateur:', user || 'Aucun');
    console.log('- Authentifié:', auth || 'Non');
    console.log('- Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Non configuré');
    console.log('- Supabase Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Non configuré');
    
    // Vérifier sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    console.log('📱 sessionStorage:', sessionKeys.length, 'clés');
    
    // Vérifier les variables globales
    console.log('🌐 Variables globales:');
    console.log('- projects:', typeof projects !== 'undefined' ? projects.length : 'Non défini');
    console.log('- sites:', typeof sites !== 'undefined' ? sites.length : 'Non défini');
    console.log('- isSupabaseConfigured:', typeof isSupabaseConfigured !== 'undefined' ? isSupabaseConfigured : 'Non défini');
    console.log('- isAuthenticated:', typeof isAuthenticated !== 'undefined' ? isAuthenticated : 'Non défini');
}

// Fonction de nettoyage
function cleanData() {
    console.log('🧹 Nettoyage des données...');
    
    // Vider localStorage
    localStorage.removeItem('ninjalinking-projects');
    localStorage.removeItem('ninjalinking-sites');
    localStorage.removeItem('app-cache-version');
    
    // Vider sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Données nettoyées');
}

// Exécuter automatiquement
console.log('🚀 Exécution automatique de la récupération...');
quickRecovery();

// Exporter les fonctions pour utilisation manuelle
window.quickRecovery = quickRecovery;
window.diagnoseData = diagnoseData;
window.cleanData = cleanData;

console.log('✅ Script de récupération chargé');
console.log('💡 Fonctions disponibles:');
console.log('- quickRecovery() : Récupération complète');
console.log('- diagnoseData() : Diagnostic des données');
console.log('- cleanData() : Nettoyage des données');
