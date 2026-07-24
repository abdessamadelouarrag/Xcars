# Architecture XCars

## Application

XCars utilise Next.js App Router comme frontend et backend. Les composants
serveur lisent directement MySQL via Prisma. Les mutations publiques et privées
passent par des Route Handlers validés avec Zod.

```text
Navigateur
   |
   +-- Pages publiques / dashboard
   |
   +-- Route Handlers validés
          |
          +-- Auth.js et autorisations tenant
          |
          +-- Services métier
          |
          +-- Prisma ORM
                 |
                 +-- MySQL local
```

## Multi-tenant

Les entités métier possèdent un `agencyId`. Le tenant est résolu depuis la
session Auth.js et la table `AgencyMember`; il n’est jamais accepté depuis le
corps d’une requête privée.

Un administrateur de plateforme doit fournir explicitement l’agence ciblée. Un
staff ne peut agir que si sa permission JSON correspond à l’opération. Les
propriétaires disposent de toutes les permissions de leur agence.

## Domaines

- `auth` : inscription, connexion, sessions et jetons
- `agency` : informations et paramètres
- `vehicles` : flotte, images, équipements, statuts et blocages
- `reservations` : clients, demandes et historique
- `theme` : versions brouillon, publiées et archivées
- `public agency` : site rendu depuis la version publiée
- `audit` : traçabilité des opérations sensibles

## Disponibilité

Les périodes utilisent des intervalles semi-ouverts `[début, fin)`, ce qui
autorise une restitution et un nouveau départ au même instant.

Le serveur combine les réservations confirmées et les blocages de maintenance,
puis calcule le maximum de quantité indisponible simultanément. Une
confirmation est exécutée avec :

1. une transaction MySQL au niveau `SERIALIZABLE` ;
2. un verrou de ligne `SELECT ... FOR UPDATE` sur le véhicule ;
3. un nouveau calcul de disponibilité ;
4. l’écriture du statut et de son historique.

## Thèmes

L’éditeur modifie une version `DRAFT`. Le site public lit uniquement une
version `PUBLISHED`. Lors d’une publication, l’ancienne version publiée est
archivée et un nouveau brouillon est créé.

## Sécurité

- validation Zod de toutes les entrées ;
- hachage bcrypt des mots de passe ;
- jetons aléatoires stockés sous forme de condensat SHA-256 ;
- limitation de débit sur l’authentification et les formulaires publics ;
- contrôle d’origine sur les mutations ;
- validation du type et de la taille des images ;
- journal d’audit ;
- en-têtes de sécurité dans `src/proxy.ts`.

## Domaines personnalisés

`src/lib/tenancy/domain.ts` distingue déjà une URL plateforme d’un domaine
personnalisé. En production, la résolution `hostname -> agencyId` peut être
placée dans un cache Edge ou un proxy amont avant la réécriture vers
`/agence/[slug]`.
