# MorphOS Desktop App (Tauri)

MorphOS Desktop est une application native construite avec Tauri 2.0 qui permet d'exécuter MorphOS en tant qu'application de bureau.

## 🚀 Fonctionnalités

- **Application native**: Intégration complète avec le système d'exploitation
- **Hors navigateur**: Pas besoin d'un navigateur pour exécuter MorphOS
- **Accès au filesystem**: Accès sécurisé aux fichiers locaux
- **Notifications système**: Notifications natives du système
- **Gestion des fenêtres**: Contrôle avancé des fenêtres
- **Raccourcis clavier globaux**: Raccourcis clavier au niveau du système
- **Mises à jour automatiques**: Système de mise à jour intégré

## 📦 Prérequis

- [Rust](https://www.rust-lang.org/) 1.70 ou supérieur
- [Node.js](https://nodejs.org/) 18 ou supérieur
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites): `npm install -g @tauri-apps/cli`

## 🛠 Installation

```bash
# Se placer dans le dossier src-tauri
cd src-tauri

# Installer les dépendances Rust (via cargo)
cargo check

# Retour à la racine et installer les dépendances npm
cd ..
npm install
```

## 🏃‍♂️ Exécution

### Mode développement

```bash
# Démarrer l'application en mode dev
npm run tauri:dev
```

### Mode production

```bash
# Builder l'application
npm run tauri:build

# Démarrer l'application
npm run tauri:start
```

## 📁 Structure du projet

```
src-tauri/
├── Cargo.toml              # Configuration Rust
├── tauri.conf.json         # Configuration Tauri
├── capabilities/
│   └── default.json        # Définition des permissions
├── icons/                  # Icônes de l'application
└── src/
    └── main.rs             # Point d'entrée Rust
```

## 🔌 Plugins Tauri

MorphOS Desktop utilise les plugins Tauri suivants:

- **tauri-plugin-clipboard-manager**: Gestion du presse-papiers
- **tauri-plugin-store**: Stockage des préférences
- **tauri-plugin-shell**: Exécution de commandes shell
- **tauri-plugin-updater**: Mises à jour automatiques
- **tauri-plugin-websocket**: Support WebSocket
- **tauri-plugin-positioner**: Positionnement des fenêtres

## 🎨 Personnalisation

### Configuration de l'application

Éditer `tauri.conf.json` pour:
- Changer le nom et la version de l'application
- Configurer les permissions
- Définir les icônes
- Configurer les fenêtres

### Ajouter des permissions

Éditer `capabilities/default.json` pour:
- Ajouter ou supprimer des permissions
- Configurer les chemins d'accès
- Définir les restrictions

## 📦 Build

### Windows

```bash
npm run tauri:build -- --target x86_64-pc-windows-msvc
```

### macOS

```bash
npm run tauri:build -- --target universal-apple-darwin
```

### Linux

```bash
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

## 🔄 Intégration avec MorphOS

Pour utiliser l'application desktop avec MorphOS:

1. Assurez-vous que tous les fichiers de MorphOS sont dans `src/`
2. L'application desktop chargera automatiquement l'interface web depuis `src/`
3. Les fonctionnalités Tauri seront disponibles via l'API JavaScript

### Utilisation de l'API Tauri dans MorphOS

```typescript
// Exemple: Accéder au filesystem
import { invoke } from '@tauri-apps/api/tauri';

async function readFile(path: string): Promise<string> {
  return await invoke('read_text_file', { path });
}

// Exemple: Afficher une notification
import { notification } from '@tauri-apps/plugin-notification';

await notification.show({
  title: 'MorphOS',
  body: 'Application ready!',
});
```

## 📝 Commandes npm

| Commande | Description |
|----------|-------------|
| `npm run tauri:dev` | Démarrer en mode développement |
| `npm run tauri:build` | Builder l'application |
| `npm run tauri:start` | Démarrer l'application built |
| `npm run tauri:info` | Afficher les informations système |
| `npm run tauri:init` | Initialiser un nouveau projet Tauri |

## 🔒 Sécurité

- Toutes les permissions sont définies explicitement
- Les accès au filesystem sont restreints aux dossiers autorisés
- Les connexions réseau sont limitées aux URLs autorisées
- Les commandes shell sont validées avant exécution

## 📄 Licence

MorphOS Desktop est sous licence MIT, comme le reste du projet MorphOS.
