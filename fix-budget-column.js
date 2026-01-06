// Script de correction automatique de la colonne budget
// À exécuter dans la console du navigateur

console.log('🔧 Script de correction de la colonne budget');

// Fonction de vérification et correction complète
async function fixBudgetColumn() {
    console.log('🔧 Début de la correction de la colonne budget...');
    
    try {
        // 1. Vérifier la connexion Supabase
        console.log('📊 Vérification de la connexion Supabase...');
        
        const defaultUrl = 'https://kckdjgedbjjuhmcqcmpe.supabase.co';
        const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2RqZ2VkYmpqdWhtY3FjbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjQzMzMsImV4cCI6MjA3MzcwMDMzM30.-TUGbwjk_8OUGZKJdnU5CqyJHI8wm4o1j1LdzRnSKhg';
        
        const supabaseUrl = localStorage.getItem('supabase-url') || defaultUrl;
        const supabaseKey = localStorage.getItem('supabase-anon-key') || defaultKey;
        
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
        
        // 2. Vérifier la structure de la table
        console.log('🔍 Vérification de la structure de la table...');
        
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'projects')
            .order('ordinal_position');
        
        if (columnsError) {
            console.log('❌ Erreur vérification structure:', columnsError.message);
            return false;
        }
        
        console.log('📊 Colonnes actuelles de la table projects:');
        columns.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
        });
        
        const hasBudget = columns.some(col => col.column_name === 'budget');
        
        if (hasBudget) {
            console.log('✅ Colonne budget déjà présente');
        } else {
            console.log('❌ Colonne budget manquante');
            console.log('📝 Script SQL à exécuter dans Supabase:');
            console.log(`
-- Ajouter la colonne budget à la table projects
ALTER TABLE projects 
ADD COLUMN budget DECIMAL(10,2) DEFAULT 0.00;

-- Ajouter un index pour les performances
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget) WHERE budget > 0;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'budget';
            `);
            
            console.log('⚠️ IMPORTANT: Exécutez ce script dans l\'éditeur SQL de Supabase');
            return false;
        }
        
        // 3. Tester la sauvegarde d'un projet avec budget
        console.log('🧪 Test de sauvegarde avec budget...');
        
        const testProject = {
            name: 'Test Budget ' + Date.now(),
            url: 'https://test-budget-' + Date.now() + '.com',
            objective: 'SEO',
            traffic: 1000,
            trustFlow: 50,
            ttf: 'Business',
            referringDomains: 10,
            publicationGoal: 5,
            budget: 1500.50,
            keywords: ['test', 'budget'],
            spots: []
        };
        
        console.log('📊 Projet de test:', testProject);
        
        // Tenter la sauvegarde
        const { data: savedProject, error: saveError } = await supabase
            .from('projects')
            .insert([{
                user_id: '00000000-0000-0000-0000-000000000000', // UUID temporaire pour le test
                name: testProject.name,
                url: testProject.url,
                objective: testProject.objective,
                traffic: testProject.traffic,
                trust_flow: testProject.trustFlow,
                ttf: testProject.ttf,
                referring_domains: testProject.referringDomains,
                publication_goal: testProject.publicationGoal,
                budget: testProject.budget,
                keywords: testProject.keywords,
                spots: testProject.spots
            }])
            .select()
            .single();
        
        if (saveError) {
            console.log('❌ Erreur sauvegarde:', saveError.message);
            return false;
        }
        
        console.log('✅ Projet sauvegardé avec succès !');
        console.log('📊 Données sauvegardées:', savedProject);
        console.log(`💰 Budget sauvegardé: ${savedProject.budget} €`);
        
        // 4. Vérifier les données existantes
        console.log('📊 Vérification des projets existants avec budget...');
        
        const { data: existingProjects, error: fetchError } = await supabase
            .from('projects')
            .select('id, name, budget')
            .not('budget', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (fetchError) {
            console.log('❌ Erreur récupération projets:', fetchError.message);
        } else {
            console.log(`📊 ${existingProjects.length} projets avec budget trouvés:`);
            existingProjects.forEach(project => {
                console.log(`- ${project.name} (ID: ${project.id}): ${project.budget} €`);
            });
        }
        
        // 5. Nettoyer le projet de test
        console.log('🧹 Nettoyage du projet de test...');
        
        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', savedProject.id);
        
        if (deleteError) {
            console.log('⚠️ Erreur suppression projet test:', deleteError.message);
        } else {
            console.log('✅ Projet de test supprimé');
        }
        
        console.log('✅ Correction de la colonne budget terminée');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
        return false;
    }
}

// Fonction de diagnostic rapide
async function diagnoseBudgetIssue() {
    console.log('🔍 Diagnostic du problème de budget...');
    
    try {
        // Vérifier localStorage
        const projects = localStorage.getItem('ninjalinking-projects');
        if (projects) {
            const parsedProjects = JSON.parse(projects);
            console.log('📱 Projets dans localStorage:');
            parsedProjects.forEach(project => {
                console.log(`- ${project.name}: budget = ${project.budget || 'Non défini'}`);
            });
        }
        
        // Vérifier les variables globales
        console.log('🌐 Variables globales:');
        console.log('- isSupabaseConfigured:', typeof isSupabaseConfigured !== 'undefined' ? isSupabaseConfigured : 'Non défini');
        console.log('- db:', typeof db !== 'undefined' ? (db ? 'Initialisé' : 'Non initialisé') : 'Non défini');
        
        // Vérifier la configuration Supabase
        const supabaseUrl = localStorage.getItem('supabase-url');
        const supabaseKey = localStorage.getItem('supabase-anon-key');
        console.log('🔧 Configuration Supabase:');
        console.log('- URL:', supabaseUrl || 'Non configuré');
        console.log('- Key:', supabaseKey ? 'Configurée' : 'Non configurée');
        
    } catch (error) {
        console.error('❌ Erreur diagnostic:', error);
    }
}

// Exécuter automatiquement la correction
console.log('🚀 Démarrage de la correction...');
fixBudgetColumn();

// Exporter les fonctions pour utilisation manuelle
window.fixBudgetColumn = fixBudgetColumn;
window.diagnoseBudgetIssue = diagnoseBudgetIssue;

console.log('✅ Script de correction chargé');
console.log('💡 Fonctions disponibles:');
console.log('- fixBudgetColumn() : Correction complète');
console.log('- diagnoseBudgetIssue() : Diagnostic du problème');




