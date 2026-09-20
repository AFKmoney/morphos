# TODO ROUND 2 — scrollbars garanties, 100% réel, QoL (mode autonome)

## A. Scrollbars garanties
- [x] A1 Filet global : scrollbars glass par défaut sur `*` (webkit + firefox)
- [x] A2 Viewport Radix : masquer la native (plus de double scrollbar dans le chat)
- [x] A3 Vérifier : aucune zone scrollable sans style (audit)
- [x] A4 Context-menu : `max-h` + scroll (ne dépasse plus jamais)
- [x] A5 Dock : bouton « ↓ derniers messages » comme le chat
- [x] A6 Terminal : smart autoscroll (seulement si déjà en bas)
- [x] A7 Fenêtres : `MIN_W`/`MIN_H` sains (contenu jamais écrasé)
- [x] A8 Audit : garde-fous anti-fake (`Math.random`, `FAKE`, `TODO mock`)

## B. 100% réel (zéro simulé)
- [x] B1 Dashboard → vraies analytics MorphOS (fenêtres, messages, stockage, activité réelle)
- [x] B2 Monitor : remplacer les 2 fallbacks `Math.random` par du réel
- [x] B3 Terminal `ps` → vraie liste des fenêtres
- [x] B4 Terminal `ls` → vrais modules du registre
- [x] B5 Terminal `morph --status` → vrais chiffres
- [x] B6 Terminal `spawn <module>` → spawn RÉELLEMENT
- [x] B7 Code : statut compil RÉEL (vrai pipeline de transform)
- [x] B8 Code : bouton Run → prévisualisation live RÉELLE du code
- [x] B9 Music : URL custom persistée (jouer n'importe quel MP3)
- [x] B10 Calendar : locale depuis settings (plus de `en` hardcodé)
- [x] B11 Stock/weather horodatages : locale depuis settings
- [x] B12 Metrics : alerte heap sur front montant uniquement (plus de spam)

## C. QoL+
- [x] C1 Dock : bouton jump-to-latest
- [x] C2 Dock : bouton Stop (abort)
- [x] C3 Terminal : complétion Tab (commandes + modules)
- [x] C4 Raccourci global Ctrl/⌘+K → palette
- [x] C5 Fenêtres : géométries persistées (vérifier)
- [x] C6 Chat : heure des messages au survol
- [x] C7 About : vraie version depuis `package.json`
- [x] C8 Top-bar : horloge temps réel
- [x] C9 Files : taille + lignes dans le header de prévisualisation
- [x] C10 Notes : compteur de mots
- [x] C11 Imagegen : cliquer l'historique restaure aussi le prompt
- [x] C12 Palette : section « récents » depuis l'usage réel

## D. Robustesse + validation
- [x] D1 Crash fenêtre : bouton fermer (si trivial) sinon vérifié
- [x] D2 Interpret : cap historique 20 messages
- [x] D3 Generate-module : cap prompt 2000 chars
- [x] D4 VFS : garde-fou quota localStorage
- [x] D5 Module-states : garde-fou quota localStorage
- [x] D6 Validation complète + commit + push + rapport
