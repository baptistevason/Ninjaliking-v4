# 🔧 Guide de Résolution - Problème de Connexion Supabase

## ❌ Problème Identifié
L'erreur "Connection string is missing" indique que Supabase n'est pas correctement configuré.

## 🚀 Solutions

### **1. Test de Connexion**
1. Ouvrez le fichier `test-supabase-connection.html` dans votre navigateur
2. Cliquez sur "🧪 Tester la connexion"
3. Vérifiez que la connexion fonctionne

### **2. Configuration Manuelle**
Si le test échoue, suivez ces étapes :

#### **A. Obtenir vos credentials Supabase**
1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** (ex: `https://votre-projet.supabase.co`)
   - **anon public** key (commence par `eyJhbGc...`)

#### **B. Configurer dans l'application**
1. Ouvrez l'application principale
2. Cliquez sur le bouton "🔧 Configurer Supabase" (en bas à droite)
3. Entrez vos credentials
4. Cliquez sur "Configurer"

### **3. Vérification de la Base de Données**

#### **A. Exécuter les scripts SQL**
1. Dans Supabase, allez dans **SQL Editor**
2. Exécutez le contenu de `add-publication-goal-column.sql`
3. Exécutez le contenu de `add-notes-column.sql`

#### **B. Vérifier les tables**
```sql
-- Vérifier la structure de la table projects
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Vérifier la structure de la table sites
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sites' 
ORDER BY ordinal_position;
```

### **4. Configuration des Permissions**

#### **A. RLS (Row Level Security)**
```sql
-- Activer RLS sur les tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Politique pour les projets (privés par utilisateur)
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Politique pour les sites (publics)
CREATE POLICY "Sites are viewable by everyone" ON sites
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert sites" ON sites
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sites" ON sites
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sites" ON sites
    FOR DELETE USING (auth.uid() IS NOT NULL);
```

### **5. Test Final**
1. Rechargez l'application
2. Créez un compte ou connectez-vous
3. Créez un projet avec un objectif de publication
4. Actualisez la page
5. Vérifiez que l'objectif est conservé

## 🔍 Diagnostic

### **A. Vérifier la Console**
Ouvrez les outils de développement (F12) et vérifiez :
- ✅ "Supabase configuré" dans la console
- ❌ Erreurs de connexion
- ❌ Erreurs de permissions

### **B. Vérifier le localStorage**
```javascript
// Dans la console du navigateur
console.log('URL:', localStorage.getItem('supabase-url'));
console.log('Key:', localStorage.getItem('supabase-anon-key'));
```

### **C. Test de Connexion Direct**
```javascript
// Dans la console du navigateur
const { createClient } = supabase;
const supabaseClient = createClient(
    localStorage.getItem('supabase-url'),
    localStorage.getItem('supabase-anon-key')
);

// Test de connexion
supabaseClient.from('projects').select('*').limit(1)
    .then(result => console.log('✅ Connexion OK:', result))
    .catch(error => console.error('❌ Erreur:', error));
```

## 🆘 En Cas de Problème Persistant

### **A. Nettoyer le Cache**
1. Ouvrez les outils de développement (F12)
2. Clic droit sur le bouton de rechargement
3. Sélectionnez "Vider le cache et recharger"

### **B. Réinitialiser la Configuration**
```javascript
// Dans la console du navigateur
localStorage.removeItem('supabase-url');
localStorage.removeItem('supabase-anon-key');
localStorage.removeItem('isAuthenticated');
localStorage.removeItem('currentUser');
location.reload();
```

### **C. Vérifier les Credentials**
- L'URL doit commencer par `https://`
- La clé doit commencer par `eyJhbGc`
- Vérifiez que le projet Supabase est actif

## 📞 Support
Si le problème persiste, vérifiez :
1. Que votre projet Supabase est actif
2. Que les credentials sont corrects
3. Que les tables existent avec les bonnes colonnes
4. Que les politiques RLS sont configurées





