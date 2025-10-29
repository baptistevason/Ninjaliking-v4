# 🔧 Guide de Résolution - Problème Budget Non Sauvegardé

## ❌ Problème Identifié
Le budget alloué dans les projets n'est pas sauvegardé dans Supabase.

## 🔍 Cause du Problème
La colonne `budget` n'existe pas dans la table `projects` de votre base de données Supabase.

## 🚀 Solutions

### **Solution 1 : Vérification Automatique (Recommandée)**
1. Ouvrez http://localhost:3000/verify-budget-column.html
2. Cliquez sur "🔍 Vérifier Structure"
3. Si la colonne budget manque, cliquez sur "➕ Ajouter Colonne Budget"
4. Suivez les instructions pour exécuter le script SQL dans Supabase
5. Testez avec "🧪 Tester Sauvegarde Budget"

### **Solution 2 : Script Console**
1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Copiez et collez le contenu de `fix-budget-column.js`
4. Appuyez sur Entrée

### **Solution 3 : Correction Manuelle**
1. Allez dans votre dashboard Supabase
2. Ouvrez l'éditeur SQL
3. Exécutez ce script :

```sql
-- Ajouter la colonne budget à la table projects
ALTER TABLE projects 
ADD COLUMN budget DECIMAL(10,2) DEFAULT 0.00;

-- Ajouter un index pour les performances
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget) WHERE budget > 0;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'budget';
```

## 📊 Vérification

### **Vérifier que la colonne existe :**
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'budget';
```

### **Vérifier les données :**
```sql
SELECT id, name, budget 
FROM projects 
WHERE budget IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔧 Script de Migration Complet

Si vous voulez migrer les budgets existants depuis localStorage :

```sql
-- Script de migration (à adapter selon vos données)
UPDATE projects 
SET budget = 0.00 
WHERE budget IS NULL;
```

## 🧪 Test de Fonctionnement

1. Créez un nouveau projet avec un budget
2. Vérifiez qu'il est sauvegardé dans Supabase
3. Rechargez la page et vérifiez que le budget est toujours là

## 📁 Fichiers de Résolution

- `verify-budget-column.html` : Outil de vérification web
- `fix-budget-column.js` : Script de correction automatique
- `add-budget-column.sql` : Script SQL de migration
- `supabase-schema.sql` : Schéma mis à jour avec la colonne budget

## ⚠️ Points Importants

- La colonne `budget` doit être de type `DECIMAL(10,2)`
- La valeur par défaut est `0.00`
- L'index est créé pour les performances
- Les budgets existants dans localStorage ne sont pas automatiquement migrés

## 🆘 En Cas de Problème Persistant

1. Vérifiez que vous êtes connecté à Supabase
2. Vérifiez que vous avez les droits d'administration
3. Vérifiez que la table `projects` existe
4. Contactez le support si nécessaire

## ✅ Résultat Attendu

Après la correction :
- ✅ La colonne `budget` existe dans la table `projects`
- ✅ Les budgets sont sauvegardés dans Supabase
- ✅ Les budgets persistent après rechargement
- ✅ L'interface affiche correctement les budgets




