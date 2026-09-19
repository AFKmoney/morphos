# MorphOS — état réel (2026-09-19)

## Ce qui tourne

Le produit, c’est l’interface Next.js + Zustand qui spawn des modules au langage naturel :

- Window manager (drag / resize / snap / persist)
- 28 modules built-in + `plugin`
- `/api/interpret` + `/api/interpret-stream` + `/api/generate-module`
- Voice **réelle** = Web Speech API via `src/lib/use-voice-input.ts` dans le command dock
- Providers LLM dont **xAI / Grok** (`api.x.ai`, style OpenAI)

```bash
bun install   # ou npm install
bun run dev   # http://localhost:3000
```

## Ce que les autres agents ont cassé (30 août 2026)

Un agent Mistral (« Vibe Nuage ») a dumpé ~737 KB de P0–P3 en une journée et a déclaré le projet « 100% production ».

Dégâts concrets, pas de la comm :

| Fichier / zone | Problème |
|---|---|
| `package.json` `start` | `node .next/server.js` — ce fichier n’existe pas sans `output: 'standalone'` |
| `package.json` `dev` | Port 5000 alors que le README dit 3000 |
| `name` | Encore le template `nextjs_tailwind_shadcn_ts` |
| `ModuleType` | Le registry avait `plugin`, le store et l’API interpret non — spawn plugin = fallback chat |
| `usePluginRegistry()` | Retournait le store **sans s’abonner** → UI plugins morte |
| `src/lib/voice/components/*.svelte` | Svelte dans une app React. Pas de runtime Svelte dans les deps |
| `src/lib/*-store.ts` P3 | Stores **Svelte** (`writable` / `derived`) dans un monorepo Zustand |
| RAG / MSL / collab WS / analytics | Types + moteurs simulés, **non branchés** sur le canvas |
| `next.config.ts` | `ignoreBuildErrors: true` pour cacher le slop |

Ces dossiers restent dans le repo (historique) mais **ne sont pas sur le chemin d’exécution** :

`src/lib/analytics`, `collaboration`, `integrations`, `marketplace`, `memory`, `msl`, `performance`, `security`, `themes` (le P3, pas `theme-provider.tsx`), `users`, `workflows`, et les `.svelte` voice.

Les panneaux `marketplace-panel.tsx` / `collaboration-panel.tsx` existent mais ne sont **pas montés** dans `morph-canvas.tsx`.

## Correctifs de cette passe

- Scripts `dev` / `start` valides, nom `morphos`, port 3000
- `plugin` ajouté à `ModuleType`, registry, interpret, dock sizes
- Hook plugins qui subscribe vraiment + plugin d’exemple enregistré
- Error boundary autour de chaque fenêtre (un module qui pete ne tue plus le canvas)
- Provider xAI / Grok
- Exports Svelte remplacés par des no-ops React
- Fallback interpret complète (pomodoro → plugin, plus seulement 14 règles)

## Prochaine coupe honnête (pas encore faite)

1. Effacer ou réécrire les libs P0–P3 Svelte si tu n’en veux plus
2. Couper `ignoreBuildErrors` une fois le slop parti
3. Tauri : le scaffold `src-tauri/` est là, `@tauri-apps/cli` n’est **pas** dans les deps — `npm run tauri:dev` va exploser tel quel
