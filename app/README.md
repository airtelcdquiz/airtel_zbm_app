This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuration

Toute la configuration passe par des variables d'environnement. Le modèle unique
est `../.env.example`, à la racine du dépôt.

En développement local, le copier en `app/.env` (chargé automatiquement par
Next.js) :

```bash
cp ../.env.example .env
```

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL de base de l'API backend (`airtel_zbm_api`), préfixe `/api` inclus. Inlinée au build. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Base MySQL lue directement par le dashboard (tables `sessions`, `userLogins`). |
| `JWT_SECRET` | Secret de vérification des JWT de session. |
| `REDIS_URL` | Redis des files d'attente SMS (Bull / BullMQ). |
| `SMPP_HOST`, `SMPP_PORT`, `SMPP_SYSTEM_ID`, `SMPP_PASSWORD` | Passerelle SMPP Airtel. |

`NEXT_PUBLIC_API_BASE_URL` est remplacée dans le bundle client au moment du
`yarn build` : elle doit être présente **au build**, pas seulement au démarrage.
Les autres variables sont lues côté serveur à l'exécution, et une variable
requise manquante lève une erreur explicite (`src/lib/env.ts`).

En déploiement, `docker-compose.yml` transmet ces variables au conteneur via son
bloc `environment:`, en les lisant dans l'environnement de Compose : elles sont
donc à renseigner dans l'interface Dokploy (ou dans un `.env` placé à côté du
`docker-compose.yml`). Elles doivent être présentes **avant** le `yarn build`
lancé par le conteneur, sinon `NEXT_PUBLIC_API_BASE_URL` sera inlinée vide.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
