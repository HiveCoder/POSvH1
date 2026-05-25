# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## POS Runtime Modes

The app supports two runtime modes:

- `frappe` (default): existing URY/Frappe behavior with session auth and `/pos` routing.
- `website`: website-friendly behavior without forced Frappe login redirects.

### Website mode env example

Create `.env.local` in `pos/`:

```env
VITE_POS_PLATFORM=website
VITE_POS_ROUTER_BASENAME=/
VITE_FRAPPE_BASE_URL=http://localhost:8000
VITE_POS_WEBSITE_USER=cashier@example.com
VITE_POS_WEBSITE_FULL_NAME=Website Cashier
VITE_POS_WEBSITE_ROLES=Cashier,URY Cashier
VITE_POS_WEBSITE_PROFILE_NAME=WEB-POS
VITE_POS_WEBSITE_COMPANY=Demo Company
VITE_POS_WEBSITE_BRANCH=Main Branch
VITE_POS_WEBSITE_RESTAURANT=Web Restaurant
VITE_POS_WEBSITE_CURRENCY=INR
```

In website mode, auth/profile/opening checks use safe fallbacks so the UI can run on normal websites, while API calls still target `VITE_FRAPPE_BASE_URL`.
