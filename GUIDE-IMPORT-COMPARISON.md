# 📊 Guide de Comparaison - Import Excel

## 🎯 Différences entre les Types d'Import

### **📚 Import du Catalogue (Sites)**
- **Bouton** : "Importer Catalogue Excel" (visible pour les admins)
- **Usage** : Ajouter des sites au catalogue général
- **Fichier modèle** : `exemple-catalogue-import.csv`
- **Colonnes** : URL, Type, Thématique, Trust Flow, Trafic, TTF, Follow, Notes
- **Prix/Statut** : ❌ PAS nécessaires
- **Résultat** : Sites ajoutés au catalogue général

### **🎯 Import de Spots dans un Projet**
- **Bouton** : "Importer Excel" (dans les détails d'un projet)
- **Usage** : Ajouter des spots à un projet spécifique
- **Fichier modèle** : `exemple-spots-projet-import.csv`
- **Colonnes** : URL, Type, Thématique, Trust Flow, Trafic, TTF, Prix, Statut
- **Prix/Statut** : ✅ Requis pour le suivi budgétaire
- **Résultat** : Spots ajoutés au projet sélectionné

## 📋 Tableau de Comparaison

| Aspect | Catalogue | Spots Projet |
|--------|-----------|--------------|
| **Colonnes requises** | URL, Type, Thématique, Trust Flow, Trafic, TTF, Follow, Notes | URL, Type, Thématique, Trust Flow, Trafic, TTF, Prix, Statut |
| **Prix** | ❌ Non nécessaire | ✅ Requis (pour budget) |
| **Statut** | ❌ Non nécessaire | ✅ Requis (A publier, En attente, Publié, Rejeté) |
| **Follow** | ✅ Requis | ❌ Non nécessaire |
| **Notes** | ✅ Optionnel | ❌ Non nécessaire |
| **Localisation** | Section Catalogue | Détails d'un Projet |
| **Visibilité** | Admin uniquement | Tous les utilisateurs |
| **Fichier modèle** | `exemple-catalogue-import.csv` | `exemple-spots-projet-import.csv` |

## 🚀 Utilisation Pratique

### **Scénario 1 : Ajouter des sites au catalogue**
1. Allez dans la section "Catalogue"
2. Cliquez sur "Importer Catalogue Excel"
3. Utilisez le modèle `exemple-catalogue-import.csv`
4. Les sites seront ajoutés au catalogue général

### **Scénario 2 : Ajouter des spots à un projet**
1. Ouvrez un projet
2. Cliquez sur "Importer Excel" dans la section spots
3. Utilisez le modèle `exemple-spots-projet-import.csv`
4. Les spots seront ajoutés au projet avec prix et statut

## ⚠️ Points Importants

- **Catalogue** : Pas de colonnes Prix/Statut (ces colonnes sont pour les projets)
- **Projets** : Colonnes Prix/Statut requises pour le suivi budgétaire
- **Validation** : Le système vérifie automatiquement les colonnes requises
- **Doublons** : Le système évite les doublons automatiquement

## 📁 Fichiers Disponibles

- `exemple-catalogue-import.csv` : Modèle pour le catalogue
- `exemple-spots-projet-import.csv` : Modèle pour les spots de projet
- `GUIDE-IMPORT-COMPARISON.md` : Ce guide de comparaison
- `GUIDE-IMPORT-EXCEL-CORRECT.md` : Guide détaillé

## 🔧 Résolution de Problèmes

### **Erreur "Colonnes manquantes"**
- Vérifiez que vous utilisez le bon modèle
- Catalogue : Pas de Prix/Statut
- Projets : Prix/Statut requis

### **Erreur "Aucune donnée valide"**
- Vérifiez que toutes les colonnes requises sont remplies
- Vérifiez le format des données (nombres pour Trust Flow, Trafic, etc.)

### **Sites non importés**
- Vérifiez que les URLs sont valides
- Vérifiez qu'il n'y a pas de doublons dans le catalogue

