# 🥷 Ninja Linking SaaS

## 📋 Description

Outil professionnel de ninja linking et gestion de projets SEO avec base de données Supabase. Permet de :

- 🔍 **Ninja Linking** : Recherche d'opportunités de liens avec footprints personnalisés
- 🔎 **Exploration SERP** : Opérateurs avancés Google/Bing pour l'analyse de la concurrence  
- 📊 **Gestion de Projets** : Suivi complet des projets SEO avec KPIs
- 🗂️ **Catalogue de Sites** : Base de données complète de spots et sites partenaires

## 🚀 Installation & Déploiement

### Développement Local

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

### Production

L'application est prête pour être déployée sur :

#### Netlify (Recommandé)
1. Connectez votre repository GitHub à Netlify
2. Le fichier `netlify.toml` est préconfigué
3. Le déploiement se fera automatiquement

#### Autres Plateformes
- **Vercel** : Deploy automatique depuis GitHub
- **GitHub Pages** : Activez Pages dans les paramètres du repo
- **Firebase Hosting** : `firebase deploy`

Le fichier `index.html` est le point d'entrée principal.

### Configuration Base de Données

L'application utilise **Supabase** comme base de données. Les credentials sont préconfigurés mais peuvent être personnalisés.

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le schéma SQL disponible dans `supabase-schema.sql`
3. Récupérez votre URL et clé API Supabase
4. L'application se configurera automatiquement

## 🗂️ Structure du Projet

```
ninja-linking-saas/
├── index.html                   # Point d'entrée principal
├── ninja-linking-script.js      # Logique JavaScript
├── ninja-linking-styles.css     # Styles CSS
├── supabase-service.js          # Service de base de données
├── supabase-schema.sql          # Schéma de base de données
├── netlify.toml                 # Configuration Netlify
├── package.json                 # Configuration npm
└── README.md                    # Documentation
```

## 🔧 Fonctionnalités

### Ninja Linking
- Footprints prédéfinis par catégorie (E-Réputation, Forums, Commentaires, etc.)
- Génération automatique de recherches Google
- Lancement direct des recherches en nouveaux onglets

### Exploration SERP
- Opérateurs Google/Bing avancés
- Recherche temporelle, par type de contenu, logique
- Exploration thématique et par source

### Gestion de Projets
- Création et suivi de projets SEO
- KPIs : Trafic, Trust Flow, TTF, Domaines référents
- Gestion des mots-clés et spots associés

### Catalogue de Sites
- Import/Export CSV et Excel
- Filtres par type, thématique, URL
- Gestion en masse (sélection, suppression)
- Synchronisation automatique avec Supabase

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Base de données** : Supabase (PostgreSQL)
- **Déploiement** : Compatible toutes plateformes statiques

## 📞 Support

Pour toute question ou support, contactez l'équipe de développement.

---

**Version 1.0.0** - Prêt pour la production 🚀