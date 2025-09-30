// Service Supabase pour Ninja Linking avec authentification
class SupabaseService {
    constructor() {
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.supabase = null;
        this.isInitialized = false;
        this.currentUser = null;
    }

    // Initialiser Supabase avec les credentials
    async initialize(supabaseUrl, supabaseAnonKey) {
        try {
            this.supabaseUrl = supabaseUrl;
            this.supabaseKey = supabaseAnonKey;
            
            // Charger la librairie Supabase depuis CDN si pas déjà chargée
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseLibrary();
            }
            
            // Créer le client Supabase
            this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            this.isInitialized = true;
            
            // Vérifier la session utilisateur existante
            await this.checkCurrentUser();
            
            console.log('✅ Supabase initialisé avec succès');
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation Supabase:', error);
            return false;
        }
    }

    // Charger la librairie Supabase dynamiquement
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Vérifier si Supabase est initialisé
    checkInitialized() {
        if (!this.isInitialized) {
            throw new Error('Supabase non initialisé. Appelez initialize() d\'abord.');
        }
    }

    // ============ AUTHENTIFICATION ============
    
    // Vérifier l'utilisateur actuel
    async checkCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Erreur vérification utilisateur:', error);
            this.currentUser = null;
            return null;
        }
    }

    // Inscription d'un nouvel utilisateur
    async signUp(email, password, userData = {}) {
        this.checkInitialized();
        
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;
            
            this.currentUser = data.user;
            console.log('✅ Inscription réussie');
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            return { success: false, error: error.message };
        }
    }

    // Connexion d'un utilisateur
    async signIn(email, password) {
        this.checkInitialized();
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            this.currentUser = data.user;
            console.log('✅ Connexion réussie');
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            return { success: false, error: error.message };
        }
    }

    // Déconnexion
    async signOut() {
        this.checkInitialized();
        
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            console.log('✅ Déconnexion réussie');
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            return { success: false, error: error.message };
        }
    }

    // Réinitialisation de mot de passe
    async resetPassword(email) {
        this.checkInitialized();
        
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;
            
            console.log('✅ Email de réinitialisation envoyé');
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur réinitialisation:', error);
            return { success: false, error: error.message };
        }
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // ============ PROJETS ============
    async saveProject(project) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const projectData = {
                user_id: this.currentUser.id,
                name: project.name,
                url: project.url,
                objective: project.objective,
                traffic: project.traffic || 0,
                trust_flow: project.trustFlow || 0,
                ttf: project.ttf || 'Généraliste',
                referring_domains: project.referringDomains || 0,
                keywords: project.keywords || [],
                spots: project.spots || []
            };

            const { data, error } = await this.supabase
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (error) throw error;
            
            // Convertir les données Supabase vers notre format
            return {
                ...data,
                trustFlow: data.trust_flow,
                referringDomains: data.referring_domains,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('Erreur sauvegarde projet:', error);
            throw error;
        }
    }

    async getProjects() {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const { data, error } = await this.supabase
                .from('projects')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convertir les données Supabase vers notre format
            return data.map(project => ({
                ...project,
                trustFlow: project.trust_flow,
                referringDomains: project.referring_domains,
                createdAt: project.created_at,
                updatedAt: project.updated_at,
                keywords: project.keywords || [],
                spots: project.spots || []
            }));
        } catch (error) {
            console.error('Erreur chargement projets:', error);
            return [];
        }
    }

    async updateProject(id, project) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const projectData = {
                name: project.name,
                url: project.url,
                objective: project.objective,
                traffic: project.traffic || 0,
                trust_flow: project.trustFlow || 0,
                ttf: project.ttf || 'Généraliste',
                referring_domains: project.referringDomains || 0,
                keywords: project.keywords || [],
                spots: project.spots || [],
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('projects')
                .update(projectData)
                .eq('id', id)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            
            return {
                ...data,
                trustFlow: data.trust_flow,
                referringDomains: data.referring_domains,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('Erreur mise à jour projet:', error);
            throw error;
        }
    }

    async deleteProject(id) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const { error } = await this.supabase
                .from('projects')
                .delete()
                .eq('id', id)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur suppression projet:', error);
            throw error;
        }
    }

    async deleteProjects(ids) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const { error } = await this.supabase
                .from('projects')
                .delete()
                .in('id', ids)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur suppression projets en masse:', error);
            throw error;
        }
    }

    // ============ SITES (PUBLIC) ============
    async saveSite(site) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const siteData = {
                url: site.url,
                type: site.type,
                theme: site.theme,
                traffic: site.traffic || 0,
                trust_flow: site.trustFlow || 0,
                ttf: site.ttf || 'Généraliste',
                follow: site.follow || 'Oui',
                created_by: this.currentUser.id
            };

            // Upsert pour éviter les doublons sur l'URL (public)
            const { data, error } = await this.supabase
                .from('sites')
                .upsert([siteData], { onConflict: 'url' })
                .select()
                .single();

            if (error) throw error;
            
            return {
                ...data,
                trustFlow: data.trust_flow,
                createdAt: data.created_at
            };
        } catch (error) {
            console.error('Erreur sauvegarde site:', error);
            throw error;
        }
    }

    async saveSites(sites) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const sitesData = sites.map(site => ({
                url: site.url,
                type: site.type,
                theme: site.theme,
                traffic: site.traffic || 0,
                trust_flow: site.trustFlow || 0,
                ttf: site.ttf || 'Généraliste',
                follow: site.follow || 'Oui',
                created_by: this.currentUser.id
            }));

            const { data, error } = await this.supabase
                .from('sites')
                .upsert(sitesData, { onConflict: 'url' })
                .select();

            if (error) throw error;
            
            return data.map(site => ({
                ...site,
                trustFlow: site.trust_flow,
                createdAt: site.created_at
            }));
        } catch (error) {
            console.error('Erreur sauvegarde sites en masse:', error);
            throw error;
        }
    }

    async getSites() {
        this.checkInitialized();
        
        try {
            // Sites publics - pas besoin d'authentification pour la lecture
            const { data, error } = await this.supabase
                .from('sites')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(site => ({
                ...site,
                trustFlow: site.trust_flow,
                createdAt: site.created_at
            }));
        } catch (error) {
            console.error('Erreur chargement sites:', error);
            return [];
        }
    }

    async deleteSite(id) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            // Seul le créateur peut supprimer un site
            const { error } = await this.supabase
                .from('sites')
                .delete()
                .eq('id', id)
                .eq('created_by', this.currentUser.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur suppression site:', error);
            throw error;
        }
    }

    async deleteSites(ids) {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            // Seul le créateur peut supprimer des sites
            const { error } = await this.supabase
                .from('sites')
                .delete()
                .in('id', ids)
                .eq('created_by', this.currentUser.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur suppression sites en masse:', error);
            throw error;
        }
    }

    // ============ SITES PUBLICS (SANS AUTHENTIFICATION) ============
    
    // Obtenir les sites publics (accessible sans authentification)
    async getPublicSites() {
        this.checkInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('sites')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(site => ({
                ...site,
                trustFlow: site.trust_flow,
                createdAt: site.created_at
            }));
        } catch (error) {
            console.error('Erreur chargement sites publics:', error);
            return [];
        }
    }

    // ============ STATISTIQUES ============
    async getProjectStats() {
        this.checkInitialized();
        
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non authentifié');
        }
        
        try {
            const { data, error } = await this.supabase
                .from('projects')
                .select('objective, created_at')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

            const stats = {
                total: data.length,
                seo_count: data.filter(p => p.objective === 'SEO').length,
                reputation_count: data.filter(p => p.objective === 'E-Réputation').length,
                monthly_count: data.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length
            };

            console.log('📊 Stats calculées:', stats);
            return stats;
        } catch (error) {
            console.error('Erreur stats projets:', error);
            return { total: 0, seo_count: 0, reputation_count: 0, monthly_count: 0 };
        }
    }

    // ============ MIGRATION DONNÉES ============
    async migrateFromLocalStorage(projects, sites) {
        this.checkInitialized();
        
        try {
            console.log('🔄 Migration des données depuis localStorage...');
            
            // Migrer les sites d'abord (pour éviter les contraintes de clés étrangères)
            if (sites && sites.length > 0) {
                await this.saveSites(sites);
                console.log(`✅ ${sites.length} sites migrés`);
            }
            
            // Migrer les projets
            if (projects && projects.length > 0) {
                for (const project of projects) {
                    await this.saveProject(project);
                }
                console.log(`✅ ${projects.length} projets migrés`);
            }
            
            console.log('🎉 Migration terminée avec succès');
            return true;
        } catch (error) {
            console.error('❌ Erreur migration:', error);
            return false;
        }
    }

    // ============ TEST CONNEXION ============
    async testConnection() {
        this.checkInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('projects')
                .select('id')
                .limit(1);

            if (error) throw error;
            console.log('✅ Connexion Supabase OK');
            return true;
        } catch (error) {
            console.error('❌ Test connexion Supabase échoué:', error);
            return false;
        }
    }
}

// Export pour utilisation globale
window.SupabaseService = SupabaseService;
