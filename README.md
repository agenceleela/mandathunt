# MandatHunt

CRM interne de téléprospection pour mandataires automobiles.

## Stack technique

- **Frontend** : Next.js (App Router) + TypeScript strict + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Déploiement** : Vercel

## Procédure d'installation

### 1. Créer le projet Supabase

1. Rendez-vous sur https://supabase.com
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anon (API keys)

### 2. Exécuter la migration SQL

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez-collez le contenu de `supabase/migrations/0001_init.sql`
3. Exécutez le script

### 3. Créer le premier utilisateur superadmin

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Entrez un email et un mot de passe
4. Notez l'UUID de l'utilisateur créé

### 4. Configurer l'agence de test et le superadmin

Dans le **SQL Editor**, exécutez ce snippet en remplaçant `VOTRE_USER_UUID` par l'UUID obtenu :

```sql
-- Créer une agence de test
insert into agencies (id, name, city, postal_code, radius_km)
values (gen_random_uuid(), 'Agence Test', 'Paris', '75001', 20);

-- Récupérer l'ID de l'agence créée
-- (ou utilisez directement l'ID si vous l'avez spécifié ci-dessus)

-- Définir l'utilisateur comme superadmin et le rattacher à l'agence
update profiles
set role = 'superadmin',
    agency_id = (select id from agencies where name = 'Agence Test' limit 1)
where id = 'VOTRE_USER_UUID';

-- Appeler seed_columns pour créer les colonnes par défaut
select seed_columns((select id from agencies where name = 'Agence Test' limit 1));
```

### 5. Configurer les variables d'environnement

1. Copiez `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```

2. Remplissez avec vos valeurs Supabase :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 6. Lancer le développement

```bash
npm install
npm run dev
```

L'application est accessible sur http://localhost:3000

## Déploiement Vercel

1. Poussez le code sur GitHub : `agenceleela/mandathunt`
2. Importez le repo sur Vercel
3. Ajoutez les variables d'environnement dans Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployez

## Structure de la base de données

### Tables principales

- **agencies** : Les agences mandataires (zone, critères, rayon)
- **profiles** : Utilisateurs avec rôle (superadmin, admin, agent)
- **columns** : Colonnes du kanban (personnalisables par agence)
- **listings** : Annonces de voitures agrégées
- **price_history** : Historique des prix
- **status_history** : Historique des déplacements entre colonnes
- **notes** : Notes sur les annonces
- **reminders** : Rappels

### Sécurité (RLS)

- **superadmin** : accès complet à toutes les tables
- **admin** : gestion de son agence (colonnes, settings) + lecture complète
- **agent** : board uniquement (déplacer cartes, notes, copier téléphone)

## Roadmap

- **V1 (MVP)** : Board kanban, multi-agences, ingestion manuelle
- **V2** : Ingestion automatique (leboncoin, La Centrale)
- **V3** : Stats, exports, intégration CRM externe
