# TODO ROUND 3 — zéro fake restant, scroll partout, persistance, QoL (autonome)

## A. Dé-fake (les derniers)
- [x] A1 Camera : tuer « Mode mock activé » → vraies raisons d'erreur (permission/absente/occupée)
- [x] A2 Camera HUD : `f/2.0 · ISO 400` hardcodé → vrais settings du track (résolution réelle)
- [x] A3 Camera : snapshot réel (capture + download PNG) + bouton stop
- [x] A4 Calendar : bug timezone UTC (jour décalé) → parsing local
- [x] A5 Calendar : MONTHS/DAYS anglais hardcodés → Intl locale réelle
- [x] A6 Calendar : `prompt()` natif → saisie inline + 0 seed event
- [x] A7 Kanban : seed cards fake → colonnes vides + état vide avec CTA
- [x] A8 Prompt generate-module : « use mock data » → consigne real-first
- [x] A9 Boot sequence : steps vraiment i18n (FR≠EN) + reflètent le vrai init
- [x] A10 Music : égaliseur décoratif → vrai AnalyserNode WebAudio
- [x] A11 Stock : timestamp render → vrai `fetchedAt` du dernier fetch

## B. Scrollbars & scroll UX
- [x] B1 Dock panel : `h-[420px]` fixe → viewport-aware
- [x] B2 Palette : position + liste viewport-aware (petits écrans)
- [x] B3 Settings : scroll garanti dans les onglets longs
- [x] B4 Weather : `overflow-y-auto` (déborde en petit)
- [x] B5 Clock : scroll + layout petit écran
- [x] B6 Calculator : title sur display (nombre entier) + tabular-nums
- [x] B7 Imagegen : historique capped + scroll
- [x] B8 Topbar : pas de débordement mobile (shrink/hide)
- [x] B9 Audit : `prompt()/alert()/confirm()` natifs interdits (FAIL)

## C. Persistance réelle
- [x] C1 Pomodoro : timestamp-based + persist + durées custom + titre onglet
- [x] C2 Paint : persist dataURL (cap) + support tactile
- [x] C3 Whiteboard : persist strokes (cap) + undo
- [x] C4 Regex/Json/Color/QR/Devtools/Browser : persist des saisies
- [x] C5 Weather : persist ville active
- [x] C6 Calculator : persist display + historique calculs cliquable

## D. QoL+ fonctionnel
- [x] D1 Browser : back/forward/reload + loader + note X-Frame honnête
- [x] D2 Clock : clic copie ISO + label timezone
- [x] D3 Calculator : historique (avec C6)
- [x] D4 Palette : actions système Tiles + Cascade (réorganisation réelle)
- [x] D5 Workspaces : tooltip contenu (liste modules)
- [x] D6 Kanban : édition inline (double-clic)
- [x] D7 Chat : export conversation (.md)
- [x] D8 Music : état d'erreur réel (stream KO)
- [x] D9 Files : filtre/recherche par nom (si absent)
- [x] D10 Weather : bouton « ma position » (géoloc réelle + open-meteo)

## E. Validation
- [x] E1 tsc 0 + eslint 0 + audit green + build 8/8 + test:api 16/16 + commit + push + rapport
