-- Script pour ajouter la colonne budget à la table projects
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne budget à la table projects
ALTER TABLE projects 
ADD COLUMN budget DECIMAL(10,2) DEFAULT 0.00;

-- Ajouter un index pour les performances si nécessaire
CREATE INDEX idx_projects_budget ON projects(budget) WHERE budget > 0;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'budget';

