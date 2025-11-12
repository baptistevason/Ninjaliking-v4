-- Script pour ajouter la colonne notes à la table sites
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne notes à la table sites
ALTER TABLE sites 
ADD COLUMN notes TEXT DEFAULT '';

-- Ajouter un index pour les performances si nécessaire
CREATE INDEX idx_sites_notes ON sites(notes) WHERE notes IS NOT NULL AND notes != '';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sites' AND column_name = 'notes';

