// Variables globales
let selectedFootprints = []; // Pour la page Ninjalinking
let projects = [];
let sites = [];
let editingSiteId = null;
let editingProjectId = null;
let db = null;
let isSupabaseConfigured = false;
let isAuthenticated = false;
let currentUser = null;
let isAdmin = false;
let currentSort = { column: null, direction: 'asc' };
let currentSpotsSort = { column: null, direction: 'asc' };

// Initialiser Supabase
async function initSupabase() {
    try {
        // Credentials Supabase pré-configurés
        const defaultSupabaseUrl = 'https://kckdjgedbjjuhmcqcmpe.supabase.co';
        const defaultSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2RqZ2VkYmpqdWhtY3FjbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjQzMzMsImV4cCI6MjA3MzcwMDMzM30.-TUGbwjk_8OUGZKJdnU5CqyJHI8wm4o1j1LdzRnSKhg';
        
        // Vérifier si on a des credentials personnalisés
        const supabaseUrl = localStorage.getItem('supabase-url') || defaultSupabaseUrl;
        const supabaseKey = localStorage.getItem('supabase-anon-key') || defaultSupabaseKey;
        
        if (supabaseUrl && supabaseKey) {
            db = new SupabaseService();
            const success = await db.initialize(supabaseUrl, supabaseKey);
            if (success) {
                isSupabaseConfigured = true;
                
                // Vérifier l'authentification
                await checkAuthentication();
                
                console.log('✅ Supabase configuré');
                return true;
            }
        }
        
        console.log('ℹ️ Mode localStorage (pas de Supabase configuré)');
        return false;
    } catch (error) {
        console.error('❌ Erreur initialisation Supabase:', error);
        return false;
    }
}

// ============ AUTHENTIFICATION ============

// Vérifier l'authentification
async function checkAuthentication() {
    if (!db) return false;
    
    try {
        const user = await db.checkCurrentUser();
        if (user) {
            isAuthenticated = true;
            currentUser = user;
            
            // Sauvegarder l'état d'authentification
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            return true;
        } else {
            isAuthenticated = false;
            currentUser = null;
            
            // Nettoyer l'état d'authentification
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            
            return false;
        }
    } catch (error) {
        console.error('Erreur vérification authentification:', error);
        isAuthenticated = false;
        currentUser = null;
        
        // Nettoyer l'état d'authentification en cas d'erreur
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        
        return false;
    }
}

// Afficher la page d'accueil
function showHomepage() {
    document.getElementById('homepage-container').style.display = 'block';
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
}

// Afficher le formulaire d'authentification
function showAuthForm() {
    document.getElementById('homepage-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

// Afficher la démo (redirige vers l'authentification)
function showDemo() {
    showAuthForm();
}

// Afficher l'application principale
function showMainApp() {
    document.getElementById('homepage-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // Mettre à jour l'interface utilisateur
    updateUserInterface();
    
    // Afficher les sections privées pour les utilisateurs connectés
    showPrivateSections();
    
    // Masquer le message d'accès public
    hidePublicAccessMessage();
    
    // Restaurer le contenu du catalogue pour les utilisateurs connectés
    restoreCatalogContent();
    
    // Charger les données
    loadData();
}

// Afficher l'application avec accès limité (catalogue public uniquement)
function showLimitedApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // Masquer les sections privées
    hidePrivateSections();
    
    // Mettre à jour l'interface utilisateur
    updateUserInterface();
    
    // Afficher le message d'accès restreint pour le catalogue
    showCatalogRestricted();
    
    // Charger les données publiques
    loadData();
}

// Mettre à jour l'interface utilisateur selon l'état d'authentification
function updateUserInterface() {
    const userEmail = document.getElementById('userEmail');
    const userEmailContainer = document.getElementById('userEmailContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    
    if (isAuthenticated && currentUser) {
        // Utilisateur connecté
        userEmail.textContent = currentUser.email;
        userEmailContainer.style.display = 'flex';
        logoutBtn.style.display = 'inline-block';
        loginBtn.style.display = 'none';
        
        // Vérifier si l'utilisateur est admin
        isAdmin = db ? db.isAdmin() : false;
        
        // Mettre à jour l'affichage des fonctionnalités admin
        updateAdminFeatures();
    } else {
        // Utilisateur non connecté
        userEmailContainer.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        isAdmin = false;
        
        // Masquer les fonctionnalités admin
        hideAdminFeatures();
    }
}

// Mettre à jour l'affichage des fonctionnalités admin
function updateAdminFeatures() {
    // Afficher/masquer les boutons d'import/export selon les privilèges
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(button => {
        button.style.display = isAdmin ? 'inline-block' : 'none';
    });
    
    // Afficher/masquer les sections admin
    const adminSections = document.querySelectorAll('.admin-section');
    adminSections.forEach(section => {
        section.style.display = isAdmin ? 'block' : 'none';
    });
    
    // S'assurer que les sections privées sont visibles pour les utilisateurs connectés
    showPrivateSections();
    
    // Masquer le message d'accès public pour les utilisateurs connectés
    hidePublicAccessMessage();
    
    // Ajouter un indicateur admin dans l'interface
    if (isAdmin) {
        const userEmail = document.getElementById('userEmail');
        if (userEmail && !userEmail.querySelector('.admin-badge')) {
            const adminBadge = document.createElement('span');
            adminBadge.className = 'admin-badge';
            adminBadge.innerHTML = ' <i class="fas fa-crown" style="color: #ffd700; font-size: 0.8rem;"></i>';
            adminBadge.title = 'Administrateur';
            userEmail.appendChild(adminBadge);
        }
    }
}

// Masquer les fonctionnalités admin
function hideAdminFeatures() {
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    const adminSections = document.querySelectorAll('.admin-section');
    adminSections.forEach(section => {
        section.style.display = 'none';
    });
}

// Masquer les sections privées pour les utilisateurs non authentifiés
function hidePrivateSections() {
    // Masquer l'onglet Projets
    const projectsTab = document.querySelector('[data-page="projects"]');
    if (projectsTab) {
        projectsTab.style.display = 'none';
    }
    
    // Masquer l'onglet Catalogue pour les utilisateurs non connectés
    const catalogTab = document.querySelector('[data-page="catalog"]');
    if (catalogTab) {
        catalogTab.style.display = 'none';
    }
    
    // L'onglet IA reste visible pour tous les utilisateurs
    const iaTab = document.querySelector('[data-page="ia"]');
    if (iaTab) {
        iaTab.style.display = 'inline-block';
    }
    
    // Flouter les sections des spots
    blurSpotsSections();
    
    // Afficher le message d'accès restreint pour le catalogue
    showCatalogRestricted();
    
    // Afficher un message d'information
    showPublicAccessMessage();
}

// Afficher les sections privées pour les utilisateurs connectés
function showPrivateSections() {
    // Afficher l'onglet Projets
    const projectsTab = document.querySelector('[data-page="projects"]');
    if (projectsTab) {
        projectsTab.style.display = 'inline-block';
    }
    
    // Afficher l'onglet Catalogue pour les utilisateurs connectés
    const catalogTab = document.querySelector('[data-page="catalog"]');
    if (catalogTab) {
        catalogTab.style.display = 'inline-block';
    }
    
    // L'onglet IA est toujours visible pour tous les utilisateurs
    const iaTab = document.querySelector('[data-page="ia"]');
    if (iaTab) {
        iaTab.style.display = 'inline-block';
    }
    
    // Supprimer le flou des spots
    unblurSpotsSections();
}

// Flouter les sections des spots pour les utilisateurs non connectés
function blurSpotsSections() {
    // Flouter la section des spots dans les projets
    const projectSpotsSection = document.querySelector('.project-spots-section');
    if (projectSpotsSection) {
        projectSpotsSection.classList.add('spots-blurred');
    }
    
    // Afficher le message d'accès restreint pour le catalogue
    showCatalogRestricted();
    
    // Flouter les sections de spots dans les autres pages
    const spotsSections = document.querySelectorAll('.project-spots-table-container');
    spotsSections.forEach(section => {
        section.classList.add('spots-blurred');
    });
}

// Afficher le message d'accès restreint pour le catalogue
function showCatalogRestricted() {
    // Ne pas afficher si l'utilisateur est connecté
    if (isAuthenticated) {
        return;
    }
    
    // Attendre que le contenu soit rendu
    setTimeout(() => {
        const catalogContent = document.querySelector('.catalog-content');
        if (catalogContent) {
            console.log('🔒 Affichage du message d\'accès restreint pour le catalogue');
            // Remplacer le contenu par le message d'accès restreint
            catalogContent.innerHTML = `
                <div class="catalog-restricted">
                    <div class="restricted-message">
                        <h3>🔒 Accès Restreint</h3>
                        <p>Pour accéder à la fonction catalogue, vous devez être connecté.</p>
                    </div>
                    <div class="auth-buttons">
                        <button class="login-button" onclick="showAuthForm()">
                            Se connecter
                        </button>
                        <a href="/compte" class="signup-button" onclick="showSignupForm(); return false;">
                            Créer un compte
                        </a>
                    </div>
                </div>
            `;
        } else {
            console.log('❌ Élément .catalog-content non trouvé');
        }
    }, 500);
}

// Restaurer le contenu du catalogue pour les utilisateurs connectés
function restoreCatalogContent() {
    if (isAuthenticated) {
        // Recharger le contenu du catalogue normal
        renderSites();
    }
}

// Supprimer le flou des spots pour les utilisateurs connectés
function unblurSpotsSections() {
    const blurredSections = document.querySelectorAll('.spots-blurred');
    blurredSections.forEach(section => {
        section.classList.remove('spots-blurred');
    });
    
    // Restaurer le contenu du catalogue pour les utilisateurs connectés
    restoreCatalogContent();
}

// Afficher un message pour l'accès public
function showPublicAccessMessage() {
    // Ne pas afficher le message si l'utilisateur est connecté
    if (isAuthenticated) {
        hidePublicAccessMessage();
        return;
    }
    
    const catalogPage = document.getElementById('catalog-page');
    if (catalogPage) {
        // Vérifier si le message existe déjà
        let messageDiv = catalogPage.querySelector('.public-access-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.className = 'public-access-message';
            messageDiv.innerHTML = `
                <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h3 style="color: #1976d2; margin: 0 0 0.5rem 0;">
                        <i class="fas fa-info-circle"></i> Accès Public
                    </h3>
                    <p style="margin: 0; color: #424242;">
                        Vous consultez le catalogue public de sites. 
                        <a href="#" onclick="showAuthForm()" style="color: #1976d2; font-weight: 600;">
                            Connectez-vous
                        </a> pour créer vos propres projets et gérer vos données.
                    </p>
                </div>
            `;
            catalogPage.insertBefore(messageDiv, catalogPage.firstChild);
        }
    }
}

// Masquer le message d'accès public
function hidePublicAccessMessage() {
    const catalogPage = document.getElementById('catalog-page');
    if (catalogPage) {
        const messageDiv = catalogPage.querySelector('.public-access-message');
        if (messageDiv) {
            messageDiv.remove();
        }
    }
}

// Basculer vers le formulaire d'inscription
function showSignupForm() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
    document.getElementById('reset-form').classList.remove('active');
}

// Basculer vers le formulaire de connexion
function showLoginForm() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
    document.getElementById('reset-form').classList.remove('active');
}

// Basculer vers le formulaire de réinitialisation
function showResetForm() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('reset-form').classList.add('active');
}

// Gérer la connexion
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!db) {
        alert('❌ Supabase non configuré');
        return;
    }
    
    try {
        const result = await db.signIn(email, password);
        if (result.success) {
            isAuthenticated = true;
            currentUser = result.user;
            
            // Sauvegarder l'état d'authentification
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // Gérer "Se souvenir de moi"
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedEmail', email);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('savedEmail');
            }
            
            showMainApp();
        } else {
            alert('❌ Erreur de connexion: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur connexion:', error);
        alert('❌ Erreur de connexion');
    }
}

// Gérer l'inscription
async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('❌ Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        alert('❌ Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    if (!db) {
        alert('❌ Supabase non configuré');
        return;
    }
    
    try {
        const result = await db.signUp(email, password);
        if (result.success) {
            alert('✅ Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
            showLoginForm();
        } else {
            alert('❌ Erreur d\'inscription: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur inscription:', error);
        alert('❌ Erreur d\'inscription');
    }
}

// Gérer la réinitialisation de mot de passe
async function handleReset(event) {
    event.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    if (!db) {
        alert('❌ Supabase non configuré');
        return;
    }
    
    try {
        const result = await db.resetPassword(email);
        if (result.success) {
            alert('✅ Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
            showLoginForm();
        } else {
            alert('❌ Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur réinitialisation:', error);
        alert('❌ Erreur de réinitialisation');
    }
}

// Déconnexion
async function logout() {
    if (!db) return;
    
    try {
        await db.signOut();
        isAuthenticated = false;
        currentUser = null;
        projects = [];
        sites = [];
        
        // Nettoyer le localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('currentPage');
        
        showAuthForm();
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
}


// Configurer Supabase avec les credentials utilisateur
async function configureSupabase() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
                <h3 style="margin-top: 0; color: #1a202c;">🚀 Configuration Supabase</h3>
                <p style="color: #4a5568; margin-bottom: 1rem;">Connectez votre base de données Supabase pour sauvegarder vos données dans le cloud.</p>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">URL du projet Supabase:</label>
                    <input type="url" id="supabaseUrl" placeholder="https://votre-projet.supabase.co" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;" />
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Clé publique (anon key):</label>
                    <input type="text" id="supabaseKey" placeholder="eyJhbGc..." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;" />
                </div>
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button onclick="closeSupabaseModal()" style="padding: 0.75rem 1.5rem; background: #f7fafc; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">Annuler</button>
                    <button onclick="saveSupabaseConfig()" style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Configurer</button>
                </div>
            </div>
        </div>
    `;
    modal.id = 'supabaseConfigModal';
    document.body.appendChild(modal);
}

// Sauvegarder la configuration Supabase
async function saveSupabaseConfig() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    
    if (!url || !key) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
    }
    
    try {
        // Sauvegarder les credentials
        localStorage.setItem('supabase-url', url);
        localStorage.setItem('supabase-anon-key', key);
        
        // Initialiser Supabase
        db = new SupabaseService();
        const success = await db.initialize(url, key);
        
        if (success) {
            isSupabaseConfigured = true;
            closeSupabaseModal();
            
            // Proposer la migration des données existantes
            if (projects.length > 0 || sites.length > 0) {
                if (confirm('🔄 Voulez-vous migrer vos données existantes vers Supabase ?')) {
                    await migrateToSupabase();
                }
            }
            
            alert('✅ Supabase configuré avec succès !');
        } else {
            alert('❌ Erreur de configuration. Vérifiez vos credentials Supabase.');
        }
    } catch (error) {
        console.error('Erreur configuration Supabase:', error);
        alert('❌ Erreur de configuration. Vérifiez vos credentials Supabase.');
    }
}

// Fermer le modal de configuration
function closeSupabaseModal() {
    const modal = document.getElementById('supabaseConfigModal');
    if (modal) {
        modal.remove();
    }
}

// Ajouter un bouton de configuration Supabase
function addSupabaseConfigButton() {
    // Vérifier si le bouton existe déjà
    if (document.getElementById('supabaseConfigBtn')) return;
    
    const button = document.createElement('button');
    button.id = 'supabaseConfigBtn';
    button.innerHTML = '🔧 Configurer Supabase';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        z-index: 1000;
        transition: all 0.2s ease;
    `;
    
    button.addEventListener('click', configureSupabase);
    button.addEventListener('mouseenter', () => {
        button.style.background = '#2563eb';
        button.style.transform = 'translateY(-2px)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.background = '#3b82f6';
        button.style.transform = 'translateY(0)';
    });
    
    document.body.appendChild(button);
}

// Configurer l'URL de redirection pour l'email de confirmation
function configureEmailRedirect() {
    const currentUrl = localStorage.getItem('email-redirect-url') || window.location.origin;
    
    const newUrl = prompt(
        `🔗 Configuration de l'URL de redirection pour l'email de confirmation\n\n` +
        `URL actuelle: ${currentUrl}\n\n` +
        `Entrez la nouvelle URL (ou laissez vide pour utiliser l'URL actuelle):`,
        currentUrl
    );
    
    if (newUrl !== null) {
        if (newUrl.trim() === '') {
            localStorage.removeItem('email-redirect-url');
            alert('✅ URL de redirection réinitialisée à l\'URL par défaut');
        } else {
            localStorage.setItem('email-redirect-url', newUrl.trim());
            alert(`✅ URL de redirection configurée: ${newUrl.trim()}`);
        }
    }
}

// Migrer vers Supabase
async function migrateToSupabase() {
    if (!db || !isSupabaseConfigured) return;
    
    try {
        const success = await db.migrateFromLocalStorage(projects, sites);
        if (success) {
            alert('🎉 Migration réussie ! Vos données sont maintenant sauvegardées dans Supabase.');
            // Recharger depuis Supabase
            await loadData();
            renderProjects();
            updateProjectStats();
            renderSites();
        }
    } catch (error) {
        console.error('Erreur migration:', error);
        alert('❌ Erreur lors de la migration. Vos données restent en local.');
    }
}
window.currentKeywords = [];
let currentProjectId = null;
let projectSpots = [];

// Données des footprints par catégorie
const footprintsData = {
    blogs: [
        '"mot-clé" inurl:blog "laisser un commentaire"',
        '"mot-clé" "Vous devez être connecté pour publier un commentaire"',
        '"mot-clé" "poster un commentaire sur cet article"',
        '"mot-clé" inurl:/blog/ "Ajouter un commentaire"',
        '"mot-clé" "les adresses internet seront converties automatiquement"',
        '"mot-clé" "répondre à ce message" "dans la même rubrique"',
        '"mot-clé" "ajouter un commentaire" "tags HTML autorisés : <a>"'
    ],
    forums: [
        '"mot-clé" inurl:/forum/ "sujets actifs"',
        '"mot-clé" intitle:"index du forum"',
        '"mot-clé" inurl:forumdisplay.php?fid=',
        '"mot-clé" inurl:viewtopic.php?',
        '"mot-clé" "powered by vbulletin" | "propulsé par vbulletin"',
        '"mot-clé" "powered by phpbb" | "propulsé par phpbb"',
        '"mot-clé" "powered by punbb" | "propulsé par punbb"'
    ],
    'livres-dor': [
        '"mot-clé" intitle:"livre d\'or" "ajouter un message"',
        '"mot-clé" inurl:guestbook'
    ],
    annuaires: [
        '"mot-clé" intitle:"annuaire de sites" "proposer un site"',
        '"mot-clé" "soumettre un site" inurl:annuaire',
        '"mot-clé" inurl:/submit-link/'
    ],
    profils: [
        '"mot-clé" inurl:/user/',
        '"mot-clé" inurl:profile.php?id=',
        '"mot-clé" "Connectez-vous ou inscrivez-vous pour publier un commentaire"',
        '"mot-clé" "Ce formulaire accepte les raccourcis SPIP"',
        '"mot-clé" "créez votre profil public"'
    ],
    hybrides: [
        '"mot-clé" "Powered by WordPress" "laisser un commentaire"',
        '"mot-clé" "propulsé par phpBB" "sujets actifs"'
    ],
    'articles-invites': [
        '"mot-clé" "publiez vos contributions"',
        '"mot-clé" "proposez vos articles"',
        '"mot-clé" "soumettre un article" publication sur le site'
    ]
};

// ===== SYSTÈME DE FAVORIS/WISHLIST =====
let favoriteFootprints = JSON.parse(localStorage.getItem('favoriteFootprints') || '[]');
let favoriteSerpFootprints = JSON.parse(localStorage.getItem('favoriteSerpFootprints') || '[]');
let favoriteEreputationFootprints = JSON.parse(localStorage.getItem('favoriteEreputationFootprints') || '[]');

// Fonction pour sauvegarder les favoris
function saveFavorites() {
    localStorage.setItem('favoriteFootprints', JSON.stringify(favoriteFootprints));
    localStorage.setItem('favoriteSerpFootprints', JSON.stringify(favoriteSerpFootprints));
    localStorage.setItem('favoriteEreputationFootprints', JSON.stringify(favoriteEreputationFootprints));
}

// Fonction pour basculer l'état favori d'un footprint
function toggleFavorite(footprint, type) {
    console.log('🔄 Toggle favorite:', {footprint, type});
    
    if (!footprint || !type) {
        console.error('❌ Paramètres manquants:', {footprint, type});
        return;
    }
    
    // Décoder les caractères échappés
    const decodedFootprint = footprint.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    console.log('🔄 Footprint décodé:', decodedFootprint);
    
    let favoritesArray;
    
    switch(type) {
        case 'ninjalinking':
            favoritesArray = favoriteFootprints;
            break;
        case 'serp':
            favoritesArray = favoriteSerpFootprints;
            break;
        case 'ereputation':
            favoritesArray = favoriteEreputationFootprints;
            break;
        default:
            console.error('❌ Type non reconnu:', type);
            return;
    }
    
    const index = favoritesArray.indexOf(decodedFootprint);
    let isNowFavorite;
    
    if (index > -1) {
        // Retirer des favoris
        favoritesArray.splice(index, 1);
        isNowFavorite = false;
        console.log('❌ Retiré des favoris:', decodedFootprint);
    } else {
        // Ajouter aux favoris
        favoritesArray.push(decodedFootprint);
        isNowFavorite = true;
        console.log('❤️ Ajouté aux favoris:', decodedFootprint);
    }
    
    // Sauvegarder
    saveFavorites();
    
    // Mettre à jour tous les boutons favoris
    updateAllFavoriteButtons();
    
    // Notification
    showNotification(
        isNowFavorite ? 'Footprint ajouté aux favoris' : 'Footprint retiré des favoris',
        isNowFavorite ? 'success' : 'warning'
    );
}

// Fonction pour mettre à jour un bouton favori spécifique
function updateFavoriteButton(footprint, type, isFavorite) {
    // Échapper les caractères spéciaux pour le sélecteur
    const escapedFootprint = footprint.replace(/"/g, '\\"').replace(/'/g, "\\'");
    const buttons = document.querySelectorAll(`[data-footprint="${escapedFootprint}"][data-type="${type}"]`);
    console.log(`🔄 Mise à jour de ${buttons.length} boutons pour ${footprint}`);
    
    buttons.forEach(button => {
        if (isFavorite) {
            button.classList.add('favorited');
            button.title = 'Retirer des favoris';
            button.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            button.classList.remove('favorited');
            button.title = 'Ajouter aux favoris';
            button.innerHTML = '<i class="fas fa-heart"></i>';
        }
    });
}

// Fonction pour vérifier si un footprint est en favoris
function checkIfFavorite(footprint, type) {
    switch(type) {
        case 'ninjalinking':
            return favoriteFootprints.includes(footprint);
        case 'serp':
            return favoriteSerpFootprints.includes(footprint);
        case 'ereputation':
            return favoriteEreputationFootprints.includes(footprint);
        default:
            return false;
    }
}

// Fonction pour mettre à jour tous les boutons favoris
function updateAllFavoriteButtons() {
    const allFavoriteButtons = document.querySelectorAll('.favorite-btn');
    allFavoriteButtons.forEach(button => {
        const footprint = button.getAttribute('data-footprint');
        const type = button.getAttribute('data-type');
        
        if (footprint && type) {
            // Décoder les caractères échappés
            const decodedFootprint = footprint.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            const isFavorite = checkIfFavorite(decodedFootprint, type);
            
            if (isFavorite) {
                button.classList.add('favorited');
                button.title = 'Retirer des favoris';
                button.innerHTML = '<i class="fas fa-heart"></i>';
            } else {
                button.classList.remove('favorited');
                button.title = 'Ajouter aux favoris';
                button.innerHTML = '<i class="fas fa-heart"></i>';
            }
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation de l\'application...');
    
    // Event listener simple pour les boutons favoris
    document.addEventListener('click', function(e) {
        console.log('🖱️ Clic détecté sur:', e.target, 'Closest remove-favorite-btn:', e.target.closest('.remove-favorite-btn'));
        
        // Boutons favoris
        if (e.target.closest('.favorite-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const button = e.target.closest('.favorite-btn');
            const footprint = button.getAttribute('data-footprint');
            const type = button.getAttribute('data-type');
            console.log('🖱️ Clic sur bouton favori:', {footprint, type});
            if (footprint && type) {
                toggleFavorite(footprint, type);
            }
        }
        // Boutons dans la section favoris
        else if (e.target.closest('.remove-favorite-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const button = e.target.closest('.remove-favorite-btn');
            const footprint = button.getAttribute('data-footprint');
            const type = button.getAttribute('data-type');
            console.log('🗑️ Clic sur bouton supprimer favori:', {footprint, type, button});
            if (footprint && type) {
                removeFromFavorites(footprint, type);
            } else {
                console.error('❌ Paramètres manquants pour suppression:', {footprint, type});
            }
        }
        // Sélecteur de thème
        else if (e.target.closest('.theme-option')) {
            e.preventDefault();
            e.stopPropagation();
            const themeOption = e.target.closest('.theme-option');
            const theme = themeOption.getAttribute('data-theme');
            console.log('🎨 Changement de thème:', theme);
            switchTheme(theme);
        }
    });
    
    // Fonction pour créer un bouton favori
    function createFavoriteButton(footprint, type) {
        const isFavorite = checkIfFavorite(footprint, type);
        
        return `
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                    data-footprint="${footprint}" 
                    data-type="${type}"
                    title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                ${isFavorite ? '❤️' : '🤍'}
            </button>
        `;
    }


    // Charger le thème sauvegardé
    loadSavedTheme();
    
    // Mettre à jour tous les boutons favoris au chargement
    updateAllFavoriteButtons();
    
    // Vérifier l'état d'authentification persisté
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedAuth === 'true' && savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isAuthenticated = true;
            console.log('✅ État d\'authentification restauré depuis localStorage');
        } catch (error) {
            console.error('❌ Erreur parsing utilisateur sauvegardé:', error);
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
        }
    }
    
    // Initialiser Supabase en premier
    await initSupabase();
    
    // Initialiser l'application (navigation, événements, etc.)
    initializeApp();
    
    // Configurer les event listeners d'authentification
    setupAuthEventListeners();
    
    // Pré-remplir l'email si "Se souvenir de moi" était activé
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            emailInput.value = savedEmail;
            // Cocher automatiquement "Se souvenir de moi"
            const rememberMeCheckbox = document.getElementById('rememberMe');
            if (rememberMeCheckbox) {
                rememberMeCheckbox.checked = true;
            }
        }
    }
    
    // Vérifier l'état d'authentification d'abord
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedUserData = localStorage.getItem('currentUser');
    
    if (isAuthenticated && savedUserData) {
        // Utilisateur connecté, restaurer les variables globales
        window.isAuthenticated = true;
        window.currentUser = JSON.parse(savedUserData);
        
        // Charger les données
        await loadData();
        
        // Restaurer la page précédente ou afficher la page par défaut
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage && document.getElementById(`${savedPage}-page`)) {
            switchPage(savedPage);
            
            // Si on est sur la page de détail du projet, restaurer le projet
            if (savedPage === 'project-detail') {
                const savedProjectId = localStorage.getItem('currentProjectId');
                if (savedProjectId) {
                    currentProjectId = parseInt(savedProjectId);
                    // Attendre que les données soient chargées avant de charger le projet
                    setTimeout(() => {
                        loadProjectDetail(currentProjectId);
                    }, 100);
                }
            }
        } else {
            switchPage('ninjalinking');
        }
    } else if (rememberMe && savedUserData) {
        // "Se souvenir de moi" activé, restaurer les variables globales
        window.isAuthenticated = true;
        window.currentUser = JSON.parse(savedUserData);
        
        // Charger les données
        await loadData();
        
        // Restaurer la page précédente ou afficher la page par défaut
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage && document.getElementById(`${savedPage}-page`)) {
            switchPage(savedPage);
            
            // Si on est sur la page de détail du projet, restaurer le projet
            if (savedPage === 'project-detail') {
                const savedProjectId = localStorage.getItem('currentProjectId');
                if (savedProjectId) {
                    currentProjectId = parseInt(savedProjectId);
                    // Attendre que les données soient chargées avant de charger le projet
                    setTimeout(() => {
                        loadProjectDetail(currentProjectId);
                    }, 100);
                }
            }
        } else {
            switchPage('ninjalinking');
        }
    } else {
        // Utilisateur non connecté, afficher la page d'accueil
        console.log('❌ Utilisateur non connecté, affichage de la page d\'accueil');
        showHomepage();
    }
    
    // Ajouter un bouton de configuration Supabase si pas configuré
    if (!isSupabaseConfigured) {
        addSupabaseConfigButton();
    }
});

function initializeApp() {
    console.log('🔧 Initialisation de l\'application...');
    
    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log(`📱 Boutons de navigation trouvés: ${navButtons.length}`);
    
    navButtons.forEach((btn, index) => {
        console.log(`🔗 Bouton ${index + 1}:`, btn.dataset.page, btn.textContent);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Clic sur le bouton:', btn.dataset.page);
            switchPage(btn.dataset.page);
        });
    });

    // Catégories de footprints
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            // Vérifier si c'est une carte de la page SERP
            if (card.closest('#serp-page')) {
                toggleSerpCategory(card.dataset.category);
            } else if (card.closest('#ereputation-page')) {
                toggleEreputationCategory(card.dataset.category);
            } else if (card.closest('#ia-page')) {
                toggleIaCategory(card.dataset.category);
            } else {
                toggleCategory(card.dataset.category);
            }
        });
    });

    // Formulaires
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', saveProject);
        console.log('Événement submit attaché au formulaire de projet');
    } else {
        console.error('Formulaire de projet non trouvé');
    }

    // Event listener pour mettre à jour les prompts IA quand le mot-clé change
    const iaKeywordInput = document.getElementById('iaKeyword');
    if (iaKeywordInput) {
        iaKeywordInput.addEventListener('input', updateIaPrompts);
    }

    const siteForm = document.getElementById('siteForm');
    if (siteForm) {
        siteForm.addEventListener('submit', saveSite);
    }

    // Filtres du catalogue
    const catalogSearch = document.getElementById('catalogSearch');
    if (catalogSearch) {
        catalogSearch.addEventListener('input', filterSites);
    }

    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterSites);
    }

    const themeFilter = document.getElementById('themeFilter');
    if (themeFilter) {
        themeFilter.addEventListener('change', filterSites);
    }

    // Sélection multiple
    const selectAllSites = document.getElementById('selectAllSites');
    if (selectAllSites) {
        selectAllSites.addEventListener('change', toggleSelectAllSites);
    }

    // Filtres des projets
    const projectSearch = document.getElementById('projectSearch');
    if (projectSearch) {
        projectSearch.addEventListener('input', filterProjects);
    }

    const objectiveFilter = document.getElementById('objectiveFilter');
    if (objectiveFilter) {
        objectiveFilter.addEventListener('change', filterProjects);
    }

    // Gestion des mots-clés
    const keywordInput = document.getElementById('keywordInput');
    if (keywordInput) {
        keywordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
            }
        });
    }

    // Formulaire d'ajout de spot
    const addSpotForm = document.getElementById('addSpotForm');
    if (addSpotForm) {
        addSpotForm.addEventListener('submit', saveNewSpot);
    }

    // Formulaire d'édition de spot
    const editSpotForm = document.getElementById('editSpotForm');
    if (editSpotForm) {
        editSpotForm.addEventListener('submit', saveEditedSpot);
    }

    // Formulaire d'édition du projet
    const projectDetailForm = document.getElementById('projectDetailForm');
    if (projectDetailForm) {
        projectDetailForm.addEventListener('submit', saveProjectFromDetail);
    }

    // Gestion des mots-clés d'édition
    const editKeywordInput = document.getElementById('editKeywordInput');
    if (editKeywordInput) {
        editKeywordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addEditKeyword();
            }
        });
    }
}

async function switchPage(pageId) {
    console.log('🔄 Changement de page vers:', pageId);
    
    // Vérifier l'authentification pour les pages privées
    const privatePages = ['catalog', 'projects', 'project-detail'];
    if (privatePages.includes(pageId) && !isAuthenticated) {
        console.log('🔒 Accès refusé - utilisateur non connecté');
        alert('Vous devez être connecté pour accéder à cette section.');
        showHomepage();
        return;
    }
    
    // Sauvegarder la page actuelle dans le localStorage
    localStorage.setItem('currentPage', pageId);
    
    // Désactiver tous les boutons de navigation
    const allNavButtons = document.querySelectorAll('.nav-btn');
    console.log(`🔘 Désactivation de ${allNavButtons.length} boutons de navigation`);
    allNavButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Masquer toutes les pages
    const allPages = document.querySelectorAll('.page');
    console.log(`📄 Masquage de ${allPages.length} pages`);
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // Activer le bouton et la page correspondants
    const activeBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        console.log('✅ Bouton activé:', activeBtn.textContent, activeBtn);
    } else {
        console.error('❌ Bouton non trouvé pour:', pageId);
        console.log('Boutons disponibles:', document.querySelectorAll('.nav-btn'));
    }

    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.classList.add('active');
        console.log('✅ Page activée:', activePage.id, activePage);
    } else {
        console.error('❌ Page non trouvée pour:', `${pageId}-page`);
        console.log('Pages disponibles:', document.querySelectorAll('.page'));
    }

    // Charger les données de la page
    if (pageId === 'projects') {
        console.log('📊 Chargement des projets...');
        renderProjects();
    } else if (pageId === 'catalog') {
        console.log('📚 Chargement du catalogue...');
        renderSites();
    } else if (pageId === 'serp') {
        console.log('🔍 Page SERP chargée');
    } else if (pageId === 'ninjalinking') {
        console.log('🤖 Page Ninja Linking chargée');
    } else if (pageId === 'ereputation') {
        console.log('⭐ Page E-Réputation chargée');
    } else if (pageId === 'ia') {
        console.log('🧠 Page IA chargée');
    }
    
    console.log('✅ Changement de page terminé');
}

function toggleCategory(category) {
    const card = document.querySelector(`[data-category="${category}"]`);
    const footprintsSection = document.getElementById('footprintsSection');
    const footprintsList = document.getElementById('footprintsList');

    if (card.classList.contains('selected')) {
        // Désélectionner la catégorie
        card.classList.remove('selected');
        removeFootprintsByCategory(category);
    } else {
        // Sélectionner la catégorie
        card.classList.add('selected');
        addFootprintsByCategory(category);
    }

    // Afficher/masquer la section footprints
    if (selectedFootprints.length > 0) {
        footprintsSection.style.display = 'block';
        renderFootprints();
    } else {
        footprintsSection.style.display = 'none';
    }
}

function addFootprintsByCategory(category) {
    const footprints = footprintsData[category] || [];
    footprints.forEach(footprint => {
        if (!selectedFootprints.includes(footprint)) {
            selectedFootprints.push(footprint);
        }
    });
}

function removeFootprintsByCategory(category) {
    const footprints = footprintsData[category] || [];
    selectedFootprints = selectedFootprints.filter(footprint => !footprints.includes(footprint));
}

function renderFootprints() {
    const footprintsList = document.getElementById('footprintsList');
    footprintsList.innerHTML = '';

    selectedFootprints.forEach(footprint => {
        const item = document.createElement('div');
        item.className = 'footprint-item';
        
        // Échapper les guillemets pour les attributs HTML
        const escapedFootprint = footprint.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        item.innerHTML = `
            <input type="checkbox" class="footprint-checkbox" data-footprint="${escapedFootprint}">
            <span class="footprint-text">${footprint}</span>
            <button class="favorite-btn" data-footprint="${escapedFootprint}" data-type="ninjalinking" title="Ajouter aux favoris">
                <i class="fas fa-heart"></i>
            </button>
        `;
        footprintsList.appendChild(item);
    });
    
    // Mettre à jour l'état des boutons favoris après création
    updateAllFavoriteButtons();
}

function getCheckedFootprints() {
    // Récupérer les cases cochées de la page Ninjalinking uniquement
    const checkedBoxes = document.querySelectorAll('#footprintsList .footprint-checkbox:checked');
    const checkedFootprints = [];
    
    checkedBoxes.forEach(checkbox => {
        // Utiliser l'attribut data-footprint si disponible, sinon le texte
        const footprint = checkbox.dataset.footprint || checkbox.nextElementSibling.textContent;
        checkedFootprints.push(footprint);
    });
    
    return checkedFootprints;
}

function getCheckedSerpFootprints() {
    // Récupérer les cases cochées de la page SERP uniquement
    const checkedBoxes = document.querySelectorAll('#serpFootprintsList .footprint-checkbox:checked');
    const checkedFootprints = [];
    
    console.log('SERP - Nombre de cases cochées trouvées:', checkedBoxes.length);
    
    checkedBoxes.forEach((checkbox, index) => {
        // Utiliser l'attribut data-footprint si disponible, sinon le texte
        const footprint = checkbox.dataset.footprint || checkbox.nextElementSibling.textContent;
        console.log(`SERP - Case ${index + 1}:`, footprint);
        checkedFootprints.push(footprint);
    });
    
    return checkedFootprints;
}

function selectAllFootprints() {
    const checkboxes = document.querySelectorAll('.footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllFootprints() {
    const checkboxes = document.querySelectorAll('.footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function generateSearches(engine = 'google') {
    const keywordInput = document.getElementById('keywordInput');
    const keyword = keywordInput.value.trim();

    if (!keyword) {
        alert('Veuillez entrer un mot-clé');
        return;
    }

    // Récupérer seulement les footprints cochés
    const checkedFootprints = getCheckedFootprints();
    
    console.log('Footprints cochés:', checkedFootprints);
    
    if (checkedFootprints.length === 0) {
        alert('Veuillez cocher au moins un footprint à utiliser');
        return;
    }

    // Remplacer "mot-clé" par le mot-clé réel dans chaque footprint
    const searches = checkedFootprints.map(footprint => 
        footprint.replace(/mot-clé/g, keyword)
    );

    console.log('Recherches générées Ninjalinking:', searches);

    // Déterminer l'URL de recherche
    let baseUrl;
    if (engine === 'bing') {
        baseUrl = 'https://www.bing.com/search?q=';
    } else {
        baseUrl = 'https://www.google.com/search?q=';
    }

    // Ouvrir chaque recherche dans un nouvel onglet
    searches.forEach(search => {
        const url = `${baseUrl}${encodeURIComponent(search)}`;
        console.log('URL générée Ninjalinking:', url);
        window.open(url, '_blank');
    });
}



// Données des footprints SERP par catégorie
const serpFootprintsData = {
    'analyse-concurrents': [
        '"mot-clé" inurl:/blog/',
        '"mot-clé" intitle:"guide complet"',
        '"mot-clé" intitle:"avis"',
        '"mot-clé" inurl:/comparatif/',
        '"mot-clé" inurl:/produit/',
        '"mot-clé" intitle:"test et avis"'
    ],
    'contenus-autorite': [
        '"mot-clé" inurl:/2025/',
        '"mot-clé" intitle:"tout savoir sur"',
        '"mot-clé" intitle:"FAQ"',
        '"mot-clé" inurl:/dossier/',
        '"mot-clé" inurl:/ressources/'
    ],
    'contenus-seo': [
        '"mot-clé" inurl:/seo/',
        '"mot-clé" intitle:"guide"',
        '"mot-clé" intitle:"meilleurs"',
        '"mot-clé" intitle:"comment faire"'
    ],
    'operateurs-date': [
        '"mot-clé" after:2024-01-01',
        '"mot-clé" before:2023-12-31',
        '"mot-clé" after:2023-01-01 before:2023-12-31',
        '"mot-clé" after:2025-01-01'
    ],
    'fichiers-telechargeables': [
        '"mot-clé" filetype:pdf',
        '"mot-clé" filetype:doc',
        '"mot-clé" filetype:xls',
        '"mot-clé" filetype:ppt',
        '"mot-clé" filetype:txt',
        '"mot-clé" filetype:csv'
    ]
};

// Données des footprints E-Réputation par catégorie
const ereputationFootprintsData = {
    'avis-notations': [
        '"mot-clé" site:trustpilot.com',
        '"mot-clé" site:avis-verifies.com',
        '"mot-clé" site:tripadvisor.fr',
        '"mot-clé" site:google.com inurl:/maps/place/',
        '"mot-clé" intitle:"avis"',
        '"mot-clé" intitle:"témoignages"',
        '"mot-clé" "retours clients"'
    ],
    'forums-discussion': [
        '"mot-clé" site:forum.hardware.fr',
        '"mot-clé" site:commentcamarche.net',
        '"mot-clé" site:jeuxvideo.com/forums/',
        '"mot-clé" site:doctissimo.fr',
        '"mot-clé" site:aufeminin.com/forum/',
        '"mot-clé" site:forum.frandroid.com',
        '"mot-clé" site:forum-auto.caradisiac.com',
        '"mot-clé" inurl:/forum/',
        '"mot-clé" inurl:viewtopic.php',
        '"mot-clé" inurl:/discussions/'
    ],
    'blogs-articles': [
        '"mot-clé" inurl:/blog/',
        '"mot-clé" intitle:"notre avis sur"',
        '"mot-clé" intitle:"expérience avec"',
        '"mot-clé" "nous avons testé"',
        '"mot-clé" "ce que pensent les utilisateurs"'
    ],
    'reseaux-sociaux': [
        '"mot-clé" site:twitter.com',
        '"mot-clé" site:facebook.com',
        '"mot-clé" site:linkedin.com',
        '"mot-clé" site:instagram.com',
        '"mot-clé" site:reddit.com',
        '"mot-clé" site:quora.com'
    ],
    'contenus-autorite': [
        '"mot-clé" filetype:pdf',
        '"mot-clé" filetype:doc',
        '"mot-clé" filetype:ppt'
    ],
    'charge-emotionnelle': [
        '"mot-clé" avis négatif',
        '"mot-clé" arnaque',
        '"mot-clé" escroquerie',
        '"mot-clé" mensonge',
        '"mot-clé" tromperie',
        '"mot-clé" mauvaise expérience',
        '"mot-clé" retour d\'expérience',
        '"mot-clé" problème avec',
        '"mot-clé" service client nul',
        '"mot-clé" déçu',
        '"mot-clé" déception',
        '"mot-clé" plainte',
        '"mot-clé" litige',
        '"mot-clé" dangereux'
    ],
    'retours-utilisateurs': [
        '"mot-clé" intitle:"avis"',
        '"mot-clé" intitle:"témoignages"',
        '"mot-clé" "retours clients"',
        '"mot-clé" "retour d\'expérience"',
        '"mot-clé" "que pensent les gens de"',
        '"mot-clé" "est-ce fiable"',
        '"mot-clé" "votre avis"'
    ],
    'filtres-temporels': [
        '"mot-clé" after:2024-01-01',
        '"mot-clé" before:2023-12-31',
        '"mot-clé" after:2023-01-01 before:2023-12-31'
    ]
};

// Données des prompts IA par catégorie
const iaPromptsData = {
    'ereputation': [
        'Analyse l\'e-réputation en ligne du mot-clé : "mot-clé". Identifie les pages critiques, les plateformes d\'avis, forums, réseaux sociaux ou articles de blog qui mentionnent ce mot-clé. Dresse un bilan synthétique des risques ou signaux positifs.',
        'Effectue une veille e-réputation complète pour "mot-clé". Recherche les mentions négatives, les avis clients, les discussions sur les forums et les réseaux sociaux. Propose un plan d\'action pour améliorer l\'image de marque.',
        'Analyse la présence digitale de "mot-clé" sur les principales plateformes (Google, Trustpilot, TripAdvisor, forums, réseaux sociaux). Identifie les points d\'amélioration et les opportunités de communication.'
    ],
    'concurrence': [
        'Analyse la concurrence pour "mot-clé". Identifie les principaux concurrents, leurs stratégies marketing, leurs points forts et faibles. Propose des recommandations pour se différencier.',
        'Effectue une analyse concurrentielle approfondie de "mot-clé". Compare les offres, les prix, les stratégies de communication et les positions sur les moteurs de recherche.',
        'Dresse un panorama concurrentiel complet pour "mot-clé". Analyse les forces et faiblesses de chaque acteur, leurs stratégies digitales et leurs performances.'
    ],
    'seo': [
        'Optimise le référencement naturel pour "mot-clé". Analyse les mots-clés pertinents, la structure du site, le contenu et propose un plan d\'action SEO complet.',
        'Effectue un audit SEO complet pour "mot-clé". Identifie les opportunités d\'amélioration technique, de contenu et de netlinking. Propose une stratégie de référencement.',
        'Analyse la visibilité de "mot-clé" sur les moteurs de recherche. Identifie les mots-clés à cibler, les contenus à créer et les optimisations techniques nécessaires.'
    ],
    'contenu': [
        'Crée une stratégie de contenu pour "mot-clé". Propose des sujets d\'articles, des formats de contenu et un calendrier éditorial adapté à la cible.',
        'Développe un plan de création de contenu autour de "mot-clé". Identifie les besoins informationnels de la cible et propose des formats de contenu engageants.',
        'Conçoit une stratégie éditoriale pour "mot-clé". Analyse les sujets tendances, les formats performants et propose un plan de publication optimisé.'
    ],
    'social': [
        'Développe une stratégie de communication sur les réseaux sociaux pour "mot-clé". Identifie les plateformes pertinentes, les types de contenu et les tactiques d\'engagement.',
        'Crée un plan de présence sociale pour "mot-clé". Analyse les audiences, les tendances et propose une stratégie de community management.',
        'Optimise la présence sur les réseaux sociaux pour "mot-clé". Identifie les opportunités d\'engagement, les formats de contenu performants et les tactiques de croissance.'
    ],
    'marketing': [
        'Développe une stratégie marketing complète pour "mot-clé". Analyse le marché, la cible et propose un mix marketing adapté (digital, traditionnel, événementiel).',
        'Crée un plan marketing 360° pour "mot-clé". Identifie les canaux de communication, les messages clés et les tactiques d\'acquisition et de fidélisation.',
        'Conçoit une stratégie de croissance pour "mot-clé". Analyse les leviers de croissance, les opportunités de partenariat et propose un plan d\'action marketing.'
    ]
};


// Variables pour les footprints SERP (copie exacte de Ninjalinking)
let selectedSerpFootprints = [];

// Variables pour les footprints E-Réputation
let selectedEreputationFootprints = [];

// Variables pour les prompts IA
let selectedIaPrompts = [];

// Fonction pour basculer la sélection d'une catégorie SERP (copie exacte de toggleCategory)
function toggleSerpCategory(category) {
    const card = document.querySelector(`#serp-page [data-category="${category}"]`);
    const footprintsSection = document.getElementById('serpFootprintsSection');
    const footprintsList = document.getElementById('serpFootprintsList');

    if (card.classList.contains('selected')) {
        // Désélectionner la catégorie
        card.classList.remove('selected');
        removeSerpFootprintsByCategory(category);
    } else {
        // Sélectionner la catégorie
        card.classList.add('selected');
        addSerpFootprintsByCategory(category);
    }

    // Afficher/masquer la section footprints
    if (selectedSerpFootprints.length > 0) {
        footprintsSection.style.display = 'block';
        renderSerpFootprints();
    } else {
        footprintsSection.style.display = 'none';
    }
    
    // Afficher/masquer la sélection d'année et de dates
    updateSerpYearSelection();
    updateSerpDateSelection();
}

function addSerpFootprintsByCategory(category) {
    const footprints = serpFootprintsData[category] || [];
    footprints.forEach(footprint => {
        if (!selectedSerpFootprints.includes(footprint)) {
            selectedSerpFootprints.push(footprint);
        }
    });
}

function removeSerpFootprintsByCategory(category) {
    const footprints = serpFootprintsData[category] || [];
    selectedSerpFootprints = selectedSerpFootprints.filter(footprint => !footprints.includes(footprint));
}

function renderSerpFootprints() {
    const footprintsList = document.getElementById('serpFootprintsList');
    footprintsList.innerHTML = '';

    selectedSerpFootprints.forEach(footprint => {
        const item = document.createElement('div');
        item.className = 'footprint-item';
        
        // Échapper les guillemets pour les attributs HTML
        const escapedFootprint = footprint.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        item.innerHTML = `
            <input type="checkbox" class="footprint-checkbox" data-footprint="${escapedFootprint}">
            <span class="footprint-text">${footprint}</span>
            <button class="favorite-btn" data-footprint="${escapedFootprint}" data-type="serp" title="Ajouter aux favoris">
                <i class="fas fa-heart"></i>
            </button>
        `;
        footprintsList.appendChild(item);
    });
    
    // Mettre à jour l'état des boutons favoris après création
    updateAllFavoriteButtons();
}


function getSelectedSerpOperators() {
    return selectedSerpFootprints;
}

// Fonction pour mettre à jour l'affichage de la sélection de dates
// Fonctions unifiées pour la gestion des sélecteurs
function updateYearSelection(pagePrefix, selectedFootprints) {
    const yearSelection = document.getElementById(`${pagePrefix}YearSelection`);
    const hasYearFootprints = selectedFootprints.some(footprint => 
        footprint.includes('/2025/')
    );
    
    if (hasYearFootprints) {
        yearSelection.style.display = 'block';
    } else {
        yearSelection.style.display = 'none';
    }
}

function updateDateSelection(pagePrefix, selectedFootprints) {
    const dateSelection = document.getElementById(`${pagePrefix}DateSelection`);
    const hasDateFootprints = selectedFootprints.some(footprint => 
        footprint.includes('after:') || footprint.includes('before:')
    );
    
    if (hasDateFootprints) {
        dateSelection.style.display = 'block';
    } else {
        dateSelection.style.display = 'none';
    }
}

// Fonction unifiée pour récupérer les dates et l'année sélectionnées
function getSelectedDatesAndYear(pagePrefix) {
    const selectedYear = document.getElementById(`${pagePrefix}Year`).value;
    const dateFrom = document.getElementById(`${pagePrefix}DateFrom`).value;
    const dateTo = document.getElementById(`${pagePrefix}DateTo`).value;
    
    return {
        year: selectedYear,
        dateFrom: dateFrom,
        dateTo: dateTo
    };
}

function updateSerpYearSelection() {
    updateYearSelection('serp', selectedSerpFootprints);
}

function updateSerpDateSelection() {
    updateDateSelection('serp', selectedSerpFootprints);
}

// Fonction pour lancer les recherches sur Google ou Bing
function testSerpOperators(engine = 'google') {
    const keyword = document.getElementById('serpKeyword').value.trim();
    if (!keyword) {
        alert('Veuillez entrer un mot-clé');
        return;
    }
    
    // Récupérer seulement les footprints cochés de la page SERP
    const checkedFootprints = getCheckedSerpFootprints();
    
    console.log('SERP - Footprints cochés:', checkedFootprints);
    
    if (checkedFootprints.length === 0) {
        alert('Veuillez cocher au moins un footprint à utiliser');
        return;
    }
    
    // Récupérer l'année et les dates sélectionnées
    const { year: selectedYear, dateFrom, dateTo } = getSelectedDatesAndYear('serp');
    
    console.log('SERP - Année sélectionnée:', selectedYear);
    console.log('SERP - Date de début:', dateFrom);
    console.log('SERP - Date de fin:', dateTo);
    
    // Remplacer "mot-clé" par le mot-clé réel dans chaque footprint
    const searches = checkedFootprints.map(footprint => {
        let processedFootprint = footprint;
        
        console.log('SERP - Footprint original:', footprint);
        
        // Remplacer "mot-clé" par le mot-clé réel
        processedFootprint = processedFootprint.replace(/mot-clé/g, keyword);
        
        // Remplacer l'année dans les footprints
        if (footprint.includes('/2025/')) {
            processedFootprint = processedFootprint.replace('/2025/', `/${selectedYear}/`);
        }
        
        // Remplacer les dates dans les footprints
        if (dateFrom) {
            // Remplacer toutes les dates after: par la date de début sélectionnée
            processedFootprint = processedFootprint.replace(/after:\d{4}-\d{2}-\d{2}/g, `after:${dateFrom}`);
        }
        if (dateTo) {
            // Remplacer toutes les dates before: par la date de fin sélectionnée
            processedFootprint = processedFootprint.replace(/before:\d{4}-\d{2}-\d{2}/g, `before:${dateTo}`);
        }
        
        console.log('SERP - Footprint traité:', processedFootprint);
        
        return processedFootprint;
    });
    
    console.log('SERP - Recherches générées:', searches);
    
    // Déterminer l'URL de recherche
    let baseUrl;
    if (engine === 'bing') {
        baseUrl = 'https://www.bing.com/search?q=';
    } else {
        baseUrl = 'https://www.google.com/search?q=';
    }
    
    // Ouvrir chaque recherche dans un nouvel onglet
    searches.forEach(search => {
        const url = `${baseUrl}${encodeURIComponent(search)}`;
        console.log('SERP - URL générée:', url);
        window.open(url, '_blank');
    });
}

// Fonctions pour E-Réputation (copie des fonctions SERP)
function toggleEreputationCategory(category) {
    const card = document.querySelector(`#ereputation-page [data-category="${category}"]`);
    const footprintsSection = document.getElementById('ereputationFootprintsSection');
    
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        removeEreputationFootprintsByCategory(category);
    } else {
        card.classList.add('selected');
        addEreputationFootprintsByCategory(category);
    }
    
    if (selectedEreputationFootprints.length > 0) {
        footprintsSection.style.display = 'block';
        renderEreputationFootprints();
    } else {
        footprintsSection.style.display = 'none';
    }
    
    // Afficher/masquer la sélection d'année et de dates
    updateEreputationYearSelection();
    updateEreputationDateSelection();
}

function addEreputationFootprintsByCategory(category) {
    const footprints = ereputationFootprintsData[category] || [];
    footprints.forEach(footprint => {
        if (!selectedEreputationFootprints.includes(footprint)) {
            selectedEreputationFootprints.push(footprint);
        }
    });
}

function removeEreputationFootprintsByCategory(category) {
    const footprints = ereputationFootprintsData[category] || [];
    selectedEreputationFootprints = selectedEreputationFootprints.filter(footprint => !footprints.includes(footprint));
}

function renderEreputationFootprints() {
    const footprintsList = document.getElementById('ereputationFootprintsList');
    footprintsList.innerHTML = '';

    selectedEreputationFootprints.forEach(footprint => {
        const item = document.createElement('div');
        item.className = 'footprint-item';
        
        // Échapper les guillemets pour les attributs HTML
        const escapedFootprint = footprint.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        item.innerHTML = `
            <input type="checkbox" class="footprint-checkbox" data-footprint="${escapedFootprint}">
            <span class="footprint-text">${footprint}</span>
            <button class="favorite-btn" data-footprint="${escapedFootprint}" data-type="ereputation" title="Ajouter aux favoris">
                <i class="fas fa-heart"></i>
            </button>
        `;
        footprintsList.appendChild(item);
    });
    
    // Mettre à jour l'état des boutons favoris après création
    updateAllFavoriteButtons();
}


function getCheckedEreputationFootprints() {
    // Récupérer les cases cochées de la page E-Réputation uniquement
    const checkedBoxes = document.querySelectorAll('#ereputationFootprintsList .footprint-checkbox:checked');
    const checkedFootprints = [];
    
    console.log('E-Réputation - Nombre de cases cochées trouvées:', checkedBoxes.length);
    
    checkedBoxes.forEach((checkbox, index) => {
        // Utiliser l'attribut data-footprint si disponible, sinon le texte
        const footprint = checkbox.dataset.footprint || checkbox.nextElementSibling.textContent;
        console.log(`E-Réputation - Case ${index + 1}:`, footprint);
        checkedFootprints.push(footprint);
    });
    
    return checkedFootprints;
}

function updateEreputationYearSelection() {
    updateYearSelection('ereputation', selectedEreputationFootprints);
}

function updateEreputationDateSelection() {
    updateDateSelection('ereputation', selectedEreputationFootprints);
}

// Fonction pour lancer les recherches E-Réputation sur Google ou Bing
function testEreputationOperators(engine = 'google') {
    const keyword = document.getElementById('ereputationKeyword').value.trim();
    if (!keyword) {
        alert('Veuillez entrer un mot-clé');
        return;
    }
    
    // Récupérer seulement les footprints cochés de la page E-Réputation
    const checkedFootprints = getCheckedEreputationFootprints();
    
    console.log('E-Réputation - Footprints cochés:', checkedFootprints);
    
    if (checkedFootprints.length === 0) {
        alert('Veuillez cocher au moins un footprint à utiliser');
        return;
    }
    
    // Récupérer l'année et les dates sélectionnées
    const { year: selectedYear, dateFrom, dateTo } = getSelectedDatesAndYear('ereputation');
    
    console.log('E-Réputation - Année sélectionnée:', selectedYear);
    console.log('E-Réputation - Date de début:', dateFrom);
    console.log('E-Réputation - Date de fin:', dateTo);
    
    // Remplacer "mot-clé" par le mot-clé réel dans chaque footprint
    const searches = checkedFootprints.map(footprint => {
        let processedFootprint = footprint;
        
        console.log('E-Réputation - Footprint original:', footprint);
        
        // Remplacer "mot-clé" par le mot-clé réel
        processedFootprint = processedFootprint.replace(/mot-clé/g, keyword);
        
        // Remplacer l'année dans les footprints
        if (footprint.includes('/2025/')) {
            processedFootprint = processedFootprint.replace('/2025/', `/${selectedYear}/`);
        }
        
        // Remplacer les dates dans les footprints
        if (dateFrom) {
            // Remplacer toutes les dates after: par la date de début sélectionnée
            processedFootprint = processedFootprint.replace(/after:\d{4}-\d{2}-\d{2}/g, `after:${dateFrom}`);
        }
        if (dateTo) {
            // Remplacer toutes les dates before: par la date de fin sélectionnée
            processedFootprint = processedFootprint.replace(/before:\d{4}-\d{2}-\d{2}/g, `before:${dateTo}`);
        }
        
        console.log('E-Réputation - Footprint traité:', processedFootprint);
        
        return processedFootprint;
    });
    
    console.log('E-Réputation - Recherches générées:', searches);
    
    // Déterminer l'URL de recherche
    let baseUrl;
    if (engine === 'bing') {
        baseUrl = 'https://www.bing.com/search?q=';
    } else {
        baseUrl = 'https://www.google.com/search?q=';
    }
    
    // Ouvrir chaque recherche dans un nouvel onglet
    searches.forEach(search => {
        const url = `${baseUrl}${encodeURIComponent(search)}`;
        console.log('E-Réputation - URL générée:', url);
        window.open(url, '_blank');
    });
}

// Fonctions pour la page IA
function toggleIaCategory(category) {
    console.log('Toggle IA category:', category);
    const card = document.querySelector(`#ia-page [data-category="${category}"]`);
    const promptsSection = document.getElementById('iaPromptsSection');
    
    console.log('Card found:', card);
    console.log('Prompts section found:', promptsSection);
    
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        removeIaPromptsByCategory(category);
    } else {
        card.classList.add('selected');
        addIaPromptsByCategory(category);
    }
    
    console.log('Selected IA prompts:', selectedIaPrompts);
    
    if (selectedIaPrompts.length > 0) {
        promptsSection.style.display = 'block';
        renderIaPrompts();
    } else {
        promptsSection.style.display = 'none';
    }
}

function addIaPromptsByCategory(category) {
    const prompts = iaPromptsData[category] || [];
    console.log('Adding prompts for category:', category, 'Prompts found:', prompts);
    prompts.forEach(prompt => {
        if (!selectedIaPrompts.includes(prompt)) {
            selectedIaPrompts.push(prompt);
        }
    });
    console.log('After adding, selected prompts:', selectedIaPrompts);
}

function removeIaPromptsByCategory(category) {
    const prompts = iaPromptsData[category] || [];
    selectedIaPrompts = selectedIaPrompts.filter(prompt => !prompts.includes(prompt));
}

function renderIaPrompts() {
    console.log('Rendering IA prompts:', selectedIaPrompts);
    const promptsList = document.getElementById('iaPromptsList');
    console.log('Prompts list element:', promptsList);
    promptsList.innerHTML = '';

    selectedIaPrompts.forEach((prompt, index) => {
        const item = document.createElement('div');
        item.className = 'prompt-item';
        
        // Remplacer "mot-clé" par le mot-clé réel
        const processedPrompt = prompt.replace(/mot-clé/g, document.getElementById('iaKeyword').value || 'mot-clé');
        
        item.innerHTML = `
            <div class="prompt-content">
                <span class="prompt-text">${processedPrompt}</span>
                <button class="remove-prompt" onclick="removeIaPrompt('${prompt.replace(/'/g, "\\'")}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <button type="button" class="esb-button esb-share-button esb-button-chatgpt" data-prompt="${processedPrompt.replace(/"/g, '&quot;')}">
                <i class="fas fa-robot"></i> Lancer sur ChatGPT
            </button>
        `;
        promptsList.appendChild(item);
    });
    
    // Ajouter les event listeners pour les boutons ChatGPT
    const chatgptButtons = promptsList.querySelectorAll('.esb-button-chatgpt');
    chatgptButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prompt = this.getAttribute('data-prompt');
            launchChatGPT(prompt);
        });
    });
}

function removeIaPrompt(prompt) {
    selectedIaPrompts = selectedIaPrompts.filter(p => p !== prompt);
    
    // Vérifier si toutes les catégories de ce prompt sont désélectionnées
    Object.keys(iaPromptsData).forEach(category => {
        const categoryPrompts = iaPromptsData[category];
        if (categoryPrompts.includes(prompt)) {
            const hasOtherPrompts = categoryPrompts.some(p => selectedIaPrompts.includes(p));
            if (!hasOtherPrompts) {
                const card = document.querySelector(`#ia-page [data-category="${category}"]`);
                if (card) {
                    card.classList.remove('selected');
                }
            }
        }
    });
    
    renderIaPrompts();
    
    if (selectedIaPrompts.length === 0) {
        document.getElementById('iaPromptsSection').style.display = 'none';
    }
}

function selectAllIaPrompts() {
    const checkboxes = document.querySelectorAll('#iaPromptsList .prompt-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllIaPrompts() {
    const checkboxes = document.querySelectorAll('#iaPromptsList .prompt-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Fonction pour mettre à jour les prompts quand le mot-clé change
function updateIaPrompts() {
    if (selectedIaPrompts.length > 0) {
        renderIaPrompts();
    }
}

// Fonction pour lancer ChatGPT avec un prompt
function launchChatGPT(prompt) {
    // Encoder le prompt pour l'URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // URL de ChatGPT avec le prompt (nouveau format)
    const chatgptUrl = `https://chat.openai.com/?model=gpt-4&prompt=${encodedPrompt}`;
    
    // Ouvrir ChatGPT dans un nouvel onglet
    window.open(chatgptUrl, '_blank');
    
    console.log('ChatGPT lancé avec le prompt:', prompt);
}


// Fonctions pour sélectionner/désélectionner tous les footprints SERP (copie exacte de Ninjalinking)
function selectAllSerpFootprints() {
    const checkboxes = document.querySelectorAll('#serpFootprintsList .footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllSerpFootprints() {
    const checkboxes = document.querySelectorAll('#serpFootprintsList .footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Fonctions pour sélectionner/désélectionner tous les footprints E-Réputation
function selectAllEreputationFootprints() {
    const checkboxes = document.querySelectorAll('#ereputationFootprintsList .footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllEreputationFootprints() {
    const checkboxes = document.querySelectorAll('#ereputationFootprintsList .footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Gestion des projets
function openProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('modalProjectTitle');
    const form = document.getElementById('projectForm');

    editingProjectId = projectId;

    if (projectId) {
        title.textContent = 'Modifier le projet';
        const project = projects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectUrl').value = project.url;
            document.getElementById('projectObjective').value = project.objective;
            document.getElementById('projectTraffic').value = project.traffic || '';
            document.getElementById('projectTrustFlow').value = project.trustFlow || '';
            document.getElementById('projectTTF').value = project.ttf || '';
            document.getElementById('projectReferringDomains').value = project.referringDomains || '';
            document.getElementById('projectPublicationGoal').value = project.publicationGoal || '';
            document.getElementById('projectBudget').value = project.budget || '';
            
            // Charger les mots-clés
            currentKeywords = project.keywords || [];
            renderKeywords();
        }
    } else {
        title.textContent = 'Nouveau Projet';
        form.reset();
        currentKeywords = [];
        renderKeywords();
    }

    modal.style.display = 'block';
}

function closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
    editingProjectId = null;
    currentKeywords = [];
}

// Gestion des mots-clés
window.addKeyword = function() {
    console.log('addKeyword appelée');
    const input = document.getElementById('keywordInput');
    
    if (!input) {
        console.error('Input keywordInput non trouvé');
        return;
    }
    
    const keywordsText = input.value.trim();
    console.log('Mots-clés saisis:', keywordsText);
    
    if (keywordsText) {
        // Séparer les mots-clés par virgule et nettoyer
        const keywords = keywordsText.split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        // Ajouter les nouveaux mots-clés (éviter les doublons)
        keywords.forEach(keyword => {
            if (!currentKeywords.includes(keyword)) {
                currentKeywords.push(keyword);
            }
        });
        
        input.value = '';
        renderKeywords();
        
        // Afficher une notification si des mots-clés ont été ajoutés
        if (keywords.length > 0) {
            showNotification(`✅ ${keywords.length} mot(s)-clé(s) ajouté(s)`, 'success');
        }
    }
}

window.removeKeyword = function(keyword) {
    currentKeywords = currentKeywords.filter(k => k !== keyword);
    renderKeywords();
}

window.renderKeywords = function() {
    const container = document.getElementById('keywordsTags');
    if (!container) {
        console.error('Container keywordsTags non trouvé');
        return;
    }
    
    container.innerHTML = '';
    
    currentKeywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
            <span>${keyword}</span>
            <button type="button" class="remove-keyword" onclick="removeKeyword('${keyword}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

async function saveProject(e) {
    e.preventDefault();
    console.log('saveProject appelée');

    const name = document.getElementById('projectName').value.trim();
    const url = document.getElementById('projectUrl').value.trim();
    const objective = document.getElementById('projectObjective').value;
    const traffic = parseInt(document.getElementById('projectTraffic').value) || 0;
    const trustFlow = parseInt(document.getElementById('projectTrustFlow').value) || 0;
    const ttf = document.getElementById('projectTTF').value;
    const referringDomains = parseInt(document.getElementById('projectReferringDomains').value) || 0;
    const publicationGoal = parseInt(document.getElementById('projectPublicationGoal').value) || 0;
    const budget = parseFloat(document.getElementById('projectBudget').value) || 0;

    console.log('Données du projet:', { name, url, objective, traffic, trustFlow, ttf, referringDomains });

    if (!name || !url || !objective) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const projectData = {
        name,
        url,
        objective,
        traffic,
        trustFlow,
        ttf,
        referringDomains,
        publicationGoal,
        budget,
        keywords: currentKeywords,
        updatedAt: new Date().toISOString()
    };

    try {
        if (isSupabaseConfigured && db) {
            // Sauvegarder avec Supabase
            if (editingProjectId) {
                const updatedProject = await db.updateProject(editingProjectId, projectData);
                const projectIndex = projects.findIndex(p => p.id === editingProjectId);
                if (projectIndex !== -1) {
                    projects[projectIndex] = updatedProject;
                }
                console.log('✅ Projet mis à jour dans Supabase');
            } else {
                const newProject = await db.saveProject(projectData);
                projects.push(newProject);
                console.log('✅ Projet créé dans Supabase');
            }
        } else {
            // Fallback localStorage
            if (editingProjectId) {
                const projectIndex = projects.findIndex(p => p.id === editingProjectId);
                if (projectIndex !== -1) {
                    projects[projectIndex] = { ...projects[projectIndex], ...projectData };
                }
            } else {
                const newId = Math.max(...projects.map(p => p.id), 0) + 1;
                projects.push({ 
                    id: newId, 
                    ...projectData,
                    createdAt: new Date().toISOString()
                });
            }
            await saveData();
            console.log('📦 Projet sauvegardé en localStorage');
        }

        renderProjects();
        updateProjectStats();
        closeProjectModal();
        
        // Afficher une confirmation de succès
        showNotification('✅ Projet ajouté avec succès !', 'success');
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde projet:', error);
        alert('Erreur lors de la sauvegarde du projet: ' + error.message);
    }
}

async function deleteProject(projectId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        try {
            if (isSupabaseConfigured && db) {
                await db.deleteProject(projectId);
                console.log('✅ Projet supprimé de Supabase');
            }
            
            projects = projects.filter(p => p.id !== projectId);
            await saveData();
            renderProjects();
            updateProjectStats();
            
        } catch (error) {
            console.error('❌ Erreur suppression projet:', error);
            alert('Erreur lors de la suppression du projet: ' + error.message);
        }
    }
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const projectCount = document.getElementById('projectCount');
    if (!grid) {
        console.error('projectsGrid non trouvé');
        return;
    }

    const filteredProjects = getFilteredProjects();
    
    if (projectCount) {
        projectCount.textContent = filteredProjects.length;
    }

    grid.innerHTML = '';

    if (filteredProjects.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>Aucun projet</h3>
                <p>Créez votre premier projet pour commencer</p>
            </div>
        `;
        return;
    }

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const trustFlowClass = getTrustFlowClass(project.trustFlow || 0);
        const trustFlowWidth = Math.min(project.trustFlow || 0, 100);
        const objectiveClass = project.objective === 'SEO' ? 'seo' : 'reputation';
        
        card.innerHTML = `
            <div class="project-header">
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <a href="${project.url}" target="_blank" class="project-url">
                        ${project.url} <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
                <div class="project-actions">
                    <input type="checkbox" class="project-checkbox" data-project-id="${project.id}" onchange="handleProjectSelection()">
                    <button class="project-action-btn edit" onclick="openProjectModal(${project.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-action-btn delete" onclick="deleteProject(${project.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="project-details">
                <div class="project-detail">
                    <span class="project-detail-label">Objectif</span>
                    <span class="project-objective ${objectiveClass}">${project.objective === 'SEO' ? 'Référencement' : project.objective}</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Trafic</span>
                    <span class="project-detail-value">${(project.traffic || 0).toLocaleString()}</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">TF</span>
                    <div class="project-trust-flow">
                        <div class="project-trust-flow-bar">
                            <div class="project-trust-flow-fill ${trustFlowClass}" style="width: ${trustFlowWidth}%"></div>
                        </div>
                        <span class="project-trust-flow-value">${project.trustFlow || 0}</span>
                    </div>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">TTF</span>
                    <span class="project-detail-value"><span class="ttf-tag ttf-${(project.ttf || 'business').toLowerCase()}">${project.ttf || 'N/A'}</span></span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Domaines référents</span>
                    <span class="project-detail-value">${project.referringDomains || 0}</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Budget alloué</span>
                    <span class="project-detail-value budget-allocated">${(project.budget || 0).toFixed(2)} €</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Budget dépensé</span>
                    <span class="project-detail-value budget-spent">${calculateProjectSpentBudget(project).toFixed(2)} €</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Budget restant</span>
                    <span class="project-detail-value budget-remaining ${getBudgetRemainingClass(project)}">${calculateProjectRemainingBudget(project).toFixed(2)} €</span>
                </div>
            </div>
            ${project.keywords && project.keywords.length > 0 ? `
                <div class="project-keywords">
                    <div class="project-keywords-label">Mots-clés à travailler</div>
                    <div class="project-keywords-list">
                        ${project.keywords.map(keyword => `
                            <span class="project-keyword-tag">${keyword}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <button class="project-spots-btn" onclick="viewProjectSpots(${project.id})">
                Voir le projet
            </button>
        `;
        grid.appendChild(card);
    });
}

// Fonction pour calculer le budget dépensé d'un projet
function calculateProjectSpentBudget(project) {
    if (!project.spots || !Array.isArray(project.spots)) {
        return 0;
    }
    
    // Calculer le budget dépensé (spots avec statut "Publié")
    return project.spots
        .filter(spot => spot.status === 'Publié')
        .reduce((sum, spot) => sum + (spot.price || 0), 0);
}

// Fonction pour calculer le budget restant d'un projet
function calculateProjectRemainingBudget(project) {
    const allocatedBudget = project.budget || 0;
    const spentBudget = calculateProjectSpentBudget(project);
    return Math.max(0, allocatedBudget - spentBudget);
}

// Fonction pour déterminer la classe CSS selon le budget restant
function getBudgetRemainingClass(project) {
    const remainingBudget = calculateProjectRemainingBudget(project);
    const allocatedBudget = project.budget || 0;
    
    if (remainingBudget === 0 && allocatedBudget > 0) {
        return 'no-budget';
    } else if (remainingBudget < allocatedBudget * 0.2 && allocatedBudget > 0) {
        return 'low-budget';
    }
    
    return '';
}

function getFilteredProjects() {
    const searchElement = document.getElementById('projectSearch');
    const filterElement = document.getElementById('objectiveFilter');
    
    const searchTerm = searchElement ? searchElement.value.toLowerCase() : '';
    const objectiveFilter = filterElement ? filterElement.value : '';

    return projects.filter(project => {
        const matchesSearch = !searchTerm || 
                             project.name.toLowerCase().includes(searchTerm) ||
                             project.url.toLowerCase().includes(searchTerm);
        const matchesObjective = !objectiveFilter || project.objective === objectiveFilter;
        
        return matchesSearch && matchesObjective;
    });
}

function filterProjects() {
    renderProjects();
}

function updateProjectStats() {
    const totalCount = projects.length;
    const seoCount = projects.filter(p => p.objective === 'SEO').length;
    const reputationCount = projects.filter(p => p.objective === 'E-Réputation').length;
    
    // Calculer les projets de ce mois (simulation)
    const currentMonth = new Date().getMonth();
    const monthlyCount = projects.filter(p => {
        const projectDate = new Date(p.createdAt || Date.now());
        return projectDate.getMonth() === currentMonth;
    }).length;

    console.log('Statistiques projets:', { totalCount, seoCount, reputationCount, monthlyCount });

    const totalProjectsCount = document.getElementById('totalProjectsCount');
    const seoProjectsCount = document.getElementById('seoProjectsCount');
    const reputationProjectsCount = document.getElementById('reputationProjectsCount');
    const monthlyProjectsCount = document.getElementById('monthlyProjectsCount');

    if (totalProjectsCount) {
        totalProjectsCount.textContent = totalCount;
        console.log('Total projets mis à jour:', totalCount);
    } else {
        console.error('totalProjectsCount non trouvé');
    }
    
    if (seoProjectsCount) seoProjectsCount.textContent = seoCount;
    if (reputationProjectsCount) reputationProjectsCount.textContent = reputationCount;
    if (monthlyProjectsCount) monthlyProjectsCount.textContent = monthlyCount;
}

function viewProjectSpots(projectId) {
    currentProjectId = projectId;
    // Sauvegarder l'ID du projet actuel
    localStorage.setItem('currentProjectId', projectId);
    loadProjectDetail(projectId);
    switchPage('project-detail');
}

// Gestion de la page de détail du projet
function loadProjectDetail(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        console.error('❌ Projet non trouvé:', projectId);
        // Rediriger vers la page des projets si le projet n'existe pas
        switchPage('projects');
        return;
    }

    // Mettre à jour le header
    document.getElementById('projectDetailTitle').textContent = project.name;
    const urlElement = document.getElementById('projectDetailUrl');
    urlElement.href = project.url;
    urlElement.innerHTML = `${project.url} <i class="fas fa-external-link-alt"></i>`;
    
    // Mettre à jour l'objectif
    const objectiveElement = document.getElementById('projectDetailObjective');
    objectiveElement.textContent = project.objective === 'SEO' ? 'Référencement' : project.objective;
    objectiveElement.className = `project-objective-tag ${project.objective === 'SEO' ? 'seo' : 'reputation'}`;

    // Mettre à jour les mots-clés
    const keywordsContainer = document.getElementById('projectDetailKeywords');
    if (project.keywords && project.keywords.length > 0) {
        keywordsContainer.innerHTML = `
            <div class="project-detail-keywords-label">Mots-clés à travailler</div>
            <div class="project-detail-keywords-list">
                ${project.keywords.map(keyword => `
                    <span class="project-detail-keyword-tag">${keyword}</span>
                `).join('')}
            </div>
        `;
    } else {
        keywordsContainer.innerHTML = '';
    }

    // Mettre à jour la date de mise à jour
    const updatedDate = project.updatedAt || project.createdAt;
    const dateElement = document.getElementById('projectDetailUpdatedDate');
    if (updatedDate) {
        const date = new Date(updatedDate);
        dateElement.textContent = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        dateElement.textContent = 'Jamais';
    }

    // Mettre à jour les KPIs
    document.getElementById('projectDetailTraffic').textContent = (project.traffic || 0).toLocaleString();
    document.getElementById('projectDetailTrustFlow').textContent = project.trustFlow || 0;
    document.getElementById('projectDetailReferringDomains').textContent = project.referringDomains || 0;
    
    // Calculer et afficher le budget et les dépenses
    updateBudgetDisplay(project);
    
    // Afficher la jauge de progression
    const progressSection = document.getElementById('projectProgressSection');
    if (project.publicationGoal && project.publicationGoal > 0) {
        progressSection.style.display = 'block';
        updateProgressGauge(project);
    } else {
        // Afficher la jauge même sans objectif défini, avec un message informatif
        progressSection.style.display = 'block';
        updateProgressGaugeWithoutGoal(project);
    }
    
    // Charger les spots du projet
    loadProjectSpots(projectId);
}

// Fonction pour mettre à jour l'affichage du budget et des dépenses
function updateBudgetDisplay(project) {
    const budget = project.budget || 0;
    const spots = project.spots || [];
    
    // Calculer les dépenses totales (spots avec statut "Publié")
    const totalExpenses = spots
        .filter(spot => spot.status === 'Publié')
        .reduce((sum, spot) => sum + (spot.price || 0), 0);
    
    // Calculer le budget en attente (spots "A publier" et "En attente")
    const pendingBudget = spots
        .filter(spot => spot.status === 'A publier' || spot.status === 'En attente')
        .reduce((sum, spot) => sum + (spot.price || 0), 0);
    
    // Calculer le budget total engagé (dépenses + en attente)
    const totalEngaged = totalExpenses + pendingBudget;
    
    // Calculer le reste disponible
    const remainingBudget = budget - totalEngaged;
    
    // Calculer le pourcentage utilisé (basé sur le total engagé)
    const percentageUsed = budget > 0 ? (totalEngaged / budget) * 100 : 0;
    
    // Mettre à jour les éléments HTML
    document.getElementById('projectBudgetAmount').textContent = budget.toFixed(2) + ' €';
    document.getElementById('projectTotalExpenses').textContent = totalExpenses.toFixed(2) + ' €';
    document.getElementById('projectPendingBudget').textContent = pendingBudget.toFixed(2) + ' €';
    document.getElementById('projectRemainingBudget').textContent = remainingBudget.toFixed(2) + ' €';
    
    // Mettre à jour la barre de progression
    const progressFill = document.getElementById('budgetProgressFill');
    const progressText = document.getElementById('budgetProgressText');
    
    if (progressFill) {
        progressFill.style.width = Math.min(percentageUsed, 100) + '%';
    }
    
    if (progressText) {
        progressText.textContent = `${percentageUsed.toFixed(1)}% du budget engagé`;
    }
    
    // Changer la couleur de la barre selon le pourcentage
    if (progressFill) {
        if (percentageUsed >= 100) {
            progressFill.style.background = 'linear-gradient(90deg, var(--danger) 0%, #dc2626 100%)';
        } else if (percentageUsed >= 80) {
            progressFill.style.background = 'linear-gradient(90deg, var(--warning) 0%, #f59e0b 100%)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, var(--accent) 0%, var(--primary) 100%)';
        }
    }
}

// Mettre à jour la jauge de progression
function updateProgressGauge(project) {
    const goal = project.publicationGoal || 0;
    // Compter uniquement les spots du projet actuel avec le statut "Publié"
    const current = project.spots ? project.spots.filter(spot => spot.status === 'Publié').length : 0;
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    
    // Mettre à jour les éléments de la jauge
    document.getElementById('progressCurrent').textContent = current;
    document.getElementById('progressGoal').textContent = goal;
    document.getElementById('progressEndLabel').textContent = goal;
    document.getElementById('progressPercentage').textContent = Math.round(percentage) + '%';
    
    // Mettre à jour la barre de progression
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = percentage + '%';
    
    // Définir le statut et la couleur selon le pourcentage
    const progressStatus = document.getElementById('progressStatus');
    let statusClass = '';
    let statusText = '';
    
    if (percentage >= 100) {
        progressFill.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        statusClass = 'excellent';
        statusText = '🎉 Atteint';
    } else if (percentage >= 75) {
        progressFill.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        statusClass = 'good';
        statusText = '🚀 Excellent';
    } else if (percentage >= 50) {
        progressFill.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        statusClass = 'warning';
        statusText = '⚡ Bon';
    } else {
        progressFill.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        statusClass = 'danger';
        statusText = '🔥 À faire';
    }
    
    // Mettre à jour le statut
    progressStatus.className = `progress-status ${statusClass}`;
    progressStatus.textContent = statusText;
    
    // Mettre à jour le sous-titre
    const progressSubtitle = document.getElementById('progressSubtitle');
    progressSubtitle.textContent = `Objectif de ${goal} publication${goal > 1 ? 's' : ''}`;
}

// Mettre à jour la jauge sans objectif défini
function updateProgressGaugeWithoutGoal(project) {
    // Compter uniquement les spots du projet actuel avec le statut "Publié"
    const current = project.spots ? project.spots.filter(spot => spot.status === 'Publié').length : 0;
    
    // Mettre à jour les éléments de la jauge
    document.getElementById('progressCurrent').textContent = current;
    document.getElementById('progressGoal').textContent = '?';
    document.getElementById('progressEndLabel').textContent = '?';
    document.getElementById('progressPercentage').textContent = '';
    
    // Afficher une barre de progression neutre
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = '100%';
    progressFill.style.background = 'linear-gradient(135deg, #6b7280, #9ca3af)';
    
    // Mettre à jour le statut
    const progressStatus = document.getElementById('progressStatus');
    progressStatus.className = 'progress-status neutral';
    progressStatus.textContent = '📊 Pas d\'objectif';
    
    // Mettre à jour le sous-titre
    const progressSubtitle = document.getElementById('progressSubtitle');
    progressSubtitle.textContent = 'Définissez un objectif pour suivre vos progrès';
}

// Fonction pour éditer l'objectif de publication
function editPublicationGoal() {
    const currentGoal = document.getElementById('editProjectPublicationGoal').value || 0;
    const newGoal = prompt('Nouvel objectif de publication:', currentGoal);
    
    if (newGoal !== null && newGoal !== '') {
        const goal = parseInt(newGoal);
        if (!isNaN(goal) && goal >= 0) {
            // Mettre à jour le champ dans le formulaire d'édition
            document.getElementById('editProjectPublicationGoal').value = goal;
            
            // Sauvegarder le projet
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                project.publicationGoal = goal;
                
                // Sauvegarder en base
                if (db && isAuthenticated) {
                    db.updateProject(currentProjectId, project).then(() => {
                        console.log('✅ Objectif mis à jour en base');
                    }).catch(error => {
                        console.error('❌ Erreur sauvegarde objectif:', error);
                    });
                } else {
                    saveData();
                }
                
                // Mettre à jour l'affichage
                if (goal > 0) {
                    updateProgressGauge(project);
                } else {
                    updateProgressGaugeWithoutGoal(project);
                }
                
                showNotification('✅ Objectif de publication mis à jour', 'success');
            }
        } else {
            alert('Veuillez entrer un nombre valide');
        }
    }
}

function loadProjectSpots(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        projectSpots = [];
        renderProjectSpots();
        return;
    }

    // Initialiser les spots si nécessaire
    if (!project.spots) {
        project.spots = [];
    }

    // Synchroniser projectSpots avec les données du projet
    syncProjectSpots();
    renderProjectSpots();
    
    // Sauvegarder automatiquement après chargement
    if (project && project.spots && project.spots.length > 0) {
        console.log('💾 Sauvegarde automatique des spots...');
        saveData();
    }
}

function renderProjectSpots() {
    const tbody = document.getElementById('projectSpotsTableBody');
    const spotsCount = document.getElementById('projectSpotsCount');
    const kpiSpotsCount = document.getElementById('projectDetailSpotsCount');
    
    if (!tbody) return;

    console.log('🎨 Rendu des spots...', {
        projectSpotsLength: projectSpots.length,
        spots: projectSpots.map(s => ({ id: s.id, url: s.url }))
    });

    spotsCount.textContent = projectSpots.length;
    if (kpiSpotsCount) kpiSpotsCount.textContent = projectSpots.length;

    tbody.innerHTML = '';

    if (projectSpots.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-globe" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Aucun spot associé à ce projet</p>
                </td>
            </tr>
        `;
        return;
    }

    projectSpots.forEach(spot => {
        const row = document.createElement('tr');
        const trustFlowClass = getTrustFlowClass(spot.trustFlow);
        const trustFlowWidth = Math.min(spot.trustFlow, 100);
        
        row.innerHTML = `
            <td>
                <div>
                    <a href="${spot.url}" target="_blank" class="project-spot-url">
                        ${getDomainName(spot.url)} <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </td>
            <td>
                ${spot.targetUrl ? `
                    <a href="${spot.targetUrl}" target="_blank" class="project-spot-target-url">
                        ${spot.targetUrl}
                    </a>
                ` : '<span class="project-spot-no-target">-</span>'}
            </td>
            <td><span class="project-spot-type">${spot.type}</span></td>
            <td><span class="project-spot-theme">${spot.theme}</span></td>
            <td>
                <div class="project-spot-trust-flow">
                    <div class="project-spot-trust-flow-bar">
                        <div class="project-spot-trust-flow-fill ${trustFlowClass}" style="width: ${trustFlowWidth}%"></div>
                    </div>
                    <span class="project-spot-trust-flow-value">${spot.trustFlow}</span>
                </div>
            </td>
            <td><span class="project-spot-traffic">${formatNumber(spot.traffic)}</span></td>
            <td><span class="ttf-tag ttf-${(spot.ttf || 'business').toLowerCase()}">${spot.ttf || 'Business'}</span></td>
            <td><span class="project-spot-date">${spot.publicationDate ? new Date(spot.publicationDate).toLocaleDateString('fr-FR') : 'Non définie'}</span></td>
            <td><span class="project-spot-price">${spot.price ? spot.price.toFixed(2) + ' €' : '0.00 €'}</span></td>
            <td>
                <span class="spot-status-${spot.status.toLowerCase().replace(' ', '-').replace('é', 'e')}">${spot.status}</span>
            </td>
            <td>
                <div class="project-spot-actions">
                    <button class="project-spot-action-btn edit" onclick="editProjectSpot(${spot.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-spot-action-btn delete" onclick="removeSpotFromProject(${spot.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Mettre à jour la jauge de progression après le rendu des spots
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (currentProject) {
        if (currentProject.publicationGoal && currentProject.publicationGoal > 0) {
            updateProgressGauge(currentProject);
        } else {
            updateProgressGaugeWithoutGoal(currentProject);
        }
        
        // Mettre à jour l'affichage du budget
        updateBudgetDisplay(currentProject);
    }
}

async function updateSpotStatus(spotId, newStatus) {
    const spot = projectSpots.find(s => s.id === spotId);
    if (spot) {
        spot.status = newStatus;
        
        // Sauvegarder dans les données du projet
        const project = projects.find(p => p.id === currentProjectId);
        if (project && project.spots) {
            const projectSpot = project.spots.find(s => s.id === spotId);
            if (projectSpot) {
                projectSpot.status = newStatus;
                await saveData();
                console.log(`Statut du spot ${spotId} mis à jour: ${newStatus}`);
            }
        }
    }
}

async function removeSpotFromProject(spotId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce spot du projet ?')) {
        // Supprimer du tableau local
        projectSpots = projectSpots.filter(s => s.id !== spotId);
        
        // Supprimer des données du projet
        const project = projects.find(p => p.id === currentProjectId);
        if (project && project.spots) {
            project.spots = project.spots.filter(s => s.id !== spotId);
            await saveData();
        }
        
        renderProjectSpots();
        
        // Mettre à jour la jauge de progression si nécessaire
        const currentProject = projects.find(p => p.id === currentProjectId);
        if (currentProject && currentProject.publicationGoal > 0) {
            updateProgressGauge(currentProject);
        }
        
        console.log(`Spot ${spotId} supprimé du projet`);
    }
}

// Gestion du modal d'ajout de spots
function openAddSpotModal() {
    const modal = document.getElementById('addSpotModal');
    const form = document.getElementById('addSpotForm');
    
    // Réinitialiser le formulaire
    form.reset();
    
    modal.style.display = 'block';
}

function closeAddSpotModal() {
    document.getElementById('addSpotModal').style.display = 'none';
}

async function saveNewSpot(e) {
    e.preventDefault();

    const url = document.getElementById('spotUrl').value.trim();
    const targetUrl = document.getElementById('spotTargetUrl').value.trim();
    const type = document.getElementById('spotType').value;
    const theme = document.getElementById('spotTheme').value;
    const trustFlow = parseInt(document.getElementById('spotTrustFlow').value) || 0;
    const traffic = parseInt(document.getElementById('spotTraffic').value) || 0;
    const ttf = document.getElementById('spotTTF').value;
    const publicationDate = document.getElementById('spotPublicationDate').value;
    const price = parseFloat(document.getElementById('spotPrice').value) || 0;
    const status = document.getElementById('spotStatus').value;

    if (!url) {
        alert('Veuillez saisir une URL');
        return;
    }

    // Vérifier si le spot existe déjà (éviter les doublons)
    const existingSpot = projectSpots.find(spot => spot.url.toLowerCase() === url.toLowerCase());
    if (existingSpot) {
        alert('Ce spot existe déjà dans le projet');
        return;
    }

    const newSpot = {
        id: Math.max(...projectSpots.map(s => s.id), 0) + 1,
        siteId: null, // Pas de référence au catalogue
        projectId: currentProjectId,
        url: url,
        targetUrl: targetUrl || null,
        type: type,
        theme: theme,
        traffic: traffic,
        trustFlow: trustFlow,
        ttf: ttf,
        publicationDate: publicationDate || null,
        price: price,
        status: status
    };

    // Ajouter le spot aux données du projet
    const project = projects.find(p => p.id === currentProjectId);
    console.log('💾 Ajout du spot...', {
        projectId: currentProjectId,
        project: project ? project.name : 'non trouvé',
        spotsAvant: project?.spots?.length || 0,
        newSpot: newSpot.url
    });
    
    if (project) {
        if (!project.spots) {
            project.spots = [];
        }
        project.spots.push(newSpot);
        console.log('✅ Spot ajouté au projet, spots maintenant:', project.spots.length);
        await saveData();
    }
    
    // Synchroniser projectSpots avec les données du projet
    syncProjectSpots();
    
    renderProjectSpots();
    
    // Mettre à jour la jauge de progression si nécessaire
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (currentProject) {
        if (currentProject.publicationGoal && currentProject.publicationGoal > 0) {
            updateProgressGauge(currentProject);
        } else {
            updateProgressGaugeWithoutGoal(currentProject);
        }
    }
    
    closeAddSpotModal();
    
    console.log(`Nouveau spot ajouté au projet: ${url}`);
}

// Gestion de l'édition du projet depuis la page de détail
let editKeywords = [];

function toggleProjectEdit() {
    const form = document.getElementById('projectEditForm');
    const editBtn = document.getElementById('projectEditBtn');
    
    if (form.style.display === 'none') {
        // Ouvrir le formulaire d'édition
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
            // Remplir le formulaire avec les données actuelles
            document.getElementById('editProjectName').value = project.name;
            document.getElementById('editProjectUrl').value = project.url;
            document.getElementById('editProjectObjective').value = project.objective;
            document.getElementById('editProjectTraffic').value = project.traffic || '';
            document.getElementById('editProjectTrustFlow').value = project.trustFlow || '';
            document.getElementById('editProjectTTF').value = project.ttf || '';
            document.getElementById('editProjectReferringDomains').value = project.referringDomains || '';
            document.getElementById('editProjectBudget').value = project.budget || '';
            
            // Charger les mots-clés
            editKeywords = [...(project.keywords || [])];
            renderEditKeywords();
        }
        
        form.style.display = 'block';
        editBtn.innerHTML = '<i class="fas fa-times"></i> Annuler';
        editBtn.onclick = cancelProjectEdit;
    } else {
        // Fermer le formulaire d'édition
        cancelProjectEdit();
    }
}

function cancelProjectEdit() {
    const form = document.getElementById('projectEditForm');
    const editBtn = document.getElementById('projectEditBtn');
    
    form.style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier le projet';
    editBtn.onclick = toggleProjectEdit;
    editKeywords = [];
}

function addEditKeyword() {
    const input = document.getElementById('editKeywordInput');
    const keywordsText = input.value.trim();
    
    if (keywordsText) {
        // Séparer les mots-clés par virgule et nettoyer
        const keywords = keywordsText.split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        // Ajouter les nouveaux mots-clés (éviter les doublons)
        keywords.forEach(keyword => {
            if (!editKeywords.includes(keyword)) {
                editKeywords.push(keyword);
            }
        });
        
        input.value = '';
        renderEditKeywords();
        
        // Afficher une notification si des mots-clés ont été ajoutés
        if (keywords.length > 0) {
            showNotification(`✅ ${keywords.length} mot(s)-clé(s) ajouté(s)`, 'success');
        }
    }
}

function removeEditKeyword(keyword) {
    editKeywords = editKeywords.filter(k => k !== keyword);
    renderEditKeywords();
}

function renderEditKeywords() {
    const container = document.getElementById('editKeywordsTags');
    if (!container) return;
    
    container.innerHTML = '';
    
    editKeywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
            <span>${keyword}</span>
            <button type="button" class="remove-keyword" onclick="removeEditKeyword('${keyword}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

async function saveProjectFromDetail(e) {
    e.preventDefault();

    const name = document.getElementById('editProjectName').value.trim();
    const url = document.getElementById('editProjectUrl').value.trim();
    const objective = document.getElementById('editProjectObjective').value;
    const traffic = parseInt(document.getElementById('editProjectTraffic').value) || 0;
    const trustFlow = parseInt(document.getElementById('editProjectTrustFlow').value) || 0;
    const ttf = document.getElementById('editProjectTTF').value;
    const referringDomains = parseInt(document.getElementById('editProjectReferringDomains').value) || 0;
    const publicationGoal = parseInt(document.getElementById('editProjectPublicationGoal').value) || 0;
    const budget = parseFloat(document.getElementById('editProjectBudget').value) || 0;

    if (!name || !url || !objective) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const projectData = {
        name,
        url,
        objective,
        traffic,
        trustFlow,
        ttf,
        referringDomains,
        publicationGoal,
        budget,
        keywords: editKeywords,
        updatedAt: new Date().toISOString()
    };

    const projectIndex = projects.findIndex(p => p.id === currentProjectId);
    if (projectIndex !== -1) {
        projects[projectIndex] = { ...projects[projectIndex], ...projectData };
        await saveData();
        
        // Recharger l'affichage du projet
        loadProjectDetail(currentProjectId);
        
        // Fermer le formulaire d'édition
        cancelProjectEdit();
        
        // Afficher une confirmation de succès
        showNotification('✅ Projet mis à jour avec succès !', 'success');
        
        console.log('Projet mis à jour depuis la page de détail');
    }
}

// Gestion des sites
function openSiteModal(siteId = null) {
    const modal = document.getElementById('siteModal');
    const title = document.getElementById('modalSiteTitle');
    const form = document.getElementById('siteForm');

    editingSiteId = siteId;

    if (siteId) {
        title.textContent = 'Modifier le site';
        const site = sites.find(s => s.id === siteId);
        if (site) {
            document.getElementById('siteUrl').value = site.url;
            document.getElementById('siteType').value = site.type;
            document.getElementById('siteTheme').value = site.theme;
            document.getElementById('siteTraffic').value = site.traffic || '';
            document.getElementById('siteTrustFlow').value = site.trustFlow || '';
            document.getElementById('siteTTF').value = site.ttf || '';
            document.getElementById('siteFollow').value = site.follow || 'Oui';
            // Les notes ne sont pas modifiables dans le modal principal, elles ont leur propre modal
        }
    } else {
        title.textContent = 'Nouveau Site';
        form.reset();
    }

    modal.style.display = 'block';
}

// Fonction pour éditer un site (alias pour openSiteModal)
function editSite(siteId) {
    openSiteModal(siteId);
}

function closeSiteModal() {
    document.getElementById('siteModal').style.display = 'none';
    editingSiteId = null;
}

// Gestion des notes des sites
let currentNotesSiteId = null;

function toggleSiteNotes(siteId) {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    
    currentNotesSiteId = siteId;
    const modal = document.getElementById('siteNotesModal');
    const urlElement = document.getElementById('siteNotesUrl');
    const typeElement = document.getElementById('siteNotesType');
    const contentElement = document.getElementById('siteNotesContent');
    const saveBtn = document.getElementById('saveNotesBtn');
    
    // Afficher les informations du site
    urlElement.textContent = getDomainName(site.url);
    typeElement.textContent = `${site.type} - ${site.theme}`;
    
    // Charger les notes existantes
    contentElement.innerHTML = site.notes || '';
    
    // Vérifier les permissions d'édition
    const isAdmin = currentUser && (
        currentUser.role === 'admin' || 
        currentUser.user_metadata?.role === 'admin' || 
        currentUser.app_metadata?.role === 'admin' ||
        (db && db.isAdmin()) ||
        window.isAdmin === true
    );
    
    // Debug des permissions
    console.log('🔍 Debug permissions notes:', {
        currentUser: currentUser,
        role: currentUser?.role,
        user_metadata: currentUser?.user_metadata,
        app_metadata: currentUser?.app_metadata,
        db_isAdmin: db ? db.isAdmin() : 'db not available',
        isAdmin: isAdmin
    });
    
    contentElement.contentEditable = isAdmin;
    saveBtn.style.display = isAdmin ? 'inline-block' : 'none';
    
    // Afficher le bouton de forçage admin si pas admin
    const forceAdminBtn = document.getElementById('forceAdminBtn');
    if (forceAdminBtn) {
        forceAdminBtn.style.display = !isAdmin ? 'inline-block' : 'none';
    }
    
    // Initialiser la barre d'outils
    if (isAdmin) {
        initializeWysiwygToolbar();
    }
    
    modal.style.display = 'block';
}

function closeSiteNotesModal() {
    document.getElementById('siteNotesModal').style.display = 'none';
    currentNotesSiteId = null;
}

async function saveSiteNotes() {
    if (!currentNotesSiteId) return;
    
    const contentElement = document.getElementById('siteNotesContent');
    const content = contentElement.innerHTML;
    const site = sites.find(s => s.id === currentNotesSiteId);
    
    if (!site) return;
    
    try {
        // Mettre à jour les notes
        site.notes = content;
        
        // Sauvegarder
        if (db && isAuthenticated) {
            // Mettre à jour le site avec les notes
            const updatedSite = await db.saveSite({ 
                id: currentNotesSiteId, 
                ...site, 
                notes: content 
            });
            
            // Mettre à jour le site local
            const siteIndex = sites.findIndex(s => s.id === currentNotesSiteId);
            if (siteIndex !== -1) {
                sites[siteIndex] = updatedSite;
            }
            
            console.log('📝 Notes sauvegardées sur Supabase');
        } else {
            await saveData();
            console.log('📝 Notes sauvegardées en localStorage');
        }
        
        // Rafraîchir l'affichage
        renderSites();
        closeSiteNotesModal();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde notes:', error);
        alert('Erreur lors de la sauvegarde des notes: ' + error.message);
    }
}

// Initialiser la barre d'outils WYSIWYG
function initializeWysiwygToolbar() {
    const toolbar = document.querySelector('.wysiwyg-toolbar');
    const editor = document.getElementById('siteNotesContent');
    
    if (!toolbar || !editor) return;
    
    // Ajouter les événements aux boutons de la barre d'outils
    toolbar.addEventListener('click', function(e) {
        if (e.target.closest('.toolbar-btn')) {
            e.preventDefault();
            const button = e.target.closest('.toolbar-btn');
            const command = button.dataset.command;
            
            if (command === 'createLink') {
                const url = prompt('Entrez l\'URL du lien:');
                if (url) {
                    document.execCommand('createLink', false, url);
                }
            } else if (command === 'formatBlock') {
                const value = button.dataset.value;
                document.execCommand('formatBlock', false, value);
            } else {
                document.execCommand(command, false, null);
            }
            
            // Mettre à jour l'état des boutons
            updateToolbarState();
        }
    });
    
    
    // Mettre à jour l'état de la barre d'outils lors de la sélection
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('focus', updateToolbarState);
}

// Mettre à jour l'état des boutons de la barre d'outils
function updateToolbarState() {
    const toolbar = document.querySelector('.wysiwyg-toolbar');
    if (!toolbar) return;
    
    const buttons = toolbar.querySelectorAll('.toolbar-btn');
    buttons.forEach(button => {
        const command = button.dataset.command;
        let isActive = false;
        
        switch (command) {
            case 'bold':
                isActive = document.queryCommandState('bold');
                break;
            case 'italic':
                isActive = document.queryCommandState('italic');
                break;
            case 'underline':
                isActive = document.queryCommandState('underline');
                break;
            case 'insertUnorderedList':
                isActive = document.queryCommandState('insertUnorderedList');
                break;
            case 'insertOrderedList':
                isActive = document.queryCommandState('insertOrderedList');
                break;
            case 'formatBlock':
                const currentBlock = document.queryCommandValue('formatBlock');
                const expectedValue = button.dataset.value;
                isActive = currentBlock === expectedValue;
                break;
        }
        
        button.classList.toggle('active', isActive);
    });
    
}

// Forcer le mode admin temporairement
function forceAdminMode() {
    console.log('🔧 Activation du mode admin forcé');
    
    // Activer l'édition
    const contentElement = document.getElementById('siteNotesContent');
    const saveBtn = document.getElementById('saveNotesBtn');
    const forceAdminBtn = document.getElementById('forceAdminBtn');
    
    contentElement.contentEditable = true;
    saveBtn.style.display = 'inline-block';
    forceAdminBtn.style.display = 'none';
    
    // Initialiser la barre d'outils
    initializeWysiwygToolbar();
    
    // Focus sur l'éditeur
    contentElement.focus();
    
    console.log('✅ Mode admin activé - vous pouvez maintenant éditer les notes');
}

async function saveSite(e) {
    e.preventDefault();

    const url = document.getElementById('siteUrl').value.trim();
    const type = document.getElementById('siteType').value;
    const theme = document.getElementById('siteTheme').value;
    const traffic = parseInt(document.getElementById('siteTraffic').value) || 0;
    const trustFlow = parseInt(document.getElementById('siteTrustFlow').value) || 0;
    const ttf = document.getElementById('siteTTF').value;
    const follow = document.getElementById('siteFollow').value;

    if (!url) {
        alert('Veuillez entrer une URL');
        return;
    }

    // Préserver les notes existantes lors de la modification
    const existingSite = editingSiteId ? sites.find(s => s.id === editingSiteId) : null;
    
    const siteData = {
        url,
        type,
        theme,
        traffic,
        trustFlow,
        ttf,
        follow,
        notes: existingSite ? existingSite.notes || '' : '' // Préserver les notes existantes
    };

    try {
        if (isSupabaseConfigured && db) {
            // Sauvegarder avec Supabase (même logique que pour les projets)
            if (editingSiteId) {
                // Pour la mise à jour, on doit d'abord obtenir le site existant
                const updatedSite = await db.saveSite({ id: editingSiteId, ...siteData });
                const siteIndex = sites.findIndex(s => s.id === editingSiteId);
                if (siteIndex !== -1) {
                    sites[siteIndex] = updatedSite;
                }
                console.log('✅ Site mis à jour dans Supabase');
            } else {
                // Nouvelle création
                const newSite = await db.saveSite(siteData);
                sites.push(newSite);
                console.log('✅ Site créé dans Supabase');
            }
            
            // Recharger TOUS les sites depuis Supabase pour être sûr
            sites = await db.getSites();
            console.log(`🔄 ${sites.length} sites rechargés depuis Supabase`);
            
        } else {
            // Fallback localStorage
            if (editingSiteId) {
                const siteIndex = sites.findIndex(s => s.id === editingSiteId);
                if (siteIndex !== -1) {
                    sites[siteIndex] = { ...sites[siteIndex], ...siteData };
                }
            } else {
                const newId = Math.max(...sites.map(s => s.id), 0) + 1;
                sites.push({ id: newId, ...siteData });
            }
            await saveData();
            console.log('📦 Site sauvegardé en localStorage');
        }

        renderSites();
        setupCheckboxListeners();
        closeSiteModal();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde site:', error);
        alert('Erreur lors de la sauvegarde du site: ' + error.message);
    }
}

async function deleteSite(siteId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
        try {
            if (isSupabaseConfigured && db) {
                await db.deleteSite(siteId);
                console.log('✅ Site supprimé de Supabase');
                
                // Recharger TOUS les sites depuis Supabase pour être sûr
                sites = await db.getSites();
                console.log(`🔄 ${sites.length} sites rechargés depuis Supabase`);
            } else {
                sites = sites.filter(s => s.id !== siteId);
                await saveData();
            }
            
            renderSites();
            setupCheckboxListeners();
            
        } catch (error) {
            console.error('❌ Erreur suppression site:', error);
            alert('Erreur lors de la suppression du site: ' + error.message);
        }
    }
}

function renderSites() {
    const tbody = document.getElementById('catalogTableBody');
    const sitesCount = document.getElementById('sitesCount');
    if (!tbody) return;

    // Vérifier l'authentification
    if (!isAuthenticated) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-lock" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Accès restreint - Connexion requise</p>
                    <button class="btn btn-primary" onclick="switchPage('homepage')" style="margin-top: 1rem;">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                </td>
            </tr>
        `;
        sitesCount.textContent = '0';
        return;
    }

    const filteredSites = getFilteredSites();
    sitesCount.textContent = filteredSites.length;

    tbody.innerHTML = '';

    if (filteredSites.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-database" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Aucun site dans le catalogue</p>
                </td>
            </tr>
        `;
        return;
    }

    filteredSites.forEach(site => {
        const row = document.createElement('tr');
        row.setAttribute('data-site-id', site.id);
        const trustFlowClass = getTrustFlowClass(site.trustFlow);
        const trustFlowWidth = Math.min(site.trustFlow, 100);
        
        row.innerHTML = `
            <td><input type="checkbox" class="site-checkbox" data-site-id="${site.id}" onchange="handleSiteSelection()"></td>
            <td>
                <a href="${site.url}" target="_blank" class="site-url">
                    ${getDomainName(site.url)} <i class="fas fa-external-link-alt"></i>
                </a>
            </td>
            <td><span class="type-tag">${site.type}</span></td>
            <td>${site.theme}</td>
            <td>${formatNumber(site.traffic)}</td>
            <td>
                <div class="trust-flow-container">
                    <div class="trust-flow-bar">
                        <div class="trust-flow-fill ${trustFlowClass}" style="width: ${trustFlowWidth}%"></div>
                    </div>
                    <span class="trust-flow-value">${site.trustFlow}</span>
                </div>
            </td>
            <td><span class="ttf-tag ttf-${site.ttf.toLowerCase()}">${site.ttf}</span></td>
            <td>${site.follow}</td>
            <td>
                <button class="notes-btn" onclick="toggleSiteNotes(${site.id})" title="Voir les notes">
                    <i class="fas fa-sticky-note"></i>
                    ${site.notes ? '<i class="fas fa-eye notes-indicator"></i>' : ''}
                </button>
            </td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="editSite(${site.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSite(${site.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getTrustFlowClass(trustFlow) {
    if (trustFlow >= 70) return 'high';
    if (trustFlow >= 40) return 'medium';
    return 'low';
}

// Fonction utilitaire pour extraire le nom du domaine d'une URL
function getDomainName(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        // Si l'URL n'est pas valide, retourner l'URL telle quelle
        return url;
    }
}

// Fonction utilitaire pour synchroniser projectSpots avec les données du projet
function syncProjectSpots() {
    const project = projects.find(p => p.id === currentProjectId);
    console.log('🔄 Synchronisation des spots...', {
        currentProjectId,
        project: project ? project.name : 'non trouvé',
        projectSpotsCount: projectSpots.length,
        projectSpotsInData: project?.spots?.length || 0
    });
    
    if (project && project.spots) {
        projectSpots = [...project.spots]; // Créer une copie pour éviter les références
        console.log('✅ Spots synchronisés:', projectSpots.length);
    } else {
        projectSpots = [];
        console.log('⚠️ Aucun spot trouvé dans le projet');
    }
}

function getFilteredSites() {
    const searchTerm = document.getElementById('catalogSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const themeFilter = document.getElementById('themeFilter')?.value || '';

    return sites.filter(site => {
        const matchesSearch = site.url.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || site.type === typeFilter;
        const matchesTheme = !themeFilter || site.theme === themeFilter;
        
        return matchesSearch && matchesType && matchesTheme;
    });
}

function filterSites() {
    renderSites();
}

function toggleSelectAllSites() {
    const selectAll = document.getElementById('selectAllSites');
    const checkboxes = document.querySelectorAll('.site-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// Fonctions d'import/export
// Variables pour l'import
let csvData = [];

// Variables pour les sélections en masse
let selectedSites = [];
let selectedProjects = [];
let bulkEditMode = false;

// Gérer la sélection des sites
function handleSiteSelection() {
    const checkboxes = document.querySelectorAll('.site-checkbox:checked');
    selectedSites = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-site-id')));
    
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedSites.length > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = selectedSites.length;
    } else {
        bulkActions.style.display = 'none';
    }
    
    // Mettre à jour la case "Tout sélectionner"
    const selectAllCheckbox = document.getElementById('selectAllSites');
    const allCheckboxes = document.querySelectorAll('.site-checkbox');
    
    if (selectedSites.length === allCheckboxes.length && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedSites.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

// Configurer les event listeners des cases à cocher
function setupCheckboxListeners() {
    // Case "Tout sélectionner"
    const selectAllCheckbox = document.getElementById('selectAllSites');
    if (selectAllCheckbox) {
        selectAllCheckbox.onchange = function() {
            const checkboxes = document.querySelectorAll('.site-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            handleSiteSelection();
        };
    }
    
    // Cases individuelles
    const checkboxes = document.querySelectorAll('.site-checkbox');
    checkboxes.forEach(cb => {
        cb.onchange = handleSiteSelection;
    });
}

// Actions en masse
function editSelectedSites() {
    if (selectedSites.length === 0) {
        alert('Aucun site sélectionné');
        return;
    }
    
    if (selectedSites.length === 1) {
        // Modifier un seul site
        editSite(selectedSites[0]);
    } else {
        // Modification en masse (à implémenter)
        alert(`Modification en masse de ${selectedSites.length} sites en cours de développement.`);
    }
}

async function deleteSelectedSites() {
    if (selectedSites.length === 0) {
        alert('Aucun site sélectionné');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSites.length} site(s) ?`)) {
        try {
            if (isSupabaseConfigured && db) {
                await db.deleteSites(selectedSites);
                console.log(`✅ ${selectedSites.length} sites supprimés de Supabase`);
                
                // Recharger TOUS les sites depuis Supabase pour être sûr
                sites = await db.getSites();
                console.log(`🔄 ${sites.length} sites rechargés depuis Supabase`);
            } else {
                selectedSites.forEach(siteId => {
                    const index = sites.findIndex(s => s.id === siteId);
                    if (index !== -1) {
                        sites.splice(index, 1);
                    }
                });
                await saveData();
            }
            
            renderSites();
            setupCheckboxListeners();
            clearSelection();
            
            alert(`${selectedSites.length} site(s) supprimé(s) avec succès.`);
            
        } catch (error) {
            console.error('❌ Erreur suppression sites en masse:', error);
            alert('Erreur lors de la suppression: ' + error.message);
        }
    }
}

function showAddToProjectModal() {
    // Vérifier que le modal existe
    const modal = document.getElementById('addToProjectModal');
    if (!modal) {
        alert('Erreur: Interface non disponible. Rechargez la page.');
        return;
    }
    
    if (selectedSites.length === 0) {
        alert('Aucun site sélectionné. Veuillez d\'abord sélectionner des sites dans le catalogue.');
        return;
    }
    
    // Vérifier qu'il y a des projets
    if (projects.length === 0) {
        alert('Aucun projet disponible. Veuillez d\'abord créer un projet.');
        return;
    }
    
    // Vérifier que l'élément select existe
    const selectProject = document.getElementById('selectProject');
    if (!selectProject) {
        alert('Erreur: Interface de sélection non disponible. Rechargez la page.');
        return;
    }
    
    // Populer la liste des projets
    selectProject.innerHTML = '<option value="">Choisir un projet...</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = `${project.name} (${project.objective === 'SEO' ? 'Référencement' : project.objective})`;
        selectProject.appendChild(option);
    });
    
    // Afficher l'aperçu des sites sélectionnés
    try {
        showSelectedSitesPreview();
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'aperçu:', error);
    }
    
    // Ouvrir le modal
    modal.style.display = 'block';
}

function showSelectedSitesPreview() {
    const preview = document.getElementById('selectedSitesPreview');
    const selectedSitesData = sites.filter(site => selectedSites.includes(site.id));
    
    preview.innerHTML = `
        <h4>Sites sélectionnés (${selectedSitesData.length})</h4>
        ${selectedSitesData.map(site => `
            <div class="selected-site-item">
                <div class="selected-site-info">
                    <div class="selected-site-url">${extractDomain(site.url)}</div>
                    <div class="selected-site-meta">${site.type} • ${site.theme} • TF ${site.trustFlow || 0}</div>
                </div>
                <div class="selected-site-badge">${site.type}</div>
            </div>
        `).join('')}
    `;
}

async function addSitesToProject() {
    const projectId = parseInt(document.getElementById('selectProject').value);
    const bulkTargetUrl = document.getElementById('bulkTargetUrl').value.trim();
    
    if (!projectId) {
        alert('Veuillez sélectionner un projet');
        return;
    }
    
    // Récupérer les données des sites sélectionnés
    const selectedSitesData = sites.filter(site => selectedSites.includes(site.id));
    
    if (selectedSitesData.length === 0) {
        alert('Aucun site valide sélectionné');
        return;
    }
    
    // Trouver le projet
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        alert('Projet introuvable');
        return;
    }
    
    // Ajouter les sites au projet comme spots
    let addedCount = 0;
    
    // Initialiser les spots du projet si nécessaire
    if (!project.spots) {
        project.spots = [];
    }
    
    selectedSitesData.forEach(site => {
        // Vérifier si le spot existe déjà (éviter les doublons)
        const existingSpot = project.spots.find(spot => spot.url.toLowerCase() === site.url.toLowerCase());
        if (existingSpot) {
            console.log(`Spot déjà existant ignoré: ${site.url}`);
            return; // Passer au site suivant
        }

        const spot = {
            id: Date.now() + Math.random() + addedCount,
            projectId: projectId,
            url: site.url,
            targetUrl: bulkTargetUrl || null,
            type: site.type,
            theme: site.theme,
            trustFlow: site.trustFlow || 0,
            traffic: site.traffic || 0,
            price: 0, // Prix par défaut à 0
            status: 'À contacter'
        };
        
        // Ajouter aux données du projet
        project.spots.push(spot);
        addedCount++;
    });
    
    // Sauvegarder les données
    await saveData();
    
    
    closeAddToProjectModal();
    clearSelection();
    
    // Mettre à jour l'affichage si on est sur la page de détail du projet
    if (typeof currentProjectId !== 'undefined' && currentProjectId === projectId) {
        syncProjectSpots();
        renderProjectSpots();
    }
    
    alert(`${addedCount} site(s) ajouté(s) au projet "${project.name}" avec succès.`);
}

function closeAddToProjectModal() {
    document.getElementById('addToProjectModal').style.display = 'none';
    // Réinitialiser le champ URL cible
    document.getElementById('bulkTargetUrl').value = '';
}

function clearSelection() {
    selectedSites = [];
    const checkboxes = document.querySelectorAll('.site-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    const selectAllCheckbox = document.getElementById('selectAllSites');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    document.getElementById('bulkActions').style.display = 'none';
}

// Gérer la sélection des projets
function handleProjectSelection() {
    const checkboxes = document.querySelectorAll('.project-checkbox:checked');
    selectedProjects = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-project-id')));
    
    const bulkActions = document.getElementById('projectBulkActions');
    const selectedCount = document.getElementById('selectedProjectsCount');
    
    if (selectedProjects.length > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = selectedProjects.length;
    } else {
        bulkActions.style.display = 'none';
    }
    
    // Mettre à jour l'apparence des cartes sélectionnées
    document.querySelectorAll('.project-card').forEach(card => {
        const checkbox = card.querySelector('.project-checkbox');
        if (checkbox && checkbox.checked) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
}

// Actions en masse pour les projets
function deleteSelectedProjects() {
    if (selectedProjects.length === 0) {
        alert('Aucun projet sélectionné');
        return;
    }
    
    const projectNames = selectedProjects.map(projectId => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'Projet inconnu';
    }).join(', ');
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProjects.length} projet(s) ?\n\nProjets : ${projectNames}\n\nCette action est irréversible.`)) {
        selectedProjects.forEach(projectId => {
            const index = projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                projects.splice(index, 1);
            }
        });
        
        saveData();
        renderProjects();
        updateProjectStats();
        clearProjectSelection();
        
        alert(`${selectedProjects.length} projet(s) supprimé(s) avec succès.`);
    }
}

function clearProjectSelection() {
    selectedProjects = [];
    const checkboxes = document.querySelectorAll('.project-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    const bulkActions = document.getElementById('projectBulkActions');
    if (bulkActions) {
        bulkActions.style.display = 'none';
    }
    
    // Retirer la classe selected de toutes les cartes
    document.querySelectorAll('.project-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function selectAllProjects() {
    const checkboxes = document.querySelectorAll('.project-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    handleProjectSelection();
}

function openImportModal() {
    const modal = document.getElementById('importModal');
    modal.style.display = 'block';
    
    // Réinitialiser le modal
    document.getElementById('importFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importBtn').disabled = true;
    csvData = [];
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    // Détection plus robuste des types de fichiers
    const isCSV = file.type === 'text/csv' || 
                  file.type === 'application/csv' ||
                  fileName.endsWith('.csv');
                  
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.type === 'application/vnd.ms-excel' ||
                    fileName.endsWith('.xlsx') || 
                    fileName.endsWith('.xls');

    console.log('Fichier sélectionné:', {
        name: file.name,
        type: file.type,
        isCSV: isCSV,
        isExcel: isExcel
    });

    if (!isCSV && !isExcel) {
        alert('Veuillez sélectionner un fichier CSV ou Excel valide.\n\nFormats acceptés:\n- CSV: .csv\n- Excel: .xlsx, .xls');
        return;
    }

    const reader = new FileReader();
    
    if (isCSV) {
        console.log('Traitement du fichier CSV...');
        reader.onload = function(e) {
            try {
                parseCSV(e.target.result);
            } catch (error) {
                alert('Erreur lors de la lecture du fichier CSV: ' + error.message);
            }
        };
        reader.readAsText(file, 'UTF-8');
    } else if (isExcel) {
        console.log('Traitement du fichier Excel...');
        reader.onload = function(e) {
            try {
                parseExcel(e.target.result);
            } catch (error) {
                alert('Erreur lors de la lecture du fichier Excel: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

function parseExcel(excelBuffer) {
    try {
        // Vérifier que XLSX est disponible
        if (typeof XLSX === 'undefined') {
            alert('Erreur: La bibliothèque XLSX n\'est pas chargée. Rechargez la page et réessayez.');
            return;
        }
        
        // Lire le fichier Excel
        const workbook = XLSX.read(excelBuffer, { type: 'array' });
        
        // Chercher la feuille avec les données (priorité: "Sites", puis première feuille)
        let sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('site') || name.toLowerCase().includes('catalogue')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            alert('Aucune feuille trouvée dans le fichier Excel.');
            return;
        }

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
            alert('Le fichier Excel doit contenir au moins un en-tête et une ligne de données.\nLignes trouvées: ' + jsonData.length);
            return;
        }

        // Récupérer les en-têtes (première ligne)
        const headers = jsonData[0].map(h => h ? h.toString().trim() : '');
        
        const expectedHeaders = ['URL', 'Type', 'Thématique', 'Trafic', 'Trust Flow', 'TTF', 'Follow'];
        
        // Vérification plus flexible des en-têtes
        const hasRequiredHeaders = expectedHeaders.slice(0, 3).every(header => 
            headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
        );
        
        if (!hasRequiredHeaders) {
            alert('Format Excel invalide.\n\nEn-têtes trouvés: ' + headers.join(', ') + 
                  '\n\nEn-têtes attendus: ' + expectedHeaders.join(', ') +
                  '\n\nAssurez-vous que les 3 premières colonnes sont: URL, Type, Thématique');
            return;
        }

        // Parser les données
        csvData = [];
        let validRows = 0;
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 3) {
                const site = {
                    url: row[0] ? row[0].toString().trim() : '',
                    type: row[1] ? row[1].toString().trim() : '',
                    theme: row[2] ? row[2].toString().trim() : '',
                    traffic: parseInt(row[3]) || 0,
                    trustFlow: parseInt(row[4]) || 0,
                    ttf: row[5] ? row[5].toString().trim() : '',
                    follow: row[6] ? row[6].toString().trim() : ''
                };
                
                // Validation basique
                if (site.url && site.type && site.theme) {
                    csvData.push(site);
                    validRows++;
                }
            }
        }


        if (csvData.length === 0) {
            alert('Aucune donnée valide trouvée dans le fichier Excel.\n\nVérifiez que:\n- Les 3 premières colonnes contiennent URL, Type, Thématique\n- Il y a au moins une ligne de données\n- Les cellules ne sont pas vides');
            return;
        }

        showImportPreview();
        
    } catch (error) {
        console.error('Erreur parsing Excel:', error);
        alert('Erreur lors du traitement du fichier Excel:\n' + error.message + 
              '\n\nConseil: Essayez de sauvegarder votre fichier Excel en format CSV et importez le CSV à la place.');
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        alert('Le fichier CSV doit contenir au moins un en-tête et une ligne de données.');
        return;
    }

    // Parser la première ligne (en-têtes)
    const headers = parseCSVLine(lines[0]);
    const expectedHeaders = ['URL', 'Type', 'Thématique', 'Trafic', 'Trust Flow', 'TTF', 'Follow'];
    
    // Vérifier que les en-têtes correspondent
    if (!headers.every(header => expectedHeaders.includes(header.trim()))) {
        alert('Format CSV invalide. Les colonnes attendues sont: ' + expectedHeaders.join(', '));
        return;
    }

    // Parser les données
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 7) {
            const site = {
                url: values[0].trim(),
                type: values[1].trim(),
                theme: values[2].trim(),
                traffic: parseInt(values[3]) || 0,
                trustFlow: parseInt(values[4]) || 0,
                ttf: values[5].trim(),
                follow: values[6].trim()
            };
            
            // Validation basique
            if (site.url && site.type && site.theme) {
                csvData.push(site);
            }
        }
    }

    if (csvData.length === 0) {
        alert('Aucune donnée valide trouvée dans le fichier CSV.');
        return;
    }

    showImportPreview();
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function showImportPreview() {
    const preview = document.getElementById('importPreview');
    const tbody = document.getElementById('previewTableBody');
    const stats = document.getElementById('importStats');
    
    // Afficher le tableau de prévisualisation
    tbody.innerHTML = '';
    csvData.slice(0, 10).forEach(site => { // Limiter à 10 lignes pour l'aperçu
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${site.url}</td>
            <td>${site.type}</td>
            <td>${site.theme}</td>
            <td>${formatNumber(site.traffic)}</td>
            <td>${site.trustFlow}</td>
            <td>${site.ttf}</td>
            <td>${site.follow}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Afficher les statistiques
    const totalSites = csvData.length;
    const types = [...new Set(csvData.map(s => s.type))];
    const themes = [...new Set(csvData.map(s => s.theme))];
    
    stats.innerHTML = `
        <div class="stat-item">
            <span>Total des sites :</span>
            <span>${totalSites}</span>
        </div>
        <div class="stat-item">
            <span>Types :</span>
            <span>${types.join(', ')}</span>
        </div>
        <div class="stat-item">
            <span>Thématiques :</span>
            <span>${themes.join(', ')}</span>
        </div>
        <div class="stat-item">
            <span>Prêt à importer :</span>
            <span>${totalSites} sites</span>
        </div>
    `;
    
    preview.style.display = 'block';
    document.getElementById('importBtn').disabled = false;
}



async function importCSVData() {
    if (csvData.length === 0) {
        alert('Aucune donnée à importer.');
        return;
    }

    let importedCount = 0;
    let skippedCount = 0;

    csvData.forEach(siteData => {
        // Vérifier si le site existe déjà
        const existingSite = sites.find(s => s.url === siteData.url);
        if (existingSite) {
            skippedCount++;
            return;
        }

        // Créer un nouveau site
        const newSite = {
            id: Math.max(...sites.map(s => s.id), 0) + 1,
            url: siteData.url,
            type: siteData.type,
            theme: siteData.theme,
            traffic: siteData.traffic,
            trustFlow: siteData.trustFlow,
            ttf: siteData.ttf,
            follow: siteData.follow
        };

        sites.push(newSite);
        importedCount++;
    });

    // Sauvegarder et recharger
    if (isSupabaseConfigured && db) {
        try {
            // Importer en masse avec Supabase
            await db.saveSites(csvData.map(siteData => ({
                url: siteData.url,
                type: siteData.type,
                theme: siteData.theme,
                traffic: siteData.traffic,
                trustFlow: siteData.trustFlow,
                ttf: siteData.ttf,
                follow: siteData.follow
            })));
            
            // Recharger TOUS les sites depuis Supabase
            sites = await db.getSites();
            console.log(`🔄 ${sites.length} sites rechargés depuis Supabase après import`);
        } catch (error) {
            console.error('❌ Erreur import Supabase:', error);
            await saveData();
        }
    } else {
        await saveData();
    }
    
    renderSites();
    setupCheckboxListeners();
    closeImportModal();

    // Afficher le résultat
    alert(`Import terminé !\n${importedCount} sites importés\n${skippedCount} sites ignorés (déjà existants)`);
    
}

function downloadCSVModel() {
    const csvContent = 'URL,Type,Thématique,Trafic,Trust Flow,TTF,Follow\n' +
                      'https://exemple.com,Forum,Business,10000,50,Business,Oui\n' +
                      'https://test.fr,Blog,Technologie,5000,30,Technologie,Non';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele-catalogue.csv';
    link.click();
}

function downloadExcelModel() {
    // Créer un workbook Excel avec plusieurs feuilles
    const workbook = {
        SheetNames: ['Sites', 'Types', 'Thématiques', 'Instructions'],
        Sheets: {
            'Sites': {
                '!ref': 'A1:G6',
                A1: { v: 'URL', t: 's' },
                B1: { v: 'Type', t: 's' },
                C1: { v: 'Thématique', t: 's' },
                D1: { v: 'Trafic', t: 's' },
                E1: { v: 'Trust Flow', t: 's' },
                F1: { v: 'TTF', t: 's' },
                G1: { v: 'Follow', t: 's' },
                A2: { v: 'https://exemple-forum.com', t: 's' },
                B2: { v: 'Forum', t: 's' },
                C2: { v: 'Business', t: 's' },
                D2: { v: 15000, t: 'n' },
                E2: { v: 65, t: 'n' },
                F2: { v: 'Business', t: 's' },
                G2: { v: 'Oui', t: 's' },
                A3: { v: 'https://blog-techno.fr', t: 's' },
                B3: { v: 'Blog', t: 's' },
                C3: { v: 'Technologie', t: 's' },
                D3: { v: 8500, t: 'n' },
                E3: { v: 45, t: 'n' },
                F3: { v: 'Technologie', t: 's' },
                G3: { v: 'Oui', t: 's' },
                A4: { v: 'https://annuaire-sites.net', t: 's' },
                B4: { v: 'Annuaire', t: 's' },
                C4: { v: 'Généraliste', t: 's' },
                D4: { v: 25000, t: 'n' },
                E4: { v: 80, t: 'n' },
                F4: { v: 'Généraliste', t: 's' },
                G4: { v: 'Oui', t: 's' },
                A5: { v: 'https://magazine-mode.com', t: 's' },
                B5: { v: 'Magazine', t: 's' },
                C5: { v: 'Mode', t: 's' },
                D5: { v: 12000, t: 'n' },
                E5: { v: 55, t: 'n' },
                F5: { v: 'Mode', t: 's' },
                G5: { v: 'Non', t: 's' },
                A6: { v: 'https://sport-news.fr', t: 's' },
                B6: { v: 'Actualités', t: 's' },
                C6: { v: 'Sport', t: 's' },
                D6: { v: 30000, t: 'n' },
                E6: { v: 70, t: 'n' },
                F6: { v: 'Sport', t: 's' },
                G6: { v: 'Oui', t: 's' }
            },
            'Types': {
                '!ref': 'A1:B8',
                A1: { v: 'Type', t: 's' },
                B1: { v: 'Description', t: 's' },
                A2: { v: 'Forum', t: 's' },
                B2: { v: 'Sites de discussion et forums', t: 's' },
                A3: { v: 'Blog', t: 's' },
                B3: { v: 'Blogs personnels ou d\'entreprise', t: 's' },
                A4: { v: 'Annuaire', t: 's' },
                B4: { v: 'Annuaire de sites web', t: 's' },
                A5: { v: 'Magazine', t: 's' },
                B5: { v: 'Magazines en ligne', t: 's' },
                A6: { v: 'Actualités', t: 's' },
                B6: { v: 'Sites d\'actualités', t: 's' },
                A7: { v: 'E-commerce', t: 's' },
                B7: { v: 'Boutiques en ligne', t: 's' },
                A8: { v: 'Autre', t: 's' },
                B8: { v: 'Autres types de sites', t: 's' }
            },
            'Thématiques': {
                '!ref': 'A1:B6',
                A1: { v: 'Thématique', t: 's' },
                B1: { v: 'Description', t: 's' },
                A2: { v: 'Business', t: 's' },
                B2: { v: 'Entreprise et business', t: 's' },
                A3: { v: 'Technologie', t: 's' },
                B3: { v: 'Tech et innovation', t: 's' },
                A4: { v: 'Généraliste', t: 's' },
                B4: { v: 'Contenu général', t: 's' },
                A5: { v: 'Mode', t: 's' },
                B5: { v: 'Fashion et style', t: 's' },
                A6: { v: 'Sport', t: 's' },
                B6: { v: 'Sports et fitness', t: 's' }
            },
            'Instructions': {
                '!ref': 'A1:D15',
                A1: { v: 'INSTRUCTIONS D\'IMPORT', t: 's' },
                A3: { v: '1. Feuille "Sites"', t: 's' },
                B3: { v: 'Remplissez cette feuille avec vos sites', t: 's' },
                A4: { v: '2. Colonnes obligatoires', t: 's' },
                B4: { v: 'URL, Type, Thématique', t: 's' },
                A5: { v: '3. Colonnes optionnelles', t: 's' },
                B5: { v: 'Trafic, Trust Flow, TTF, Follow', t: 's' },
                A6: { v: '4. Types disponibles', t: 's' },
                B6: { v: 'Voir feuille "Types"', t: 's' },
                A7: { v: '5. Thématiques disponibles', t: 's' },
                B7: { v: 'Voir feuille "Thématiques"', t: 's' },
                A8: { v: '6. Format URL', t: 's' },
                B8: { v: 'https://exemple.com', t: 's' },
                A9: { v: '7. Format Trafic', t: 's' },
                B9: { v: 'Nombre entier (ex: 10000)', t: 's' },
                A10: { v: '8. Format Trust Flow', t: 's' },
                B10: { v: 'Nombre entier 0-100 (ex: 50)', t: 's' },
                A11: { v: '9. Format TTF', t: 's' },
                B11: { v: 'Business, Technologie, Généraliste, Mode, Sport', t: 's' },
                A12: { v: '10. Format Follow', t: 's' },
                B12: { v: 'Oui ou Non', t: 's' },
                A13: { v: '11. Sauvegarde', t: 's' },
                B13: { v: 'Sauvegardez en CSV pour l\'import', t: 's' },
                A14: { v: '12. Import', t: 's' },
                B14: { v: 'Utilisez le bouton "Importer" dans l\'outil', t: 's' }
            }
        }
    };

    // Convertir en format Excel binaire
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Créer un blob et télécharger
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Modele_Sites_NinjaLinking.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
}

function exportToExcel() {
    if (sites.length === 0) {
        alert('Aucun site à exporter');
        return;
    }

    // Créer un workbook Excel avec les sites
    const workbook = {
        SheetNames: ['Catalogue_Sites'],
        Sheets: {
            'Catalogue_Sites': {
                '!ref': 'A1:G' + (sites.length + 1),
                A1: { v: 'URL', t: 's' },
                B1: { v: 'Type', t: 's' },
                C1: { v: 'Thématique', t: 's' },
                D1: { v: 'Trafic', t: 's' },
                E1: { v: 'Trust Flow', t: 's' },
                F1: { v: 'TTF', t: 's' },
                G1: { v: 'Follow', t: 's' }
            }
        }
    };

    // Ajouter les données des sites
    sites.forEach((site, index) => {
        const row = index + 2;
        workbook.Sheets['Catalogue_Sites'][`A${row}`] = { v: site.url, t: 's' };
        workbook.Sheets['Catalogue_Sites'][`B${row}`] = { v: site.type, t: 's' };
        workbook.Sheets['Catalogue_Sites'][`C${row}`] = { v: site.theme, t: 's' };
        workbook.Sheets['Catalogue_Sites'][`D${row}`] = { v: site.traffic || 0, t: 'n' };
        workbook.Sheets['Catalogue_Sites'][`E${row}`] = { v: site.trustFlow || 0, t: 'n' };
        workbook.Sheets['Catalogue_Sites'][`F${row}`] = { v: site.ttf || '', t: 's' };
        workbook.Sheets['Catalogue_Sites'][`G${row}`] = { v: site.follow || '', t: 's' };
    });

    // Convertir en format Excel binaire
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Créer un blob et télécharger
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Catalogue_Sites_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
}

// Sauvegarde et chargement des données
async function saveData() {
    if (isSupabaseConfigured && db) {
        try {
            console.log('💾 Sauvegarde automatique dans Supabase...');
            
            // Mettre à jour tous les projets modifiés dans Supabase
            for (const project of projects) {
                try {
                    await db.updateProject(project.id, project);
                    console.log(`✅ Projet ${project.name} mis à jour dans Supabase`);
                } catch (error) {
                    console.error(`❌ Erreur mise à jour projet ${project.name}:`, error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde Supabase:', error);
            // Fallback vers localStorage
            saveDataToLocalStorage();
            return false;
        }
    } else {
        // Mode localStorage
        saveDataToLocalStorage();
        return true;
    }
}

function saveDataToLocalStorage() {
    localStorage.setItem('ninjalinking-projects', JSON.stringify(projects));
    localStorage.setItem('ninjalinking-sites', JSON.stringify(sites));
}

async function loadData() {
    console.log('📂 Chargement des données...');
    
    if (isSupabaseConfigured && db) {
        try {
            // Vérifier l'authentification persistante
            await checkAuthentication();
            
            // Charger les sites publics (toujours disponibles)
            sites = await db.getPublicSites();
            console.log(`✅ Sites publics chargés: ${sites.length} sites`);
            
            // Charger les projets seulement si authentifié
            if (isAuthenticated) {
                projects = await db.getProjects();
                console.log(`✅ Projets chargés: ${projects.length} projets`);
            } else {
                projects = [];
                console.log('⚠️ Utilisateur non authentifié, projets non chargés');
            }
            
            // Mettre à jour l'affichage
            setTimeout(() => {
                renderProjects();
                renderSites();
                updateProjectStats();
            }, 100);
            
            return;
        } catch (error) {
            console.error('❌ Erreur chargement Supabase:', error);
            // Fallback vers localStorage
        }
    }
    
    // Si pas authentifié, ne pas charger de données
    if (!isAuthenticated) {
        console.log('⚠️ Utilisateur non authentifié, pas de chargement de données');
        sites = [];
        projects = [];
        renderSites();
        renderProjects();
        return;
    }
    
    // Chargement depuis localStorage
    const savedProjects = localStorage.getItem('ninjalinking-projects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
        
        // Migration des anciens projets vers le nouveau format
        projects = projects.map(project => ({
            id: project.id,
            name: project.name || 'Projet sans nom',
            url: project.url || '',
            objective: project.objective || 'SEO',
            traffic: project.traffic || 0,
            trustFlow: project.trustFlow || 0,
            ttf: project.ttf || 'Business',
            referringDomains: project.referringDomains || 0,
            keywords: project.keywords || [],
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: project.updatedAt || project.createdAt || new Date().toISOString()
        }));
        
        saveData(); // Sauvegarder les projets migrés
    } else {
        projects = [];
    }

    const savedSites = localStorage.getItem('ninjalinking-sites');
    if (savedSites) {
        sites = JSON.parse(savedSites);
    } else {
        sites = [];
    }
    
    // Mettre à jour l'affichage
    setTimeout(() => {
        renderProjects();
        renderSites();
        updateProjectStats();
    }, 100);
}

// ============ IMPORT EXCEL ============

// Variables globales pour l'import
let importedSpotsData = [];
let currentImportFile = null;

// Ouvrir le modal d'import
function openImportSpotsModal() {
    const modal = document.getElementById('importSpotsModal');
    modal.style.display = 'block';
    
    // Réinitialiser le formulaire
    document.getElementById('excelFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importButton').disabled = true;
    importedSpotsData = [];
    currentImportFile = null;
}

// Fermer le modal d'import
function closeImportSpotsModal() {
    document.getElementById('importSpotsModal').style.display = 'none';
    
    // Nettoyer les données
    importedSpotsData = [];
    currentImportFile = null;
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importButton').disabled = true;
}

// Gérer la sélection de fichier
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    currentImportFile = file;
    console.log('📁 Fichier sélectionné:', file.name);
    
    // Vérifier le type de fichier
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('❌ Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
    }
    
    // Lire le fichier Excel
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Prendre la première feuille
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertir en JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Traiter les données
            processExcelData(jsonData);
            
        } catch (error) {
            console.error('❌ Erreur lecture fichier Excel:', error);
            alert('❌ Erreur lors de la lecture du fichier Excel: ' + error.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Traiter les données Excel
function processExcelData(jsonData) {
    if (jsonData.length < 2) {
        alert('❌ Le fichier Excel doit contenir au moins un en-tête et une ligne de données');
        return;
    }
    
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);
    
    console.log('📊 En-têtes détectés:', headers);
    console.log('📊 Nombre de lignes:', dataRows.length);
    
    // Valider les en-têtes requis
    const requiredHeaders = ['URL', 'Type', 'Thématique', 'Trust Flow', 'Trafic', 'TTF', 'Prix', 'Statut'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
        alert(`❌ Colonnes manquantes: ${missingHeaders.join(', ')}\n\nVeuillez utiliser le fichier d'exemple.`);
        return;
    }
    
    // Traiter chaque ligne
    const processedSpots = [];
    const errors = [];
    
    dataRows.forEach((row, index) => {
        if (row.length === 0 || row.every(cell => !cell)) return; // Ligne vide
        
        try {
            const spot = {
                id: Date.now() + Math.random() + index,
                projectId: currentProjectId,
                url: row[headers.indexOf('URL')]?.toString().trim() || '',
                type: row[headers.indexOf('Type')]?.toString().trim() || 'Forum',
                theme: row[headers.indexOf('Thématique')]?.toString().trim() || 'Généraliste',
                trustFlow: parseInt(row[headers.indexOf('Trust Flow')]) || 0,
                traffic: parseInt(row[headers.indexOf('Trafic')]) || 0,
                ttf: row[headers.indexOf('TTF')]?.toString().trim() || 'Business',
                price: parseFloat(row[headers.indexOf('Prix')]) || 0,
                status: row[headers.indexOf('Statut')]?.toString().trim() || 'A publier',
                publicationDate: null
            };
            
            // Validation
            if (!spot.url) {
                errors.push(`Ligne ${index + 2}: URL manquante`);
                return;
            }
            
            if (!isValidUrl(spot.url)) {
                errors.push(`Ligne ${index + 2}: URL invalide (${spot.url})`);
                return;
            }
            
            if (spot.trustFlow < 0 || spot.trustFlow > 100) {
                errors.push(`Ligne ${index + 2}: Trust Flow invalide (${spot.trustFlow})`);
                return;
            }
            
            if (spot.traffic < 0) {
                errors.push(`Ligne ${index + 2}: Trafic invalide (${spot.traffic})`);
                return;
            }
            
            if (spot.price < 0) {
                errors.push(`Ligne ${index + 2}: Prix invalide (${spot.price})`);
                return;
            }
            
            processedSpots.push(spot);
            
        } catch (error) {
            errors.push(`Ligne ${index + 2}: Erreur de traitement - ${error.message}`);
        }
    });
    
    // Stocker les données traitées
    importedSpotsData = processedSpots;
    
    // Afficher l'aperçu
    displayImportPreview(processedSpots, errors);
    
    // Activer le bouton d'import si des données valides
    document.getElementById('importButton').disabled = processedSpots.length === 0;
}

// Valider une URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Afficher l'aperçu de l'import
function displayImportPreview(spots, errors) {
    const preview = document.getElementById('importPreview');
    const tableHead = document.getElementById('previewTableHead');
    const tableBody = document.getElementById('previewTableBody');
    const stats = document.getElementById('importStats');
    
    // Afficher le conteneur
    preview.style.display = 'block';
    
    // En-têtes du tableau
    tableHead.innerHTML = `
        <tr>
            <th>URL</th>
            <th>Type</th>
            <th>Thématique</th>
            <th>Trust Flow</th>
            <th>Trafic</th>
            <th>TTF</th>
            <th>Prix</th>
            <th>Statut</th>
        </tr>
    `;
    
    // Corps du tableau (limité à 10 lignes pour l'aperçu)
    tableBody.innerHTML = spots.slice(0, 10).map(spot => `
        <tr>
            <td>${spot.url}</td>
            <td>${spot.type}</td>
            <td>${spot.theme}</td>
            <td>${spot.trustFlow}</td>
            <td>${spot.traffic.toLocaleString()}</td>
            <td>${spot.ttf}</td>
            <td>${spot.price.toFixed(2)} €</td>
            <td>${spot.status}</td>
        </tr>
    `).join('');
    
    // Statistiques
    const totalSpots = spots.length;
    const totalErrors = errors.length;
    const totalPrice = spots.reduce((sum, spot) => sum + spot.price, 0);
    
    stats.innerHTML = `
        <h5>📊 Statistiques d'import</h5>
        <p class="stat-success">✅ Spots valides: ${totalSpots}</p>
        ${totalErrors > 0 ? `<p class="stat-error">❌ Erreurs: ${totalErrors}</p>` : ''}
        <p>💰 Prix total: ${totalPrice.toFixed(2)} €</p>
        ${totalSpots > 10 ? `<p><small>⚠️ Affichage des 10 premiers spots sur ${totalSpots}</small></p>` : ''}
    `;
    
    // Afficher les erreurs si il y en a
    if (errors.length > 0) {
        const errorDetails = document.createElement('div');
        errorDetails.className = 'import-errors';
        errorDetails.innerHTML = `
            <h5>❌ Erreurs détectées</h5>
            <div style="max-height: 150px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                ${errors.map(error => `<p style="margin: 5px 0; color: #dc3545;">• ${error}</p>`).join('')}
            </div>
        `;
        stats.appendChild(errorDetails);
    }
}

// Importer les spots dans le projet
async function importSpotsFromExcel() {
    if (importedSpotsData.length === 0) {
        alert('❌ Aucune donnée valide à importer');
        return;
    }
    
    try {
        console.log('📥 Import de', importedSpotsData.length, 'spots...');
        
        // Trouver le projet actuel
        const project = projects.find(p => p.id === currentProjectId);
        if (!project) {
            alert('❌ Projet introuvable');
            return;
        }
        
        // Initialiser les spots si nécessaire
        if (!project.spots) {
            project.spots = [];
        }
        
        // Ajouter les spots au projet
        let addedCount = 0;
        let skippedCount = 0;
        
        importedSpotsData.forEach(spot => {
            // Vérifier si le spot existe déjà
            const existingSpot = project.spots.find(s => s.url.toLowerCase() === spot.url.toLowerCase());
            if (existingSpot) {
                skippedCount++;
                console.log(`⚠️ Spot déjà existant ignoré: ${spot.url}`);
                return;
            }
            
            // Ajouter le spot
            project.spots.push(spot);
            addedCount++;
        });
        
        // Sauvegarder les données
        await saveData();
        
        // Mettre à jour l'affichage
        syncProjectSpots();
        renderProjectSpots();
        updateBudgetDisplay(project);
        
        // Fermer le modal
        closeImportSpotsModal();
        
        // Afficher le résultat
        const message = `✅ Import terminé!\n\n` +
                       `• ${addedCount} spots ajoutés\n` +
                       `${skippedCount > 0 ? `• ${skippedCount} spots ignorés (déjà existants)\n` : ''}` +
                       `• Total spots dans le projet: ${project.spots.length}`;
        
        alert(message);
        
        console.log('✅ Import terminé:', { addedCount, skippedCount, totalSpots: project.spots.length });
        
    } catch (error) {
        console.error('❌ Erreur import:', error);
        alert('❌ Erreur lors de l\'import: ' + error.message);
    }
}

// Télécharger le fichier d'exemple
function downloadExampleFile() {
    // Créer les données d'exemple
    const exampleData = [
        ['URL', 'Type', 'Thématique', 'Trust Flow', 'Trafic', 'TTF', 'Prix', 'Statut'],
        ['https://example-blog.com', 'Blog', 'Business & Marketing', 45, 15000, 'Business', 75.00, 'A publier'],
        ['https://example-forum.com', 'Forum', 'Technologie & Informatique', 30, 8000, 'Computers', 50.00, 'En attente'],
        ['https://example-media.com', 'Média', 'Actualités & Médias', 70, 25000, 'News', 150.00, 'Publié'],
        ['https://example-ecommerce.com', 'E-commerce', 'E-commerce & Affiliation', 25, 5000, 'Shopping', 100.00, 'A publier']
    ];
    
    // Créer un workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exampleData);
    
    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Spots');
    
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Créer un blob et télécharger
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exemple-spots-import.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    console.log('📥 Fichier d\'exemple téléchargé');
}

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', function(event) {
    const projectModal = document.getElementById('projectModal');
    const siteModal = document.getElementById('siteModal');
    const addSpotModal = document.getElementById('addSpotModal');
    const importModal = document.getElementById('importModal');
    const addToProjectModal = document.getElementById('addToProjectModal');
    
    if (event.target === projectModal) {
        closeProjectModal();
    }
    
    if (event.target === siteModal) {
        closeSiteModal();
    }
    
    if (event.target === addSpotModal) {
        closeAddSpotModal();
    }
    
    if (event.target === importModal) {
        closeImportModal();
    }
    
    if (event.target === addToProjectModal) {
        closeAddToProjectModal();
    }
});

// Gestionnaire d'erreur global pour les extensions de navigateur
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('Could not establish connection')) {
        console.warn('Erreur d\'extension de navigateur détectée (ignorée):', event.message);
        return true; // Empêche l'affichage de l'erreur
    }
});

// Gestionnaire pour les promesses rejetées (extensions)
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('Could not establish connection')) {
        console.warn('Erreur d\'extension de navigateur détectée (ignorée):', event.reason.message);
        event.preventDefault(); // Empêche l'affichage de l'erreur
    }
});

// Fonction de notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Ajouter les styles si pas déjà présents
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease;
            }
            .notification-success {
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                color: #065f46;
            }
            .notification-error {
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #991b1b;
            }
            .notification-info {
                background: #dbeafe;
                border: 1px solid #bfdbfe;
                color: #1d4ed8;
            }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                margin-left: 12px;
                opacity: 0.7;
            }
            .notification-close:hover {
                opacity: 1;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Ajouter à la page
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Fonction de formatage des nombres
function formatNumber(num) {
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(0) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

// Fonction pour parser les nombres formatés
function parseFormattedNumber(str) {
    if (!str) return 0;
    str = str.toString().trim();
    if (str === '0' || str === '') return 0;
    
    const lastChar = str.slice(-1).toUpperCase();
    const num = parseFloat(str.slice(0, -1));
    
    switch (lastChar) {
        case 'K': return num * 1000;
        case 'M': return num * 1000000;
        case 'B': return num * 1000000000;
        default: return parseFloat(str) || 0;
    }
}

// Fonctions de tri du tableau
function sortTable(column) {
    const table = document.getElementById('catalogTable');
    const tbody = document.getElementById('catalogTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Déterminer la direction du tri
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Mettre à jour les indicateurs visuels
    updateSortIndicators();
    
    // Trier les lignes
    rows.sort((a, b) => {
        const aValue = getCellValue(a, column);
        const bValue = getCellValue(b, column);
        
        let comparison = 0;
        
        // Tri numérique pour les colonnes numériques
        if (column === 'traffic' || column === 'trustFlow') {
            const aNum = parseFormattedNumber(aValue);
            const bNum = parseFormattedNumber(bValue);
            comparison = aNum - bNum;
        } else {
            // Tri alphabétique pour les autres colonnes
            comparison = aValue.localeCompare(bValue, 'fr', { numeric: true });
        }
        
        return currentSort.direction === 'asc' ? comparison : -comparison;
    });
    
    // Réorganiser les lignes dans le DOM
    rows.forEach(row => tbody.appendChild(row));
}

function getCellValue(row, column) {
    const cellIndex = getColumnIndex(column);
    const cell = row.children[cellIndex];
    
    if (!cell) return '';
    
    // Pour les colonnes avec des éléments spéciaux (liens, badges, etc.)
    if (column === 'url') {
        const link = cell.querySelector('a');
        return link ? link.textContent.trim() : cell.textContent.trim();
    } else if (column === 'trustFlow') {
        const valueSpan = cell.querySelector('.trust-flow-value');
        return valueSpan ? valueSpan.textContent.trim() : cell.textContent.trim();
    } else if (column === 'ttf') {
        const badge = cell.querySelector('.ttf-tag');
        return badge ? badge.textContent.trim() : cell.textContent.trim();
    } else if (column === 'traffic') {
        // Pour le trafic, on récupère la valeur brute depuis les données
        const siteId = row.getAttribute('data-site-id');
        if (siteId) {
            const site = sites.find(s => s.id == siteId);
            return site ? site.traffic.toString() : cell.textContent.trim();
        }
        return cell.textContent.trim();
    } else {
        return cell.textContent.trim();
    }
}

function getColumnIndex(column) {
    const columnMap = {
        'url': 1,
        'type': 2,
        'theme': 3,
        'traffic': 4,
        'trustFlow': 5,
        'ttf': 6,
        'follow': 7
    };
    return columnMap[column] || 0;
}

function updateSortIndicators() {
    // Supprimer tous les indicateurs existants
    document.querySelectorAll('.catalog-table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Ajouter l'indicateur pour la colonne active
    if (currentSort.column) {
        const activeTh = document.querySelector(`th[data-sort="${currentSort.column}"]`);
        if (activeTh) {
            activeTh.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    }
}

// Fonctions de tri pour les spots de projet
function sortSpotsTable(column) {
    const table = document.getElementById('projectSpotsTable');
    const tbody = document.getElementById('projectSpotsTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Déterminer la direction du tri
    if (currentSpotsSort.column === column) {
        currentSpotsSort.direction = currentSpotsSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSpotsSort.column = column;
        currentSpotsSort.direction = 'asc';
    }
    
    // Mettre à jour les indicateurs visuels
    updateSpotsSortIndicators();
    
    // Trier les lignes
    rows.sort((a, b) => {
        const aValue = getSpotCellValue(a, column);
        const bValue = getSpotCellValue(b, column);
        
        let comparison = 0;
        
        // Tri numérique pour les colonnes numériques
        if (column === 'traffic' || column === 'trustFlow') {
            const aNum = parseFormattedNumber(aValue);
            const bNum = parseFormattedNumber(bValue);
            comparison = aNum - bNum;
        } else if (column === 'publicationDate') {
            // Tri par date
            const aDate = new Date(aValue || '1900-01-01');
            const bDate = new Date(bValue || '1900-01-01');
            comparison = aDate - bDate;
        } else {
            // Tri alphabétique pour les autres colonnes
            comparison = aValue.localeCompare(bValue, 'fr', { numeric: true });
        }
        
        return currentSpotsSort.direction === 'asc' ? comparison : -comparison;
    });
    
    // Réorganiser les lignes dans le DOM
    rows.forEach(row => tbody.appendChild(row));
}

function getSpotCellValue(row, column) {
    const cellIndex = getSpotColumnIndex(column);
    const cell = row.children[cellIndex];
    
    if (!cell) return '';
    
    // Pour les colonnes avec des éléments spéciaux
    if (column === 'url') {
        const link = cell.querySelector('a');
        return link ? link.textContent.trim() : cell.textContent.trim();
    } else if (column === 'trustFlow') {
        const valueSpan = cell.querySelector('.trust-flow-value');
        return valueSpan ? valueSpan.textContent.trim() : cell.textContent.trim();
    } else if (column === 'ttf') {
        const badge = cell.querySelector('.ttf-tag');
        return badge ? badge.textContent.trim() : cell.textContent.trim();
    } else {
        return cell.textContent.trim();
    }
}

function getSpotColumnIndex(column) {
    const columnMap = {
        'url': 0,
        'type': 1,
        'theme': 2,
        'trustFlow': 3,
        'traffic': 4,
        'ttf': 5,
        'publicationDate': 6,
        'status': 7
    };
    return columnMap[column] || 0;
}

function updateSpotsSortIndicators() {
    // Supprimer tous les indicateurs existants
    document.querySelectorAll('.project-spots-table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Ajouter l'indicateur pour la colonne active
    if (currentSpotsSort.column) {
        const activeTh = document.querySelector(`.project-spots-table th[data-sort="${currentSpotsSort.column}"]`);
        if (activeTh) {
            activeTh.classList.add(currentSpotsSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    }
}

// Fonction d'export Excel pour les spots de projet
function exportProjectSpotsToExcel() {
    if (!projectSpots || projectSpots.length === 0) {
        showNotification('Aucun spot à exporter', 'info');
        return;
    }

    const project = projects.find(p => p.id === currentProjectId);
    if (!project) {
        showNotification('Projet non trouvé', 'error');
        return;
    }

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();
    
    // Préparer les données
    const spotsData = projectSpots.map(spot => ({
        'Site': spot.url,
        'Type': spot.type,
        'Thématique': spot.theme,
        'Trust Flow': spot.trustFlow || 0,
        'Trafic': spot.traffic || 0,
        'TTF': spot.ttf || 'Business',
        'Date Publication': spot.publicationDate ? new Date(spot.publicationDate).toLocaleDateString('fr-FR') : 'Non définie',
        'Statut': spot.status || 'A publier'
    }));

    // Créer la feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(spotsData);
    
    // Ajuster la largeur des colonnes
    const columnWidths = [
        { wch: 30 }, // Site
        { wch: 12 }, // Type
        { wch: 15 }, // Thématique
        { wch: 12 }, // Trust Flow
        { wch: 12 }, // Trafic
        { wch: 12 }, // TTF
        { wch: 15 }, // Date Publication
        { wch: 12 }  // Statut
    ];
    worksheet['!cols'] = columnWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Spots_Projet');

    // Générer le nom du fichier
    const fileName = `Spots_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Télécharger le fichier
    XLSX.writeFile(workbook, fileName);
    
    showNotification(`✅ Export Excel généré : ${fileName}`, 'success');
}

// Variables pour l'édition des spots
let editingSpotId = null;

// Fonction pour ouvrir la modal d'édition d'un spot
function editProjectSpot(spotId) {
    const spot = projectSpots.find(s => s.id === spotId);
    if (!spot) {
        showNotification('Spot non trouvé', 'error');
        return;
    }

    editingSpotId = spotId;
    
    // Remplir le formulaire avec les données du spot
    document.getElementById('editSpotUrl').value = spot.url || '';
    document.getElementById('editSpotTargetUrl').value = spot.targetUrl || '';
    document.getElementById('editSpotType').value = spot.type || 'Forum';
    document.getElementById('editSpotTheme').value = spot.theme || 'Business & Marketing';
    document.getElementById('editSpotTrustFlow').value = spot.trustFlow || 0;
    document.getElementById('editSpotTraffic').value = spot.traffic || 0;
    document.getElementById('editSpotTTF').value = spot.ttf || 'Business';
    document.getElementById('editSpotPublicationDate').value = spot.publicationDate || '';
    document.getElementById('editSpotStatus').value = spot.status || 'A publier';
    
    // Afficher la modal
    document.getElementById('editSpotModal').style.display = 'block';
}

// Fonction pour fermer la modal d'édition
function closeEditSpotModal() {
    document.getElementById('editSpotModal').style.display = 'none';
    editingSpotId = null;
}

// Fonction pour sauvegarder les modifications d'un spot
async function saveEditedSpot(e) {
    e.preventDefault();
    
    if (!editingSpotId) {
        showNotification('Erreur: ID du spot manquant', 'error');
        return;
    }

    const form = e.target;
    const url = form.editSpotUrl.value.trim();
    const targetUrl = form.editSpotTargetUrl.value.trim();
    const type = form.editSpotType.value;
    const theme = form.editSpotTheme.value;
    const trustFlow = parseInt(form.editSpotTrustFlow.value) || 0;
    const traffic = parseInt(form.editSpotTraffic.value) || 0;
    const ttf = form.editSpotTTF.value;
    const publicationDate = form.editSpotPublicationDate.value;
    const status = form.editSpotStatus.value;

    if (!url) {
        showNotification('L\'URL est obligatoire', 'error');
        return;
    }

    // Trouver le spot à modifier
    const spotIndex = projectSpots.findIndex(s => s.id === editingSpotId);
    if (spotIndex === -1) {
        showNotification('Spot non trouvé', 'error');
        return;
    }

    // Mettre à jour les données du spot
    projectSpots[spotIndex] = {
        ...projectSpots[spotIndex],
        url: url,
        targetUrl: targetUrl || null,
        type: type,
        theme: theme,
        trustFlow: trustFlow,
        traffic: traffic,
        ttf: ttf,
        publicationDate: publicationDate,
        status: status
    };

    // Mettre à jour le projet dans la liste des projets
    const project = projects.find(p => p.id === currentProjectId);
    if (project && project.spots) {
        const projectSpotIndex = project.spots.findIndex(s => s.id === editingSpotId);
        if (projectSpotIndex !== -1) {
            project.spots[projectSpotIndex] = projectSpots[spotIndex];
        }
    }

    // Sauvegarder les données
    await saveData();
    
    // Rafraîchir l'affichage
    renderProjectSpots();
    
    // Mettre à jour la jauge de progression si nécessaire
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (currentProject) {
        if (currentProject.publicationGoal && currentProject.publicationGoal > 0) {
            updateProgressGauge(currentProject);
        } else {
            updateProgressGaugeWithoutGoal(currentProject);
        }
    }
    
    // Fermer la modal
    closeEditSpotModal();
    
    showNotification('✅ Spot modifié avec succès', 'success');
}


// Configurer les event listeners d'authentification
function setupAuthEventListeners() {
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire d'inscription
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Formulaire de réinitialisation
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handleReset);
    }
}

// Ajouter un bouton pour configurer Supabase
function addSupabaseConfigButton() {
    const header = document.querySelector('.header');
    if (header) {
        const configBtn = document.createElement('button');
        configBtn.innerHTML = '🚀 Configurer Supabase';
        configBtn.className = 'btn btn-success';
        configBtn.style.marginLeft = 'auto';
        configBtn.onclick = configureSupabase;
        header.appendChild(configBtn);
    }
}

// ===== FONCTIONS DE FAVORIS SIMPLIFIÉES =====

// Fonction pour afficher la section des favoris
function showFavorites() {
    const currentPage = getCurrentPage();
    let footprintsSection, favoritesSection, favoritesList;
    
    switch(currentPage) {
        case 'ninjalinking':
            footprintsSection = document.getElementById('footprintsSection');
            favoritesSection = document.getElementById('favoritesSection');
            favoritesList = document.getElementById('favoritesList');
            break;
        case 'serp':
            footprintsSection = document.getElementById('serpFootprintsSection');
            favoritesSection = document.getElementById('serpFavoritesSection');
            favoritesList = document.getElementById('serpFavoritesList');
            break;
        case 'ereputation':
            footprintsSection = document.getElementById('ereputationFootprintsSection');
            favoritesSection = document.getElementById('ereputationFavoritesSection');
            favoritesList = document.getElementById('ereputationFavoritesList');
            break;
        default:
            footprintsSection = document.getElementById('footprintsSection');
            favoritesSection = document.getElementById('favoritesSection');
            favoritesList = document.getElementById('favoritesList');
    }
    
    if (footprintsSection && favoritesSection) {
        footprintsSection.style.display = 'none';
        favoritesSection.style.display = 'block';
        renderFavoritesList(favoritesList);
    }
}

// Fonction pour masquer la section des favoris
function hideFavorites() {
    const currentPage = getCurrentPage();
    let footprintsSection, favoritesSection;
    
    switch(currentPage) {
        case 'ninjalinking':
            footprintsSection = document.getElementById('footprintsSection');
            favoritesSection = document.getElementById('favoritesSection');
            break;
        case 'serp':
            footprintsSection = document.getElementById('serpFootprintsSection');
            favoritesSection = document.getElementById('serpFavoritesSection');
            break;
        case 'ereputation':
            footprintsSection = document.getElementById('ereputationFootprintsSection');
            favoritesSection = document.getElementById('ereputationFavoritesSection');
            break;
        default:
            footprintsSection = document.getElementById('footprintsSection');
            favoritesSection = document.getElementById('favoritesSection');
    }
    
    if (footprintsSection && favoritesSection) {
        footprintsSection.style.display = 'block';
        favoritesSection.style.display = 'none';
    }
}

// Fonction pour rendre la liste des favoris
function renderFavoritesList(targetList = null) {
    const favoritesList = targetList || document.getElementById('favoritesList');
    if (!favoritesList) return;
    
    favoritesList.innerHTML = '';
    
    const allFavorites = [
        ...favoriteFootprints.map(f => ({footprint: f, type: 'ninjalinking', label: 'Ninja Linking'})),
        ...favoriteSerpFootprints.map(f => ({footprint: f, type: 'serp', label: 'SERP'})),
        ...favoriteEreputationFootprints.map(f => ({footprint: f, type: 'ereputation', label: 'E-Réputation'}))
    ];
    
    if (allFavorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-favorites">
                <i class="fas fa-heart-broken"></i>
                <p>Aucun footprint en favori pour le moment</p>
                <p>Cliquez sur les cœurs à côté des footprints pour les ajouter à vos favoris</p>
            </div>
        `;
        return;
    }
    
    allFavorites.forEach(({footprint, type, label}) => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        
        // Échapper les caractères spéciaux pour les attributs data
        const escapedFootprint = footprint.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        item.innerHTML = `
            <div class="favorite-content">
                <span class="favorite-type">${label}</span>
                <span class="favorite-text">${footprint}</span>
            </div>
            <div class="favorite-actions">
                <button class="btn btn-sm btn-danger remove-favorite-btn" data-footprint="${escapedFootprint}" data-type="${type}" title="Retirer des favoris">
                    <i class="fas fa-heart-broken"></i>
                </button>
            </div>
        `;
        favoritesList.appendChild(item);
    });
}

// Fonction pour utiliser un footprint favori
function useFavoriteFootprint(footprint, type) {
    if (!footprint || !type) return;
    
    switch(type) {
        case 'ninjalinking':
            if (!selectedFootprints.includes(footprint)) {
                selectedFootprints.push(footprint);
                renderFootprints();
            }
            showPage('ninjalinking');
            break;
        case 'serp':
            if (!selectedSerpFootprints.includes(footprint)) {
                selectedSerpFootprints.push(footprint);
                renderSerpFootprints();
            }
            showPage('serp');
            break;
        case 'ereputation':
            if (!selectedEreputationFootprints.includes(footprint)) {
                selectedEreputationFootprints.push(footprint);
                renderEreputationFootprints();
            }
            showPage('ereputation');
            break;
    }
    
    showNotification('Footprint ajouté à la sélection', 'success');
}

// Fonction pour retirer un footprint des favoris
function removeFromFavorites(footprint, type) {
    if (!footprint || !type) return;
    
    // Décoder les caractères échappés
    const decodedFootprint = footprint.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    console.log('🗑️ Suppression du favori:', {footprint, decodedFootprint, type});
    
    let favoritesArray;
    
    switch(type) {
        case 'ninjalinking':
            favoritesArray = favoriteFootprints;
            break;
        case 'serp':
            favoritesArray = favoriteSerpFootprints;
            break;
        case 'ereputation':
            favoritesArray = favoriteEreputationFootprints;
            break;
        default:
            return;
    }
    
    const index = favoritesArray.indexOf(decodedFootprint);
    if (index > -1) {
        favoritesArray.splice(index, 1);
        saveFavorites();
        updateAllFavoriteButtons(); // Mettre à jour tous les boutons
        renderFavoritesList(); // Re-rendre la liste des favoris
        showNotification('Footprint retiré des favoris', 'warning');
        console.log('✅ Favori supprimé:', decodedFootprint);
    } else {
        console.log('❌ Favori non trouvé:', decodedFootprint);
    }
}

// Fonction pour vider tous les favoris
function clearAllFavorites() {
    if (confirm('Êtes-vous sûr de vouloir vider tous vos favoris ? Cette action est irréversible.')) {
        favoriteFootprints = [];
        favoriteSerpFootprints = [];
        favoriteEreputationFootprints = [];
        
        saveFavorites();
        
        const allFavoritesLists = document.querySelectorAll('.favorites-list');
        allFavoritesLists.forEach(list => {
            renderFavoritesList(list);
        });
        
        showNotification('Tous les favoris ont été supprimés', 'warning');
    }
}

// Fonction pour détecter la page actuelle
function getCurrentPage() {
    const pages = document.querySelectorAll('.page');
    for (let page of pages) {
        if (page.classList.contains('active') && page.id) {
            if (page.id === 'ninjalinking-page') return 'ninjalinking';
            if (page.id === 'serp-page') return 'serp';
            if (page.id === 'ereputation-page') return 'ereputation';
        }
    }
    return 'ninjalinking'; // Fallback
}

// Fonction pour afficher une page
function showPage(pageId) {
    console.log(`🔄 Affichage de la page: ${pageId}`);
    
    // Masquer toutes les pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Désactiver tous les boutons de navigation
    const allNavBtns = document.querySelectorAll('.nav-btn');
    allNavBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer le bouton correspondant
    const activeBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Afficher la page correspondante
    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.classList.add('active');
    }
}

// Fonction pour changer de thème
function switchTheme(theme) {
    const body = document.body;
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Retirer toutes les classes de thème
    body.classList.remove('white-theme', 'autumn-theme', 'dark-theme');
    
    // Désactiver tous les boutons de thème
    themeOptions.forEach(option => {
        option.classList.remove('active');
    });
    
    // Appliquer le nouveau thème
    switch(theme) {
        case 'white':
            body.classList.add('white-theme');
            break;
        case 'autumn':
            body.classList.add('autumn-theme');
            break;
        case 'dark':
            body.classList.add('dark-theme');
            break;
    }
    
    // Activer le bouton correspondant
    const activeOption = document.querySelector(`[data-theme="${theme}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
    }
    
    // Sauvegarder le thème
    localStorage.setItem('selectedTheme', theme);
    
    console.log(`🎨 Thème changé vers: ${theme}`);
}

// Fonction pour charger le thème sauvegardé
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'white';
    switchTheme(savedTheme);
}

// Fonction pour sauvegarder un nouveau spot
async function saveNewSpot(e) {
    e.preventDefault();

    const url = document.getElementById('spotUrl').value.trim();
    const targetUrl = document.getElementById('spotTargetUrl').value.trim();
    const type = document.getElementById('spotType').value;
    const theme = document.getElementById('spotTheme').value;
    const trustFlow = parseInt(document.getElementById('spotTrustFlow').value) || 0;
    const traffic = parseInt(document.getElementById('spotTraffic').value) || 0;
    const status = document.getElementById('spotStatus').value;

    if (!url) {
        alert('Veuillez saisir une URL');
        return;
    }

    const newSpot = {
        id: Date.now(), // ID unique basé sur le timestamp
        url: url,
        targetUrl: targetUrl || null,
        type: type,
        theme: theme,
        traffic: traffic,
        trustFlow: trustFlow,
        status: status,
        createdAt: new Date().toISOString()
    };

    // Ajouter le spot au projet actuel (cette logique dépend de votre structure)
    console.log('Nouveau spot créé:', newSpot);
    
    // Fermer le modal et vider le formulaire
    closeAddSpotModal();
    
    // Afficher une notification de succès
    showNotification('Spot ajouté avec succès !', 'success');
}

// Fonction pour fermer le modal d'ajout de spot
function closeAddSpotModal() {
    const modal = document.getElementById('addSpotModal');
    if (modal) {
        modal.style.display = 'none';
        // Vider le formulaire
        document.getElementById('addSpotForm').reset();
    }
}

// Fonction pour ouvrir le modal d'ajout de spot
function openAddSpotModal() {
    const modal = document.getElementById('addSpotModal');
    if (modal) {
        modal.style.display = 'block';
        // Vider le formulaire
        document.getElementById('addSpotForm').reset();
    }
}

// Fonction pour afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    // Définir le style selon le type
    const colors = {
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    // Afficher la notification
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
    
    // Masquer après 3 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}

// Initialisation des événements
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter l'événement de soumission du formulaire d'ajout de spot
    const addSpotForm = document.getElementById('addSpotForm');
    if (addSpotForm) {
        addSpotForm.addEventListener('submit', saveNewSpot);
    }
});
