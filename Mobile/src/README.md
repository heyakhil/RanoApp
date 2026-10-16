# Mobile — ATOM Architecture

This app follows the **Atomic Design** (ATOM) component hierarchy.

## Folder structure

```
src/
├── api/                 # HTTP client & API modules
├── assets/              # images, fonts, icons
├── components/
│   ├── atoms/           # Smallest UI units (Button, Text, Spacer)
│   ├── molecules/       # Atom combinations (FormField)
│   ├── organisms/       # Complex UI sections (Header)
│   └── templates/       # Page layouts (ScreenLayout)
├── config/              # Environment & app config
├── constants/           # App-wide constants & routes
├── hooks/               # Shared React hooks
├── navigation/          # Navigators
├── screens/             # Feature screens (index.tsx + styles.tsx)
├── services/            # Business/domain services
├── store/               # Global state
├── theme/               # colors, spacing, typography
├── types/               # Shared TypeScript types
├── utils/               # Pure helpers
└── App.tsx              # Root app component
```

## Screen convention

Each screen lives in its own folder:

```
screens/HomeScreen/
├── index.tsx    # logic & JSX
└── styles.tsx   # StyleSheet (no inline styles)
```

Same pattern applies to components under `atoms/`, `molecules/`, `organisms/`, and `templates/`.
