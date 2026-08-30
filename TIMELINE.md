# TIMELINE - MorphOS Audit & Fixes

## Iteration 1 - [2025-08-30] - Début de l'audit

### ✅ Choses faites

- **[07:34 UTC]** - Initialisation du fichier TIMELINE.md
- **[07:34 UTC]** - Analyse initiale de la structure du projet
  - 101 fichiers source (TS/TSX/JS)
  - Architecture modulaire avec 28 modules intégrés
  - Next.js 16 + TypeScript 5 + Tailwind CSS 4
  - Zustand pour la gestion d'état
  - API routes pour l'IA (13 providers supportés)
- **[07:35 UTC]** - Installation des dépendances npm
  - 839 packages installés
  - 9 vulnérabilités identifiées (4 moderate, 5 high)
- **[07:36 UTC]** - Exécution de lint
  - 6 warnings de type "setState in useEffect" identifiés
  - Fichiers concernés: chat-module.tsx, music-module.tsx, weather-module.tsx, spawn-overlay.tsx, carousel.tsx, use-mobile.ts
- **[07:37-07:40 UTC]** - Correction des warnings de lint
  - Utilisation de `queueMicrotask()` pour différer les setState dans useEffect
  - Tous les warnings résolus
- **[07:41 UTC]** - Correction du script de build
  - Suppression de la partie `cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` qui causait une erreur
  - Le script `build` utilise maintenant uniquement `next build`
- **[07:42 UTC]** - Correction du script de start
  - Remplacement de `bun` par `node` pour la compatibilité
  - Correction du chemin du serveur (`.next/server.js` au lieu de `.next/standalone/server.js`)
- **[07:45 UTC]** - Changement du port par défaut
  - Passage de 3000 à 5000 pour éviter les conflits
- **[07:50 UTC]** - Test réussi du démarrage du serveur
  - Build fonctionnel
  - Serveur démarré avec succès sur le port 5000

### 📊 Structure identifiée
- `src/app/` - Points d'entrée Next.js (page.tsx, layout.tsx, api routes)
- `src/lib/` - Stores (zustand), hooks, utilitaires, configuration des providers
- `src/components/morph/` - Composants principaux (window manager, modules, UI)
- `src/components/ui/` - Composants UI (shadcn/ui)
- 28 modules dans `src/components/morph/modules/`

### 🔍 Analyse des dépendances
- **z-ai-web-dev-sdk@0.0.18** - SDK pour l'IA Z.ai (utilisé dans 5 API routes)
- **next@16.3.3** - Framework principal
- **react@19.0.0** - Bibliothèque React
- **zustand@5.0.6** - State management
- **framer-motion@12.23.2** - Animations
- **recharts@2.15.4** - Graphiques (DEPRECATED - migration vers v3 recommandée)
- **prisma@6.11.1** - ORM (avec vulnérabilités via js-yaml)
- **sharp@0.34.3** - Traitement d'images (vulnérabilités dans libvips)

### 🐛 Bugs identifiés et corrigés

1. **Warnings ESLint (setState in useEffect)**
   - Problème: Appels synchrones à setState dans useEffect causant des rendus en cascade
   - Solution: Utilisation de `queueMicrotask()` pour différer les mises à jour d'état
   - Fichiers corrigés:
     - `src/components/morph/modules/chat-module.tsx` (ligne 74)
     - `src/components/morph/modules/music-module.tsx` (ligne 62)
     - `src/components/morph/modules/weather-module.tsx` (ligne 73)
     - `src/components/morph/spawn-overlay.tsx` (lignes 17, 21)
     - `src/components/ui/carousel.tsx` (ligne 98)
     - `src/hooks/use-mobile.ts` (ligne 14)

2. **Script de build invalide**
   - Problème: `cp -r .next/static .next/standalone/.next/` échouait car le répertoire standalone n'existe pas
   - Solution: Simplification du script à `next build` uniquement

3. **Script de start incompatible**
   - Problème: Utilisation de `bun` qui n'est pas disponible dans l'environnement
   - Solution: Remplacement par `node` et correction du chemin

### ⚠️ Vulnérabilités identifiées (npm audit)

1. **deepmerge-ts <8.0.0** (High)
   - Problème: Stack exhaustion lors du merge d'objets récursifs
   - Source: @prisma/config -> prisma
   - Solution: `npm audit fix --force` (mais peut casser la compatibilité)

2. **js-yaml** (High - 4 advisories)
   - Problèmes: DoS quadratique, consommation CPU excessive
   - Source: @mdxeditor/editor, prisma
   - Solution: Mise à jour vers js-yaml >=4.3.0

3. **prismjs <1.30.0** (Moderate)
   - Problème: DOM Clobbering vulnerability
   - Source: react-syntax-highlighter -> refractor -> prismjs
   - Solution: Mise à jour vers prismjs >=1.30.0

4. **sharp <0.35.0** (High)
   - Problème: Vulnérabilités héritées de libvips (CVE-2026-33327, etc.)
   - Solution: Mise à jour vers sharp >=0.35.4

5. **recharts@2.15.4** (Deprecated)
   - Problème: Branches 1.x et 2.x plus maintenues
   - Solution: Migration vers recharts v3

### 📝 Décisions architecturales

#### Choix de runtime
- Le projet était configuré pour utiliser Bun (bun.lock présent)
- Environnement actuel utilise Node.js v22.23.2
- Décision: Maintenir la compatibilité Node.js tout en gardant bun.lock pour les utilisateurs de Bun

#### Gestion des API keys
- Les clés API sont stockées dans localStorage (côté client)
- Les routes /api/* agissent comme proxies vers les providers
- Pas de télémétrie, pas de tracking
- Sécurité: OK pour un projet open-source

#### Génération de code dynamique
- Utilisation de @babel/standalone via CDN pour la compilation runtime
- Les modules générés sont exécutés dans un sandbox
- Risque: Exécution de code arbitraire depuis l'IA
- Recommandation: Ajouter une validation/limitation du code généré

#### Persistance
- localStorage pour les states simples (windows, settings)
- IndexedDB via VFS pour les fichiers
- Zustand avec persist pour la gestion d'état
- Architecture solide et bien conçue

### 🔧 Prochaines étapes
- [ ] Corriger les vulnérabilités npm audit (si possible sans breaking changes)
- [ ] Vérifier la compatibilité avec Next.js 16.3.3
- [ ] Tester toutes les API routes (interpret, interpret-stream, generate-module, generate-image, test-provider)
- [ ] Vérifier le fonctionnement des 28 modules
- [ ] Tester la génération de modules personnalisés
- [ ] Vérifier la persistance des données
- [ ] Tester les workspaces (save/load)

---

## Décisions architecturales

### Notes initiales
- Le projet utilise Bun comme runtime (bun.lock présent)
- Architecture modulaire avec lazy-loading des modules
- Persistance via localStorage et IndexedDB
- Génération de code dynamique via Babel standalone (CDN)
- Streaming SSE pour les réponses IA

### Points d'attention
- Dépendance à des CDN externes (@babel/standalone)
- Gestion des API keys côté client (localStorage)
- Sécurité des modules générés dynamiquement
- Performance avec 28 modules chargés

---

## Bugs identifiés

*(À remplir lors de l'audit)*

---

## Corrections apportées

*(À remplir lors des fixes)*
