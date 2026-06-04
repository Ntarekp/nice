# PostgreSQL dumps

SQL dumps for each TWZ microservice database on a single PostgreSQL server.

| File | Database | Service |
|------|----------|---------|
| `users_db.sql` | `users_db` | user-service |
| `equipment_db.sql` | `equipment_db` | equipment-service |
| `inspections_db.sql` | `inspections_db` | inspection-service |
| `reports_db.sql` | `reports_db` | report-service |
| `notifications_db.sql` | `notifications_db` | notification-service |

## Regenerate

From repo root (reads `.env` for host/user/password):

```bash
npm run db:dump
```

Requires `pg_dump` on PATH, or set `PG_DUMP` to the full path (e.g. `C:\Program Files\PostgreSQL\18\bin\pg_dump.exe` on Windows).

## Restore one database

```bash
psql -h localhost -U postgres -d users_db -f dumps/users_db.sql
```

Create empty databases first if needed: `npm run db:create`

## Notes

- Dumps use `--clean --if-exists` so restore drops existing objects first.
- Files may contain **hashed passwords and PII** — do not commit to public repos without review.
