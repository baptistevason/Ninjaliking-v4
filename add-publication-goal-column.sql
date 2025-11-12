-- Script pour ajouter la colonne publication_goal à la table projects
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne publication_goal à la table projects
ALTER TABLE projects 
ADD COLUMN publication_goal INTEGER DEFAULT 0;

-- Ajouter un index pour les performances si nécessaire
CREATE INDEX idx_projects_publication_goal ON projects(publication_goal) WHERE publication_goal > 0;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'publication_goal';

