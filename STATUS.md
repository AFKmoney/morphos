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

## Audit 2026-09-19 (P1)

- `tsc --noEmit`: 0 erreur (était 49, masquées par `ignoreBuildErrors`, supprimé)
- `plugin-initializer.ts` → `.tsx` (contenait du JSX)
- `interpret-stream` réécrit: fallback keyword hors-ligne partagé (`src/lib/fallback-interpret.ts`), `codePreview` toujours présent, `type: error` réservé aux erreurs de config
- `interpret`: redirect silencieux vers `custom` supprimé (les 26 built-ins + custom + imagegen acceptés)
- Plugin registry: typage Zustand corrigé (`getPluginRegistry()` retourne le store), `registerPlugin`/`unregisterPlugin` passent par `getState()`
- `useModulePersist`: setter accepte les updaters `(prev) => next` (kanban/terminal/music)
- `weather`: `active` → `activeIdx` (ReferenceError au runtime)
- `files`: création dans le dossier cliqué (était `currentPath`), doublon `FilesModule` mock supprimé de `extra-modules`
- `qr`: vrais QR codes scannables (lib `qrcode`), plus de pattern décoratif
- `MODULE_SIZES` centralisé dans `module-registry` (`getDefaultModuleSize`)
- Build prod OK (`tsc` + `eslint` + `next build`), toutes les routes API testées en live
- Note sandbox: `next/font/google` exige l'accès à fonts.googleapis.com (bloqué ici) — build vérifié avec stub temporaire, `layout.tsx` original restauré
