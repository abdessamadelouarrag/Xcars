# XCars

Plateforme SaaS full-stack de création et de gestion de sites pour agences de
location de voitures.

Le frontend et le backend sont réunis dans une seule application Next.js. Les
données sont stockées dans un serveur MySQL installé localement : Docker n’est
pas nécessaire.

## Stack

- Next.js 16 avec App Router et TypeScript strict
- React 19, Tailwind CSS 4 et composants shadcn/ui
- MySQL 8+ et Prisma ORM
- Auth.js, Zod et React Hook Form
- Cloudinary pour les images
- Resend pour les e-mails
- Vitest et Playwright pour les tests

## Prérequis

- Node.js 20 ou plus récent
- npm
- MySQL Community Server 8 ou plus récent
- MySQL Workbench ou le client en ligne de commande MySQL

## Installation locale sans Docker

### 1. Créer la base MySQL

Dans MySQL Workbench, ouvrez une nouvelle requête et exécutez :

```sql
CREATE DATABASE xcars
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Ou avec le client MySQL :

```powershell
mysql -u root -p
```

Puis :

```sql
CREATE DATABASE xcars CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Configurer l’environnement

```powershell
Copy-Item .env.example .env
```

Modifiez ensuite `.env` :

```dotenv
DATABASE_URL=mysql://root:VOTRE_MOT_DE_PASSE@localhost:3306/xcars
AUTH_SECRET=UNE_LONGUE_VALEUR_ALEATOIRE
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
```

Pour générer un secret :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Si le mot de passe MySQL contient `@`, `:`, `/`, `#` ou `%`, encodez-le pour
une URL avant de le placer dans `DATABASE_URL`.

### 3. Installer et initialiser

```powershell
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
```

### 4. Lancer l’application

```powershell
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Comptes de démonstration

Tous les comptes utilisent le mot de passe `Demo2026!`.

| Rôle | E-mail |
| --- | --- |
| Administrateur | `admin@xcars.ma` |
| Propriétaire Atlas Cars | `owner@atlascars.ma` |
| Propriétaire Noir Automotive | `owner@noircars.ma` |

Sites publics :

- [Atlas Cars](http://localhost:3000/agence/atlas-cars)
- [Noir Automotive](http://localhost:3000/agence/noir-automotive)

## Commandes

```powershell
npm run dev             # serveur de développement
npm run build           # build de production
npm run start           # lancer le build
npm run lint            # ESLint
npm run typecheck       # TypeScript strict
npm run test            # tests Vitest
npm run test:e2e        # tests Playwright
npm run db:generate     # générer le client Prisma
npm run db:migrate      # créer une migration en développement
npm run db:deploy       # appliquer les migrations existantes
npm run db:seed         # données de démonstration
npm run db:studio       # interface Prisma Studio
```

## Services facultatifs

Sans configuration SMTP ou Resend, les e-mails sont simulés dans les logs en
développement. L’inscription et les invitations affichent aussi leur lien local.

Le téléversement d’images nécessite ces variables Cloudinary :

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

Pour utiliser un expéditeur SMTP global pour toutes les agences :

```dotenv
EMAIL_TRANSPORT=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-adresse@gmail.com
SMTP_PASS=votre-mot-de-passe-application
EMAIL_FROM="XCars <votre-adresse@gmail.com>"
```

Avec Gmail, activez la validation en deux étapes et utilisez un mot de passe
d’application. Le mot de passe normal du compte Gmail ne doit pas être utilisé.
Resend reste disponible comme solution de secours via `RESEND_API_KEY`.

## Tests d’intégration MySQL

Créez une base séparée :

```sql
CREATE DATABASE xcars_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Définissez sa connexion avant d’exécuter les tests :

```powershell
$env:TEST_DATABASE_URL="mysql://root:VOTRE_MOT_DE_PASSE@localhost:3306/xcars_test"
npm run test
```

Les tests d’intégration sont ignorés automatiquement lorsque
`TEST_DATABASE_URL` est absent, afin de ne jamais modifier la base de
développement.

## Architecture

- `src/app` : pages, layouts et Route Handlers
- `src/components` : interface réutilisable
- `src/lib/auth` : session, rôles et permissions multi-tenant
- `src/lib/vehicles` : disponibilité et stock
- `src/lib/validation` : schémas Zod
- `prisma/schema.prisma` : modèle MySQL
- `prisma/migrations` : migrations versionnées
- `prisma/seed.ts` : deux tenants de démonstration
- `tests/unit` : logique pure et validation
- `tests/integration` : isolation MySQL et disponibilité
- `tests/e2e` : parcours navigateur

Chaque requête métier est filtrée par `agencyId`. Les contrôles de rôle et de
permission sont exécutés côté serveur. La confirmation d’une réservation
utilise une transaction sérialisable et un verrou MySQL `FOR UPDATE`.

Une description plus détaillée se trouve dans
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Fonctionnalités livrées

- [x] Authentification, vérification d’e-mail et mot de passe oublié
- [x] Rôles propriétaire, staff et administrateur
- [x] Isolation multi-tenant côté serveur
- [x] Onboarding en quatre étapes
- [x] Dashboard avec données et graphiques réels
- [x] Gestion complète de la flotte et des images
- [x] Recherche, filtres, tris et pagination serveur
- [x] Stock, blocages et protection anti-double-réservation
- [x] Réservations, historique, calendrier et export CSV
- [x] Éditeur de thème avec brouillon et publication
- [x] Quatre thèmes et aperçu mobile/tablette/ordinateur
- [x] Site public, catalogue et fiche véhicule
- [x] Français, anglais et arabe RTL
- [x] SEO dynamique, sitemap, robots et JSON-LD
- [x] Invitations staff et permissions
- [x] E-mails compatibles Resend
- [x] Tests Vitest, intégration et Playwright
- [x] Migration et seed MySQL
