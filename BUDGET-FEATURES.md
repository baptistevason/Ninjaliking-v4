# Nouvelles Fonctionnalités Budget et Dépenses

## Résumé des modifications

Cette mise à jour ajoute des fonctionnalités de gestion de budget et de suivi des dépenses aux projets Ninja Linking.

## Nouvelles fonctionnalités

### 1. Champ Budget pour les Projets
- **Ajout du champ budget** dans les formulaires de création et modification de projet
- **Type de données** : DECIMAL(10,2) avec valeur par défaut 0.00
- **Interface** : Champ numérique avec validation (min: 0, step: 0.01)
- **Affichage** : Format monétaire en euros (€)

### 2. Champ Prix pour les Spots
- **Ajout du champ prix** dans le formulaire d'ajout de spot
- **Type de données** : Prix stocké dans le champ JSONB `spots` de chaque projet
- **Interface** : Champ numérique avec validation (min: 0, step: 0.01)
- **Affichage** : Colonne "PRIX" dans le tableau des spots avec format monétaire

### 3. Suivi des Dépenses
- **Section dédiée** dans la page de détail du projet
- **Calcul automatique** des dépenses totales (somme des prix des spots)
- **Affichage du budget restant** (budget - dépenses)
- **Barre de progression visuelle** avec couleurs adaptatives :
  - Vert : < 80% du budget utilisé
  - Orange : 80-99% du budget utilisé  
  - Rouge : ≥ 100% du budget utilisé

## Fichiers modifiés

### Base de données
- `add-budget-column.sql` : Script de migration pour ajouter la colonne budget

### Interface utilisateur
- `index.html` : 
  - Ajout du champ budget dans les formulaires de projet
  - Ajout du champ prix dans le formulaire de spot
  - Ajout de la colonne PRIX dans le tableau des spots
  - Ajout de la section budget et dépenses

### Styles
- `ninja-linking-styles.css` : Styles pour la section budget et dépenses

### Logique métier
- `ninja-linking-script.js` :
  - Modification des fonctions de sauvegarde de projet
  - Modification des fonctions de gestion des spots
  - Ajout de la fonction `updateBudgetDisplay()`
  - Mise à jour de l'affichage en temps réel

- `supabase-service.js` :
  - Ajout du champ budget dans la sauvegarde Supabase

## Instructions d'installation

### 1. Migration de la base de données
Exécutez le script SQL dans Supabase :
```sql
-- Ajouter la colonne budget à la table projects
ALTER TABLE projects 
ADD COLUMN budget DECIMAL(10,2) DEFAULT 0.00;

-- Ajouter un index pour les performances
CREATE INDEX idx_projects_budget ON projects(budget) WHERE budget > 0;
```

### 2. Déploiement
Les modifications sont compatibles avec l'infrastructure existante :
- Pas de changement de structure de base de données pour les spots (utilise JSONB)
- Rétrocompatibilité avec les projets existants
- Interface responsive

## Utilisation

### Création d'un projet
1. Ouvrir le formulaire "Nouveau projet"
2. Remplir les informations du projet
3. **Ajouter le budget** dans le champ "Budget (€)"
4. Sauvegarder le projet

### Ajout d'un spot
1. Ouvrir le formulaire "Ajouter un spot"
2. Remplir les informations du spot
3. **Ajouter le prix** dans le champ "Prix (€)"
4. Sauvegarder le spot

### Suivi des dépenses
1. Ouvrir la page de détail d'un projet
2. Consulter la section "Budget et Dépenses"
3. Visualiser :
   - Budget alloué
   - Dépenses totales
   - Budget restant
   - Pourcentage d'utilisation

## Notes techniques

- **Format monétaire** : Tous les montants sont affichés en euros (€)
- **Précision** : 2 décimales pour tous les montants
- **Calculs en temps réel** : Mise à jour automatique lors des modifications
- **Validation** : Valeurs numériques positives uniquement
- **Performance** : Index sur la colonne budget pour les requêtes rapides

## Compatibilité

- ✅ Compatible avec les projets existants
- ✅ Compatible avec Supabase et localStorage
- ✅ Interface responsive
- ✅ Rétrocompatibilité assurée

