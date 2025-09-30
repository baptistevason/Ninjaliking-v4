-- Script de sécurisation : S'assurer que seul vason.baptiste@gmail.com est admin
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Retirer les privilèges admin de tous les autres utilisateurs
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email != 'vason.baptiste@gmail.com';

-- 2. Promouvoir uniquement vason.baptiste@gmail.com au rang d'admin
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'vason.baptiste@gmail.com';

-- 3. Assigner le rôle 'user' à tous les autres utilisateurs
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb
WHERE email != 'vason.baptiste@gmail.com';

-- 4. Vérification : Afficher tous les utilisateurs et leurs rôles
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    created_at,
    CASE 
        WHEN email = 'vason.baptiste@gmail.com' THEN '👑 ADMIN'
        ELSE '👤 USER'
    END as status
FROM auth.users 
ORDER BY 
    CASE WHEN email = 'vason.baptiste@gmail.com' THEN 0 ELSE 1 END,
    created_at;

-- 5. Confirmation de sécurité
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN raw_user_meta_data->>'role' = 'user' THEN 1 END) as user_count
FROM auth.users;
