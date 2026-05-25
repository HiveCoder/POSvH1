# POSvH1

Detailed local run guide for this repository.

This repo currently contains the full URY project inside the `POSvH1/` folder:

- Frappe app backend: `POSvH1/ury`
- React POS (v2): `POSvH1/pos`
- Kitchen display (Mosaic): `POSvH1/URYMosaic`
- Legacy Vue POS: `POSvH1/urypos`

## 1) Prerequisites

Install these first:

- Git
- Node.js 18.20+ (required by project docs)
- Yarn (classic)
- Python 3.10+ (for Frappe/bench workflows)
- A running Frappe bench (for full ERPNext mode)

Optional but recommended for printing features:

- QZ Tray desktop app

## 2) Clone and install dependencies

From a terminal:

```bash
git clone https://github.com/HiveCoder/POSvH1.git
cd POSvH1/POSvH1
yarn install
```

The root `postinstall` script installs JS dependencies for all frontend apps.

## 3) Run React POS quickly (frontend-only website mode)

Use this when you want to run and test the POS UI without full Frappe login flow.

1. Go to the POS app:

```bash
cd pos
```

2. Create `pos/.env.local` with:

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

3. Start dev server:

```bash
yarn dev
```

4. Open:

- `http://localhost:5173` (or the port shown by Vite)

Notes:

- In website mode, the app uses safe defaults and local behavior for easier local UI testing.
- API/proxy requests still target `VITE_FRAPPE_BASE_URL`.

## 4) Run full stack with Frappe/ERPNext

Use this when you want complete backend-integrated behavior.

1. Set up a Frappe bench and install ERPNext (follow official bench docs).

2. Get apps in bench:

```bash
bench get-app --branch version-15 erpnext https://github.com/frappe/erpnext.git
bench get-app --branch hrms https://github.com/frappe/hrms.git
bench get-app ury https://github.com/ury-erp/ury.git
```

3. Create site and install apps:

```bash
bench new-site your-site.local
bench --site your-site.local install-app erpnext
bench --site your-site.local install-app hrms
bench --site your-site.local install-app ury
bench --site your-site.local migrate
```

4. Start bench:

```bash
bench start
```

5. Build frontends from this repository source (in `POSvH1/POSvH1`):

```bash
yarn build
```

This builds:

- `pos` -> `ury/public/pos`
- `URYMosaic` -> `ury/public/URYMosaic`
- `urypos` -> `ury/public/urypos`

6. In bench, build assets if needed:

```bash
bench build --app ury
```

7. Open the apps:

- POS v2: `/pos`
- KDS Mosaic: `/URYMosaic/<Production Unit Name>`
- Legacy POS: `/urypos`

## 5) Run each frontend app directly (dev)

From `POSvH1/POSvH1`:

React POS (v2):

```bash
cd pos
yarn dev
```

Mosaic (KDS):

```bash
cd URYMosaic
yarn dev
```

Legacy POS:

```bash
cd urypos
yarn dev
```

## 6) Common scripts

From `POSvH1/POSvH1`:

```bash
yarn install
yarn build
```

From `POSvH1/POSvH1/pos`:

```bash
yarn dev
yarn build
yarn preview
```

## 7) Troubleshooting

- Port already in use:
	- Stop the process using that port, or run Vite on another port.
- Frappe API calls failing in website mode:
	- Verify `VITE_FRAPPE_BASE_URL` points to a running Frappe server.
- Login redirect to `/login` when you expected website mode:
	- Ensure `VITE_POS_PLATFORM=website` is set in `pos/.env.local`.
- Build output not reflected in site:
	- Re-run `yarn build` and `bench build --app ury`.

## 8) Detailed setup references

- Full install: `POSvH1/INSTALLATION.md`
- Operational setup (roles, branch, menu, table, POS profile): `POSvH1/SETUP.md`
- Main app overview: `POSvH1/README.md`