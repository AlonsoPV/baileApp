# BaileApp Monorepo 💃

Monorepo para BaileApp con workspace para web y componentes compartidos.

## 📁 Estructura

```
baileapp/
├── apps/
│   └── web/          # App web (Vite + React TS)
├── packages/
│   └── ui/           # Componentes compartidos
└── package.json      # Workspaces config
```

## 🚀 Instalación

```powershell
# Instalar pnpm globalmente (si no lo tienes)
npm install -g pnpm

# Instalar dependencias
pnpm install
```

## 🎯 Comandos

### Web App

```powershell
# Desarrollo (http://localhost:3000)
pnpm dev:web

# Build para producción
pnpm build:web

# Preview del build
pnpm preview:web
```

## 🎨 Componentes UI

### Button
```tsx
import { Button } from "@ui/index";

<Button onClick={() => alert("Hi!")}>Click me</Button>
```

### Chip
```tsx
import { Chip } from "@ui/index";

<Chip label="Salsa" active />
<Chip label="Bachata" onClick={() => {}} />
```

## 🎨 Theme

```tsx
import { theme } from "@theme/colors";

// Colores
theme.palette.red
theme.palette.orange
theme.palette.blue

// Backgrounds
theme.bg.app      // #111318
theme.bg.card     // #1C1F26

// Spacing
theme.spacing(2)  // 16px
theme.spacing(4)  // 32px
```

## 📦 Packages

- `@baileapp/web` - Aplicación web
- `@baileapp/ui` - Componentes compartidos

## 📱 How to build a Play-uploadable AAB (Android)

Release AABs must be signed with the upload key expected by Google Play. See **[docs/ANDROID_PLAY_AAB_BUILD.md](docs/ANDROID_PLAY_AAB_BUILD.md)** for:

- EAS build with the correct credentials
- Local Gradle build after `expo prebuild` (signing via `UPLOAD_*` in `gradle.properties` or env)
- Verifying keystore SHA-1: `./scripts/verify-upload-key.sh <keystore> <alias>`
- Reset upload key in Play Console if the correct keystore is missing

Do not commit keystores or real passwords; use EAS or local env only.

## 🛠️ Tech Stack

- **Vite** - Build tool
- **React 18** + TypeScript
- **pnpm** - Package manager (workspaces)
- **Custom theme** - Paleta moderna (red, orange, blue, yellow)

