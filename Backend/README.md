# Rano Backend

Express.js API for Google (Firebase) authentication and JWT-protected routes.
Data layer uses **MySQL** with **Prisma ORM**.

## Auth flow

1. Mobile/web signs in with Google via Firebase Auth.
2. Client sends the Firebase ID token to `POST /api/v1/auth/google`.
3. Backend verifies the Firebase token, upserts the user, and returns a JWT (15 min).
4. Client uses the JWT on authenticated APIs (`Authorization: Bearer <token>`).
5. When the JWT expires, the client silently calls `POST /api/v1/auth/refresh` with a fresh Firebase ID token and retries the failed request — no UI interruption.
6. New users complete profile (`name`, `mobile`, `dob`, `gender`) via `POST /api/v1/auth/complete-profile`.

## Setup

```bash
cd Backend
cp .env.example .env
# Set DATABASE_URL to your MySQL instance and create an empty database, e.g. `rano`
# Place Firebase service account JSON at the path in FIREBASE_SERVICE_ACCOUNT_PATH
npm install
npm run prisma:migrate
npm run dev
```

### MySQL + Prisma

1. Create a MySQL database (example: `CREATE DATABASE rano;`).
2. Set `DATABASE_URL` in `.env`, e.g. `mysql://root:password@127.0.0.1:3306/rano`.
3. Run migrations: `npm run prisma:migrate`.
4. Optional GUI: `npm run prisma:studio`.

### Firebase setup

1. Create a Firebase project and enable **Google** sign-in.
2. Project settings → Service accounts → Generate new private key.
3. Save the JSON file (do not commit it) and point `FIREBASE_SERVICE_ACCOUNT_PATH` at it.

## Main endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/google` | Firebase ID token | Login / register |
| POST | `/api/v1/auth/refresh` | Firebase ID token | Silent JWT refresh |
| POST | `/api/v1/auth/complete-profile` | JWT | Save Name, Mobile, DOB, Gender |
| GET | `/api/v1/auth/me` | JWT | Current user |
| POST | `/api/v1/admin/login` | — | Admin sign-in; returns an access JWT |
| GET | `/api/v1/admin/users?page=1&pageSize=10` | Admin JWT | List users with pagination |
| GET | `/api/v1/recharges/wallet` | User JWT | Get available wallet balance |
| GET/POST | `/api/v1/withdrawals/upi` | User JWT | List or save a user's UPI IDs |
| PATCH/DELETE | `/api/v1/withdrawals/upi/:id` | User JWT | Update or delete a saved UPI ID |
| POST | `/api/v1/withdrawals` | User JWT | Submit a withdrawal request |
| GET | `/api/v1/withdrawals` | Admin JWT | List withdrawal requests |
| POST | `/api/v1/withdrawals/:id/accept` | Admin JWT | Accept a withdrawal request |
| POST | `/api/v1/withdrawals/:id/reject` | Admin JWT | Reject and refund a withdrawal request |
| GET | `/api/v1/markets` | — | List markets |
| GET | `/api/v1/markets/orders?page=1&pageSize=20` | User JWT | Paginated user orders |
| GET | `/api/v1/markets/history?from=...&to=...&page=1&pageSize=20` | User JWT | Paginated result history |
| GET | `/api/v1/markets/:id` | — | Get a market |
| GET | `/api/v1/transactions?page=1&pageSize=20` | User JWT | Paginated wallet transaction history |
| POST | `/api/v1/markets` | JWT | Create a market (maximum five) |
| PATCH | `/api/v1/markets/:id` | JWT | Update a market |
| DELETE | `/api/v1/markets/:id` | JWT | Delete a market |
| GET | `/api/v1/health` | — | Health check |

Paginated endpoints return `items` plus `pagination` metadata (`page`,
`pageSize`, and `hasMore`). Page sizes default to 20 and are capped at 100.

Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `Backend/.env` for admin
panel sign-in. Both values must be set. Admin access tokens last seven days by
default; set `ADMIN_JWT_EXPIRES_IN_SECONDS` to change that duration. Mobile
access tokens retain their separate 15-minute lifetime and refresh flow. Use a
strong password and do not commit the `.env` file. Market create, update, and
delete endpoints require an admin JWT issued by `POST /api/v1/admin/login`;
mobile user tokens cannot modify markets. Market times use 24-hour `HH:mm`
values and are interpreted in the mobile device's local time.

Withdrawal amounts are reserved from the user's wallet when a request is
submitted. Rejecting a request returns the reserved amount to the wallet;
accepting it leaves the amount deducted. Saved UPI IDs belong to individual
users, while each withdrawal stores a snapshot of its destination for admin
review. Apply migrations with `npm run prisma:migrate` (or
`npm run prisma:deploy` in production) before using withdrawals.

## Project structure

```
prisma/
  schema.prisma   # MySQL models
src/
  config/         # env, prisma, firebase
  controllers/    # HTTP layer
  services/       # business logic
  middleware/     # auth, errors, validation
  routes/         # route definitions
  validators/     # Zod schemas
  utils/          # helpers
  app.js
  server.js
```
