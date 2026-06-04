# Run locally (concurrent — no Docker)

## Prerequisites

- Node.js 18+
- PostgreSQL running locally
- Credentials in root `.env` and per-service `.env` files (synced from `.env.example`)

## First-time setup

```bash
npm run install:all
npm run db:create    # creates users_db, equipment_db, inspections_db, reports_db, notifications_db
npm run seed         # demo users + equipment + emails via SMTP
```

## Start everything

```bash
npm run dev
```

`npm run dev` starts **all 7 processes** in one terminal: API gateway, 5 microservices, and the Vite frontend. PostgreSQL must already be running.

If login or reset OTP fails with network/CORS errors, you often have **stale processes** on the same ports:

- Port **3000** — API gateway (frontend talks to this)
- Port **5173** — frontend (Vite may use **5174** if 5173 is busy)

Stop old runs (close the other terminal or kill Node), then run `npm run dev` once. Open the URL Vite prints (usually http://localhost:5173).

In development, login OTP codes also appear in the **browser toast** and **console** when email cannot be sent.

**Password reset flow:** Forgot password → one-time email code → verify code → set new password → login (with a separate login OTP).

| Process | URL |
|---------|-----|
| API Gateway + Swagger | http://localhost:3000/api-docs |
| Frontend | http://localhost:5173 (or next free port) |
| User service | :3001 |
| Equipment | :3002 |
| Inspection | :3003 |
| Report | :3004 |
| Notification | :3005 |

## Test accounts (after seed)

Password: `Test@1234!`

- `benmu91@gmail.com` (admin)
- `cabledie@gmail.com` (inspector)
- `devroom210@gmail.com` (user)

## Tests

```bash
npm test                  # database smoke (no services required)
npm run test:integration  # HTTP tests — run while `npm run dev` is active
```

## Database dumps

SQL backups of all five databases (schema + data):

```bash
npm run db:dump
```

Files are written to [`dumps/`](../dumps/) — see [`dumps/README.md`](../dumps/README.md) for restore instructions.

## Database diagram

Entity-relationship model (DBML) for all Sequelize tables and five PostgreSQL databases:

- See [database-schema.dbml](./database-schema.dbml)
- Paste into [dbdiagram.io](https://dbdiagram.io) or use the VS Code DBML extension

## Inspection workflow (inspector → admin)

1. Facility **user** requests an inspection (`POST /api/inspections`).
2. **Admin** assigns an inspector (`PATCH /api/inspections/:id/assign`) — inspector receives email.
3. **Inspector** opens **Inspections**, uses **View** / **Start**, then **Complete** with result and findings.
4. On completion, every active **admin** in `users_db` plus `ADMIN_SMTP` receive an **inspection_completed** email (requires SMTP in `notification-service`).

Full API contract: [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (see tag **4. Inspections** and **7. Notifications**).

## Notes

- All services share the same `JWT_SECRET` / `JWT_REFRESH_SECRET`.
- Set `ADMIN_SMTP` in `services/inspection-service/.env` for admin notification fallback.
- SMTP is configured in `notification-service` and `user-service` `.env` files.
- `FRONTEND_URL` for emails uses port **5173** (Vite); API gateway stays on **3000**.
