# 📊 Guide d'Import Excel - Version Corrigée

## 🎯 Types d'Import Disponibles

### **1. 📚 Import du Catalogue (Sites)**
- **Fichier modèle** : `exemple-catalogue-import.csv`
- **Usage** : Ajouter des sites au catalogue général
- **Colonnes requises** : URL, Type, Thématique, Trust Flow, Trafic, TTF, Follow, Notes
- **Colonnes optionnelles** : Notes

### **2. 🎯 Import de Spots dans un Projet**
- **Fichier modèle** : `exemple-spots-projet-import.csv`
- **Usage** : Ajouter des spots à un projet spécifique
- **Colonnes requises** : URL, Type, Thématique, Trust Flow, Trafic, TTF, Prix, Statut
- **Colonnes optionnelles** : Prix (défaut: 0), Statut (défaut: "A publier")

## 📋 Modèles de Fichiers

### **📚 Modèle Catalogue (exemple-catalogue-import.csv)**
```csv
URL,Type,Thématique,Trust Flow,Trafic,TTF,Follow,Notes
https://example-blog.com,Blog,Business & Marketing,45,15000,Business,Oui,Site de qualité
https://example-forum.com,Forum,Technologie & Informatique,30,8000,Computers,Oui,Forum actif
```

**Colonnes :**
- **URL** : L'URL du site (obligatoire)
- **Type** : Forum, Blog, Annuaire, Média, E-commerce, Réseau social, Vitrine
- **Thématique** : Généraliste, Business & Marketing, Technologie & Informatique, etc.
- **Trust Flow** : Score de 0 à 100
- **Trafic** : Nombre de visiteurs
- **TTF** : Topical Trust Flow
- **Follow** : Oui/Non
- **Notes** : Notes optionnelles

### **🎯 Modèle Spots Projet (exemple-spots-projet-import.csv)**
```csv
URL,Type,Thématique,Trust Flow,Trafic,TTF,Prix,Statut
https://example-blog.com,Blog,Business & Marketing,45,15000,Business,75.00,A publier
https://example-forum.com,Forum,Technologie & Informatique,30,8000,Computers,50.00,En attente
```

**Colonnes :**
- **URL** : L'URL du site (obligatoire)
- **Type** : Forum, Blog, Annuaire, Média, E-commerce, Réseau social, Vitrine
- **Thématique** : Généraliste, Business & Marketing, Technologie & Informatique, etc.
- **Trust Flow** : Score de 0 à 100
- **Trafic** : Nombre de visiteurs
- **TTF** : Topical Trust Flow
- **Prix** : Prix en euros (optionnel, défaut: 0)
- **Statut** : A publier, En attente, Publié, Rejeté

## 🚀 Utilisation

### **Import du Catalogue**
1. Utilisez le modèle `exemple-catalogue-import.csv`
2. Remplissez les colonnes requises
3. Utilisez la fonction d'import du catalogue
4. Les sites seront ajoutés au catalogue général

### **Import de Spots dans un Projet**
1. Utilisez le modèle `exemple-spots-projet-import.csv`
2. Remplissez les colonnes requises
3. Utilisez la fonction d'import des spots du projet
4. Les spots seront ajoutés au projet sélectionné

## ⚠️ Points Importants

- **Catalogue** : Pas de colonnes Prix/Statut (ces colonnes sont pour les projets)
- **Projets** : Colonnes Prix/Statut requises pour le suivi budgétaire
- **URL** : Doit être valide et accessible
- **Trust Flow** : Valeur entre 0 et 100
- **Trafic** : Nombre entier positif
- **Statut** : Valeurs autorisées : "A publier", "En attente", "Publié", "Rejeté"

## 🔧 Validation

Le système valide automatiquement :
- Format des URLs
- Valeurs des Trust Flow (0-100)
- Valeurs des Statuts
- Format des prix (nombres décimaux)
- Présence des colonnes obligatoires

## 📁 Fichiers Disponibles

- `exemple-catalogue-import.csv` : Modèle pour le catalogue
- `exemple-spots-projet-import.csv` : Modèle pour les spots de projet
- `GUIDE-IMPORT-EXCEL-CORRECT.md` : Ce guide

