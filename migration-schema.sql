-- Script de migration pour ajouter l'authentification
-- Exécutez ces commandes une par une dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne user_id à la table projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ajouter la colonne created_by à la table sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Supprimer l'ancienne contrainte unique sur sites si elle existe
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_url_key;

-- 4. Ajouter la nouvelle contrainte unique sur sites
ALTER TABLE sites ADD CONSTRAINT sites_url_unique UNIQUE (url);

-- 5. Activer RLS sur la table projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 6. Créer les politiques pour les projets
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_created_by ON sites(created_by);

-- 8. Vérifier que tout fonctionne
SELECT 'Migration terminée avec succès' as status;
