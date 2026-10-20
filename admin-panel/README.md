# Admin Panel

Lightweight React admin panel built with Vite, Tailwind CSS, Flowbite React, and Lucide icons.

## Features

- Username / password login
- Protected dashboard routes
- Create, edit, and delete up to five API-backed markets, including unique symbols, trading times, participant limits, and entry amounts
- Review and accept or reject user withdrawal requests
- Responsive sidebar layout
- Local session persistence (`localStorage`)

## Getting started

```bash
cd admin-panel
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

In development, the panel connects to port `4000` on the same hostname used to
open the panel. Production builds default to `https://api.ranoapps.com/api/v1`.
Set `VITE_API_BASE_URL` in an `.env` file to override either URL, for example
`VITE_API_BASE_URL=http://192.168.1.20:4000/api/v1`.
When using a custom backend URL, allow the panel's origin in the backend's
`CORS_ORIGINS` setting. Market listing uses the public API; creating,
editing, and deleting markets require an admin Bearer JWT. Configure
`ADMIN_USERNAME` and `ADMIN_PASSWORD` in `Backend/.env` and sign in with those
credentials to receive a token.

## Scripts

- `npm run dev` – start development server
- `npm run build` – production build
- `npm run preview` – preview production build

## Project structure

```text
src/
  context/AuthContext.jsx   # Auth state and login/logout
  layouts/DashboardLayout.jsx
  pages/Login.jsx
  pages/Dashboard.jsx
  routes/ProtectedRoute.jsx
  routes/PublicRoute.jsx
  App.jsx
```

## Notes

The admin login exchanges credentials with the backend. Its access token is
held in local storage and attached to authenticated requests. Admin tokens last
seven days by default; the backend lifetime can be changed with
`ADMIN_JWT_EXPIRES_IN_SECONDS`.

Apply the backend Prisma migrations before using the Withdraw page. A
withdrawal's amount is reserved on submission and automatically refunded to the
user's wallet if rejected.
