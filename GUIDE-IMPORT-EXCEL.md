# 📊 Guide d'Import Excel pour les Spots

## Vue d'ensemble

Cette fonctionnalité permet d'importer en masse des spots dans vos projets depuis un fichier Excel (.xlsx ou .xls).

## 🚀 Comment utiliser l'import Excel

### 1. Accéder à la fonctionnalité
- Ouvrez un projet
- Cliquez sur le bouton **"Importer Excel"** dans la section des spots
- Le modal d'import s'ouvre

### 2. Télécharger le fichier d'exemple
- Cliquez sur **"Télécharger l'exemple"** pour obtenir le modèle Excel
- Utilisez ce fichier comme base pour vos données

### 3. Préparer votre fichier Excel
Votre fichier Excel doit contenir les colonnes suivantes (dans l'ordre) :

| Colonne | Description | Obligatoire | Exemple |
|---------|-------------|-------------|---------|
| **URL** | L'URL du site | ✅ Oui | https://example.com |
| **Type** | Type de site | ❌ Non | Blog, Forum, Média, etc. |
| **Thématique** | Thématique du site | ❌ Non | Business & Marketing |
| **Trust Flow** | Score TF (0-100) | ❌ Non | 45 |
| **Trafic** | Nombre de visiteurs | ❌ Non | 15000 |
| **TTF** | Topical Trust Flow | ❌ Non | Business |
| **Prix** | Prix en euros | ❌ Non | 75.00 |
| **Statut** | Statut du spot | ❌ Non | A publier |

### 4. Importer le fichier
- Sélectionnez votre fichier Excel
- Vérifiez l'aperçu des données
- Cliquez sur **"Importer les spots"**

## 📋 Format des données

### Types de sites acceptés
- Forum
- Blog
- Annuaire
- Média
- E-commerce
- Réseau social
- Vitrine

### Thématiques acceptées
- Généraliste
- Actualités & Médias
- Business & Marketing
- E-commerce & Affiliation
- Éducation & Formation
- Santé & Bien-être
- Technologie & Informatique
- Lifestyle & Loisirs
- Finance & Crypto
- Immobilier
- Automobile
- Cuisine & Alimentation
- Animaux
- Développement personnel

### Statuts acceptés
- A publier
- En attente
- Publié
- Rejeté

### TTF (Topical Trust Flow) acceptés
- Arts
- Adult
- Business
- Computers
- Games
- Health
- Home
- News
- Recreation
- Reference
- Science
- Shopping
- Society
- Sports

## ✅ Validation des données

Le système valide automatiquement :
- **URL** : Doit être une URL valide
- **Trust Flow** : Entre 0 et 100
- **Trafic** : Nombre positif
- **Prix** : Nombre positif
- **Colonnes** : Présence des en-têtes requis

## 🔄 Gestion des doublons

- Les spots avec la même URL sont automatiquement ignorés
- Un message indique le nombre de spots ajoutés et ignorés

## 📊 Aperçu avant import

Avant l'import, vous pouvez :
- Voir un aperçu des 10 premiers spots
- Consulter les statistiques (nombre de spots, prix total)
- Vérifier les erreurs éventuelles

## 💡 Conseils d'utilisation

1. **Utilisez le fichier d'exemple** comme modèle
2. **Vérifiez les données** avant l'import
3. **Sauvegardez régulièrement** vos projets
4. **Testez avec quelques spots** avant un import massif

## 🚨 Résolution de problèmes

### Erreur "Colonnes manquantes"
- Vérifiez que votre fichier contient tous les en-têtes requis
- Utilisez le fichier d'exemple comme référence

### Erreur "URL invalide"
- Vérifiez que les URLs commencent par http:// ou https://
- Assurez-vous qu'il n'y a pas d'espaces en début/fin

### Erreur "Trust Flow invalide"
- Le Trust Flow doit être entre 0 et 100
- Utilisez des nombres entiers

### Fichier non reconnu
- Vérifiez que le fichier est bien au format .xlsx ou .xls
- Essayez de sauvegarder votre fichier Excel au format .xlsx

## 📈 Avantages de l'import Excel

- **Gain de temps** : Import de centaines de spots en quelques clics
- **Précision** : Moins d'erreurs de saisie manuelle
- **Flexibilité** : Utilisation d'Excel pour la préparation des données
- **Traçabilité** : Aperçu avant import et statistiques détaillées

## 🔧 Support technique

En cas de problème :
1. Vérifiez le format de votre fichier Excel
2. Utilisez le fichier d'exemple fourni
3. Consultez les messages d'erreur détaillés
4. Contactez le support si nécessaire
