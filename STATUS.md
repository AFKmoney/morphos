# MorphOS — état réel (2026-09-19)

## Ce qui tourne

```bash
git pull
bun install   # ou npm install
bun run dev   # http://localhost:3000
```

- Window manager + 29 modules (28 built-ins + Plugins)
- `/api/interpret` et `/api/interpret-stream` acceptent tous les types built-in (plus de redirect silencieux vers custom)
- Voice = Web Speech API dans le dock
- Dock toujours visible au tactile (`pointer: coarse`)
- Plugin registry Zustand via `getState()` + plugin exemple `@morphos/hello`
- Providers: Z.ai par défaut + xAI/Grok dans Settings

## Slop Mistral

Dossiers vidés (tombstones). Ne pas les importer.
