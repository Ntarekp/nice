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

| Process | URL |
|---------|-----|
| API Gateway + Swagger | http://localhost:3000/api-docs |
| Frontend | http://localhost:5173 |
| User service | :3001 |
| Equipment | :3002 |
| Inspection | :3003 |
| Report | :3004 |
| Notification | :3005 |

## Test accounts (after seed)

Password: `Test@1234!`

- `ukemuk1@gmail.com` (inspector)
- `cabledie@gmail.com` (user)
- `devroom210@gmail.com` (admin)
- `admin@twzltd.com` (admin)

## Tests

```bash
npm test                  # database smoke (no services required)
npm run test:integration  # HTTP tests — run while `npm run dev` is active
```

## Notes

- All services share the same `JWT_SECRET` / `JWT_REFRESH_SECRET`.
- SMTP is configured in `notification-service` and `user-service` `.env` files.
- `FRONTEND_URL` for emails uses port **5173** (Vite); API gateway stays on **3000**.
