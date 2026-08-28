# Agent d'ingestion local MandatHunt (leboncoin)

Script local (PC bureau) qui parcourt leboncoin en mode humain
(fenêtre visible, délais aléatoires, plafond par run) et écrit
dans Supabase via la clé service_role.

## Installation (une seule fois)

1. Installe **Node.js LTS** : https://nodejs.org (bouton "LTS", suivant/suivant).
2. Sur GitHub : repo `agenceleela/mandathunt` → bouton **Code** → **Download ZIP** → décompresse dans un dossier (ex : `C:\mandathunt`).
3. Ouvre un terminal dans `ingestion` :
   - Windows : dans l'explorateur, va dans le dossier `ingestion`, tape `cmd` dans la barre d'adresse puis Entrée.
4. `npm install`
5. `npx playwright install chromium`
6. Crée le fichier `.env` : copie `.env.example` vers `.env` et colle ta
   `SUPABASE_SERVICE_ROLE_KEY` (Vercel → Environment Variables).
   ⚠️ Le `.env` ne doit JAMAIS être commité (gitignore déjà en place).

## Utilisation

- Test sans écrire en base : `node ingest.mjs --dry-run`
- Run réel : `node ingest.mjs`
- Une agence précise : `node ingest.mjs --agency=Colmar`

Si un CAPTCHA apparaît, résous-le dans la fenêtre du navigateur puis
appuie sur Entrée dans le terminal. Les annonces validées arrivent
dans la colonne « À contacter » de l'agence.

En cas de fiche illisible, une capture est sauvée dans `debug/` :
envoie-la avec le log pour calibrer les sélecteurs.