-- Script pour créer un compte administrateur
-- Exécutez ce script dans l'éditeur SQL de Supabase après avoir créé un utilisateur

-- 1. Créer un utilisateur admin (remplacez par l'email de votre choix)
-- Vous devez d'abord créer cet utilisateur via l'interface d'authentification
-- Puis exécuter cette requête pour lui donner les droits admin

-- 2. Mettre à jour le rôle de l'utilisateur vers 'admin'
-- Remplacez 'votre-email@example.com' par l'email de l'utilisateur que vous voulez promouvoir admin
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'votre-email@example.com';

-- 3. Vérifier que l'utilisateur est bien admin
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';

-- 4. Alternative : Créer directement un utilisateur admin
-- (Utilisez cette méthode si vous voulez créer l'admin directement)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    last_sign_in_at,
    app_metadata,
    user_metadata,
    identities,
    factors,
    recovery_tokens,
    email_change,
    email_change_token_new,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@ninjalinking.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"role": "admin", "name": "Administrateur"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Administrateur"}'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    '',
    '',
    0,
    null,
    '',
    null,
    false,
    null
);

-- 5. Instructions d'utilisation :
-- 1. Exécutez ce script dans l'éditeur SQL de Supabase
-- 2. Connectez-vous avec l'email admin@ninjalinking.com et le mot de passe admin123
-- 3. Changez le mot de passe après la première connexion
-- 4. L'utilisateur aura maintenant accès aux fonctionnalités d'administration
