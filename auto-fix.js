// Script de réparation automatique
// À exécuter dans la console du navigateur

console.log('🔧 Script de réparation automatique');

// Fonction de réparation complète
function autoFix() {
    console.log('🔧 Début de la réparation automatique...');
    
    try {
        // 1. Nettoyer complètement
        console.log('1. Nettoyage complet...');
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Stockage nettoyé');
        
        // 2. Réinitialiser les variables globales
        console.log('2. Réinitialisation des variables...');
        if (typeof window !== 'undefined') {
            window.isAuthenticated = false;
            window.currentUser = null;
            window.db = null;
            window.isSupabaseConfigured = false;
            window.projects = [];
            window.sites = [];
        }
        console.log('✅ Variables globales réinitialisées');
        
        // 3. Réinitialiser l'interface
        console.log('3. Réinitialisation de l\'interface...');
        const homepage = document.getElementById('homepage-container');
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        
        if (homepage) {
            homepage.style.display = 'block';
            console.log('✅ Page d\'accueil affichée');
        } else {
            console.log('❌ Page d\'accueil non trouvée');
        }
        
        if (authContainer) {
            authContainer.style.display = 'none';
            console.log('✅ Container d\'auth caché');
        } else {
            console.log('❌ Container d\'auth non trouvé');
        }
        
        if (mainApp) {
            mainApp.style.display = 'none';
            console.log('✅ Interface principale cachée');
        } else {
            console.log('❌ Interface principale non trouvée');
        }
        
        // 4. Recharger les scripts
        console.log('4. Rechargement des scripts...');
        const scripts = ['ninja-linking-script.js', 'supabase-service.js'];
        scripts.forEach(script => {
            const existingScript = document.querySelector(`script[src*="${script}"]`);
            if (existingScript) {
                existingScript.remove();
                console.log(`🗑️ Ancien script ${script} supprimé`);
            }
            
            const newScript = document.createElement('script');
            newScript.src = script + '?v=' + Date.now();
            newScript.onload = () => console.log(`✅ ${script} rechargé`);
            newScript.onerror = () => console.log(`❌ Erreur chargement ${script}`);
            document.head.appendChild(newScript);
        });
        
        // 5. Attendre et réinitialiser
        console.log('5. Réinitialisation finale...');
        setTimeout(() => {
            console.log('🔄 Réinitialisation de l\'application...');
            
            if (typeof initializeApp === 'function') {
                initializeApp();
                console.log('✅ Application réinitialisée');
            } else {
                console.log('⚠️ Fonction initializeApp non trouvée');
            }
            
            if (typeof setupAuthEventListeners === 'function') {
                setupAuthEventListeners();
                console.log('✅ Event listeners réinitialisés');
            } else {
                console.log('⚠️ Fonction setupAuthEventListeners non trouvée');
            }
            
            // Test final
            setTimeout(() => {
                console.log('🧪 Test final...');
                testFinalState();
            }, 2000);
        }, 3000);
        
        console.log('✅ Réparation automatique terminée');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur réparation automatique:', error);
        return false;
    }
}

// Fonction de test de l'état final
function testFinalState() {
    console.log('🧪 Test de l\'état final...');
    
    // Vérifier les éléments DOM
    const criticalElements = [
        'homepage-container',
        'auth-container', 
        'main-app'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id} trouvé`);
        } else {
            console.log(`❌ ${id} manquant`);
        }
    });
    
    // Vérifier les boutons de navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log(`Boutons de navigation: ${navButtons.length}`);
    
    // Vérifier les fonctions
    const functions = [
        'initializeApp',
        'switchPage',
        'loadData',
        'renderProjects'
    ];
    
    functions.forEach(func => {
        const exists = typeof window[func] === 'function';
        console.log(`${func}: ${exists ? '✅' : '❌'}`);
    });
    
    // Vérifier les variables globales
    console.log(`isAuthenticated: ${window.isAuthenticated || 'undefined'}`);
    console.log(`currentUser: ${window.currentUser || 'undefined'}`);
    console.log(`db: ${window.db || 'undefined'}`);
    
    console.log('✅ Test final terminé');
}

// Fonction de diagnostic rapide
function quickDiagnostic() {
    console.log('🔍 Diagnostic rapide...');
    
    // Éléments DOM
    const homepage = document.getElementById('homepage-container');
    const authContainer = document.getElementById('auth-container');
    const mainApp = document.getElementById('main-app');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    console.log('Éléments DOM:');
    console.log(`- homepage-container: ${homepage ? '✅' : '❌'}`);
    console.log(`- auth-container: ${authContainer ? '✅' : '❌'}`);
    console.log(`- main-app: ${mainApp ? '✅' : '❌'}`);
    console.log(`- nav-buttons: ${navButtons.length}`);
    
    // Fonctions
    const functions = [
        'initializeApp',
        'switchPage',
        'loadData',
        'renderProjects',
        'checkAuthentication'
    ];
    
    console.log('Fonctions:');
    functions.forEach(func => {
        const exists = typeof window[func] === 'function';
        console.log(`- ${func}: ${exists ? '✅' : '❌'}`);
    });
    
    // Variables globales
    console.log('Variables globales:');
    console.log(`- isAuthenticated: ${window.isAuthenticated || 'undefined'}`);
    console.log(`- currentUser: ${window.currentUser || 'undefined'}`);
    console.log(`- db: ${window.db || 'undefined'}`);
    console.log(`- isSupabaseConfigured: ${window.isSupabaseConfigured || 'undefined'}`);
    
    console.log('✅ Diagnostic rapide terminé');
}

// Fonction de réparation ciblée
function targetedFix() {
    console.log('🎯 Réparation ciblée...');
    
    try {
        // 1. Forcer l'affichage de la page d'accueil
        console.log('1. Forçage de la page d\'accueil...');
        const homepage = document.getElementById('homepage-container');
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        
        if (homepage) {
            homepage.style.display = 'block';
            console.log('✅ Page d\'accueil affichée');
        }
        
        if (authContainer) {
            authContainer.style.display = 'none';
            console.log('✅ Container d\'auth caché');
        }
        
        if (mainApp) {
            mainApp.style.display = 'none';
            console.log('✅ Interface principale cachée');
        }
        
        // 2. Réinitialiser les variables
        console.log('2. Réinitialisation des variables...');
        window.isAuthenticated = false;
        window.currentUser = null;
        window.db = null;
        window.isSupabaseConfigured = false;
        window.projects = [];
        window.sites = [];
        console.log('✅ Variables réinitialisées');
        
        // 3. Nettoyer localStorage
        console.log('3. Nettoyage de localStorage...');
        localStorage.clear();
        console.log('✅ localStorage nettoyé');
        
        console.log('✅ Réparation ciblée terminée');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur réparation ciblée:', error);
        return false;
    }
}

// Exporter les fonctions
window.autoFix = autoFix;
window.testFinalState = testFinalState;
window.quickDiagnostic = quickDiagnostic;
window.targetedFix = targetedFix;

// Exécuter automatiquement le diagnostic
quickDiagnostic();

console.log('✅ Script de réparation automatique chargé');
console.log('💡 Fonctions disponibles:');
console.log('- autoFix() : Réparation complète');
console.log('- targetedFix() : Réparation ciblée');
console.log('- quickDiagnostic() : Diagnostic rapide');
console.log('- testFinalState() : Test de l\'état final');



