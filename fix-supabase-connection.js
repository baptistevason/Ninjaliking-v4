// Script de réparation automatique de la connexion Supabase
// À exécuter dans la console du navigateur

console.log('🔧 Script de réparation de la connexion Supabase');

// Fonction de réparation complète
async function fixSupabaseConnection() {
    console.log('🔧 Début de la réparation de la connexion Supabase...');
    
    try {
        // 1. Vérifier l'état actuel
        console.log('📊 État actuel:');
        console.log('- URL Supabase:', localStorage.getItem('supabase-url') || 'Non configuré');
        console.log('- Clé Supabase:', localStorage.getItem('supabase-anon-key') ? 'Configurée' : 'Non configurée');
        console.log('- Authentifié:', localStorage.getItem('isAuthenticated') || 'Non');
        console.log('- Utilisateur:', localStorage.getItem('currentUser') || 'Aucun');
        
        // 2. Restaurer les credentials par défaut
        const defaultUrl = 'https://kckdjgedbjjuhmcqcmpe.supabase.co';
        const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2RqZ2VkYmpqdWhtY3FjbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjQzMzMsImV4cCI6MjA3MzcwMDMzM30.-TUGbwjk_8OUGZKJdnU5CqyJHI8wm4o1j1LdzRnSKhg';
        
        console.log('⚡ Restauration des credentials par défaut...');
        localStorage.setItem('supabase-url', defaultUrl);
        localStorage.setItem('supabase-anon-key', defaultKey);
        localStorage.setItem('supabase-configured', 'true');
        
        console.log('✅ Credentials restaurés');
        
        // 3. Tester la connexion
        console.log('🧪 Test de la connexion...');
        
        // Charger Supabase si pas déjà chargé
        if (typeof window.supabase === 'undefined') {
            console.log('📦 Chargement de la librairie Supabase...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            
            // Attendre le chargement
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        // Créer le client Supabase
        const supabase = window.supabase.createClient(defaultUrl, defaultKey);
        
        // Test de connexion
        const { data, error } = await supabase
            .from('projects')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('❌ Erreur de connexion:', error.message);
            return false;
        } else {
            console.log('✅ Connexion Supabase réussie');
            console.log('📊 Données reçues:', data);
        }
        
        // 4. Réinitialiser les variables globales
        console.log('🔄 Réinitialisation des variables globales...');
        
        if (typeof window !== 'undefined') {
            window.isSupabaseConfigured = true;
            window.isAuthenticated = false; // Sera vérifié par l'app
            window.db = null; // Sera réinitialisé par l'app
            window.currentUser = null;
        }
        
        console.log('✅ Variables globales réinitialisées');
        
        // 5. Forcer le rechargement de l'application
        console.log('🔄 Rechargement de l\'application...');
        setTimeout(() => {
            window.location.href = 'index.html?supabase-fixed=true&t=' + Date.now();
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation:', error);
        return false;
    }
}

// Fonction de diagnostic
function diagnoseSupabase() {
    console.log('🔍 Diagnostic de la connexion Supabase:');
    
    // Vérifier localStorage
    const url = localStorage.getItem('supabase-url');
    const key = localStorage.getItem('supabase-anon-key');
    const configured = localStorage.getItem('supabase-configured');
    const auth = localStorage.getItem('isAuthenticated');
    const user = localStorage.getItem('currentUser');
    
    console.log('📱 localStorage:');
    console.log('- URL:', url || 'Non configuré');
    console.log('- Clé:', key ? key.substring(0, 20) + '...' : 'Non configurée');
    console.log('- Configuré:', configured || 'Non');
    console.log('- Authentifié:', auth || 'Non');
    console.log('- Utilisateur:', user || 'Aucun');
    
    // Vérifier les variables globales
    console.log('🌐 Variables globales:');
    console.log('- isSupabaseConfigured:', typeof isSupabaseConfigured !== 'undefined' ? isSupabaseConfigured : 'Non défini');
    console.log('- isAuthenticated:', typeof isAuthenticated !== 'undefined' ? isAuthenticated : 'Non défini');
    console.log('- db:', typeof db !== 'undefined' ? (db ? 'Initialisé' : 'Non initialisé') : 'Non défini');
    console.log('- currentUser:', typeof currentUser !== 'undefined' ? currentUser : 'Non défini');
    
    // Vérifier la connexion réseau
    console.log('🌐 Connexion réseau:');
    console.log('- En ligne:', navigator.onLine);
    console.log('- User Agent:', navigator.userAgent.substring(0, 50) + '...');
}

// Fonction de nettoyage
function cleanSupabaseCache() {
    console.log('🗑️ Nettoyage du cache Supabase...');
    
    // Nettoyer localStorage
    localStorage.removeItem('supabase-url');
    localStorage.removeItem('supabase-anon-key');
    localStorage.removeItem('supabase-configured');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    
    // Nettoyer sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Cache Supabase nettoyé');
}

// Fonction de test de connexion
async function testSupabaseConnection() {
    console.log('🧪 Test de la connexion Supabase...');
    
    try {
        const url = localStorage.getItem('supabase-url');
        const key = localStorage.getItem('supabase-anon-key');
        
        if (!url || !key) {
            console.log('❌ Credentials Supabase manquants');
            return false;
        }
        
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
        
        // Créer le client et tester
        const supabase = window.supabase.createClient(url, key);
        const { data, error } = await supabase
            .from('projects')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('❌ Erreur de connexion:', error.message);
            return false;
        } else {
            console.log('✅ Connexion réussie');
            console.log('📊 Données:', data);
            return true;
        }
        
    } catch (error) {
        console.error('❌ Erreur test:', error);
        return false;
    }
}

// Exécuter automatiquement la réparation
console.log('🚀 Exécution automatique de la réparation...');
fixSupabaseConnection();

// Exporter les fonctions pour utilisation manuelle
window.fixSupabaseConnection = fixSupabaseConnection;
window.diagnoseSupabase = diagnoseSupabase;
window.cleanSupabaseCache = cleanSupabaseCache;
window.testSupabaseConnection = testSupabaseConnection;

console.log('✅ Script de réparation chargé');
console.log('💡 Fonctions disponibles:');
console.log('- fixSupabaseConnection() : Réparation complète');
console.log('- diagnoseSupabase() : Diagnostic de la connexion');
console.log('- cleanSupabaseCache() : Nettoyage du cache');
console.log('- testSupabaseConnection() : Test de connexion');




