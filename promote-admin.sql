-- Script pour promouvoir vason.baptiste@gmail.com au rang d'administrateur
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Promouvoir l'utilisateur vason.baptiste@gmail.com au rang d'admin
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'vason.baptiste@gmail.com';

-- 2. Vérifier que la promotion a bien fonctionné
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'vason.baptiste@gmail.com';

-- 3. Vérifier tous les administrateurs (optionnel)
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at;

-- 4. S'assurer que tous les autres utilisateurs ont le rôle 'user' (optionnel)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb
WHERE email != 'vason.baptiste@gmail.com' 
AND (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'admin');

-- 5. Confirmation finale
SELECT 'Administrateur configuré avec succès' as status;
