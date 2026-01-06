-- Schema SQL pour Supabase
-- Copiez et exécutez ces commandes dans l'éditeur SQL de Supabase

-- 1. Table des projets (avec isolation par utilisateur)
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    objective VARCHAR(50) NOT NULL CHECK (objective IN ('SEO', 'E-Réputation')),
    traffic INTEGER DEFAULT 0,
    trust_flow INTEGER DEFAULT 0 CHECK (trust_flow >= 0 AND trust_flow <= 100),
    ttf VARCHAR(100) DEFAULT 'Généraliste',
    referring_domains INTEGER DEFAULT 0,
    publication_goal INTEGER DEFAULT 0,
    budget DECIMAL(10,2) DEFAULT 0.00,
    keywords JSONB DEFAULT '[]'::jsonb,
    spots JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des sites du catalogue PUBLIC (partagé entre tous les utilisateurs)
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    theme VARCHAR(100) NOT NULL,
    traffic INTEGER DEFAULT 0,
    trust_flow INTEGER DEFAULT 0 CHECK (trust_flow >= 0 AND trust_flow <= 100),
    ttf VARCHAR(100) DEFAULT 'Généraliste',
    follow VARCHAR(10) DEFAULT 'Oui' CHECK (follow IN ('Oui', 'Non')),
    notes TEXT DEFAULT '',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Index pour les performances
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_objective ON projects(objective);
CREATE INDEX idx_projects_publication_goal ON projects(publication_goal) WHERE publication_goal > 0;
CREATE INDEX idx_projects_budget ON projects(budget) WHERE budget > 0;
CREATE INDEX idx_sites_type ON sites(type);
CREATE INDEX idx_sites_theme ON sites(theme);
CREATE INDEX idx_sites_url ON sites(url);
CREATE INDEX idx_sites_created_by ON sites(created_by);
CREATE INDEX idx_sites_notes ON sites(notes) WHERE notes IS NOT NULL AND notes != '';

-- 4. RLS (Row Level Security) - Sécurité par utilisateur
-- Projets : privés par utilisateur
-- Sites : public (partagé entre tous les utilisateurs)

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- Sites : PAS de RLS car public

-- Politiques pour les projets (privés)
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Sites : Accès public (lecture pour tous, écriture pour utilisateurs connectés)
-- Pas de RLS activé pour permettre l'accès public

-- 5. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE
    ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Ajouter une colonne de rôle aux utilisateurs
-- Cette colonne sera ajoutée à la table auth.users via une fonction
CREATE OR REPLACE FUNCTION add_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Ajouter le rôle 'user' par défaut pour tous les nouveaux utilisateurs
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour ajouter automatiquement le rôle
DROP TRIGGER IF EXISTS add_user_role_trigger ON auth.users;
CREATE TRIGGER add_user_role_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION add_user_role();

-- 7. Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Données d'exemple (supprimées car nécessitent un user_id valide)
-- Les données d'exemple seront créées automatiquement lors de l'inscription des utilisateurs

-- 7. Vérification des données
SELECT 'Projects:' as table_name, count(*) as count FROM projects
UNION ALL
SELECT 'Sites:' as table_name, count(*) as count FROM sites;
