# MorphOS — état réel (2026-09-19)

## Ce qui tourne

Next.js + Zustand. Pas de Svelte. Pas de RAG simulé. Pas de MSL.

```bash
git pull
bun install
bun run dev   # http://localhost:3000
```

- Window manager + 28 modules + plugin
- `/api/interpret`, `/api/interpret-stream`, `/api/generate-module`
- Voice = Web Speech API (`src/lib/use-voice-input.ts`) dans le dock
- Provider xAI / Grok dans Settings
- Error boundary par fenêtre

## Slop Mistral — vidé

Dossiers vidés (tombstones 1 ligne, plus de code) :
`analytics`, `collaboration`, `integrations`, `marketplace`, `memory`, `msl`,
`performance`, `security`, `themes` (P3), `users`, `voice` (Svelte),
`workflows`, `__tests__`.

Panneaux unwired supprimés : `marketplace-panel`, `collaboration-panel`.

Garde : `src/lib/plugins` (branché au registry) + modules built-in.
