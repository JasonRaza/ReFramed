# ReFramed

ReFramed est un jeu mobile web compétitif en 1v1. Deux joueurs voient une pose iconique pendant 5 secondes, la pose disparaît, puis chacun a 15 secondes pour la recréer avec la caméra de son téléphone. Claude score les images et annonce un gagnant avec un roast en français.

## Stack

- Next.js 14 avec App Router
- Tailwind CSS
- Supabase pour l'état realtime et le stockage des images
- Claude API `claude-sonnet-4-20250514` pour le scoring vision uniquement
- PWA déployable sur Vercel

## Démarrage

```bash
npm install
npm run dev
```

Copier `.env.example` vers `.env.local`, puis renseigner les clés Supabase et Anthropic.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

## Supabase

Le schéma de base est dans `supabase/schema.sql`. La table principale est `rooms` avec les états:

`LOBBY → PREVIEW → POSE → CAPTURE → SCORING → RESULTS`

## Notes MVP

Le scaffold actuel livre le flux mobile complet, la PWA, la caméra, une bibliothèque de 20 poses et une route de scoring Claude avec fallback local si la clé API n'est pas configurée. La prochaine étape produit consiste à brancher la synchronisation realtime Supabase entre deux téléphones et l'upload des captures dans Supabase Storage.
