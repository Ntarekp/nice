# TWZ Fire System — Architecture Review

**Generated:** 2026-06-04  
**Scope:** Compare **documented/intended architecture** against **current codebase**, including explicit project constraints.

**Documentation reviewed:**

| Priority | Document | Found |
|----------|----------|-------|
| 1 | `docs/scenario.md` | Yes |
| 2 | `docs/architecture.md` | **No — file does not exist** |
| 3 | `docs/project-brief.md` | **No — file does not exist** |
| 4 | `docs/project-brief-missingcodes.md` | Yes (note: filename is `missingcodes`, not `missing-codes`) |
| 5 | `docs/frontend-brief-codes.md` | Yes |
| 6 | Source code + `api-gateway/src/swagger.json` | Yes |

Because `architecture.md` and `project-brief.md` are missing, this review treats **`scenario.md`**, the **microservice directory layout**, **`swagger.json`**, and **stated project constraints** (PostgreSQL only, no Redis) as the compliance baseline. `project-brief-missingcodes.md` is a **reference implementation** that deviates on Redis and must not be followed for caching/OTP storage.

---

## 1. Intended Architecture (Summary)

### 1.1 Business context (`scenario.md`)

TWZ LTD is migrating from a monolithic fire extinguisher system to **RESTful microservices** for:

- Extinguisher inventory and status
- Inspection scheduling and compliance tracking
- Maintenance history
- Real-time reporting (stock, inspections, expired units, maintenance)
- User management with three roles: **Admin**, **Inspector**, **User**

Non-functional expectations: JWT security, Swagger documentation, React SPA, PostgreSQL, paginated lists, logging, CORS/security hardening, PDF/CSV exports, responsive UI.

### 1.2 Technical shape (from brief + code layout)

| Principle | Intended |
|-----------|----------|
| Style | RESTful microservices behind an API Gateway |
| Services | User, Equipment, Inspection, Report, Notification (+ Gateway) |
| Data | **PostgreSQL only**, database-per-service |
| Auth | JWT access + refresh tokens, RBAC on routes |
| OTP | Email-based second factor at login (reference brief); **must use PostgreSQL, not Redis** (project constraint) |
| API docs | Swagger UI at gateway (`/api-docs`) |
| Frontend | React (Vite), calls gateway at `:3000` |
| Deployment | Docker images per service; compose with Postgres (reference brief — **Redis must be omitted**) |

### 1.3 Service boundaries

```
Client → API Gateway (3000)
           ├─→ User Service (3001)        … users_db
           ├─→ Equipment Service (3002)   … equipment_db
           ├─→ Inspection Service (3003)  … inspections_db
           ├─→ Report Service (3004)      … reports_db (aggregation)
           └─→ Notification Service (3005) … notifications_db + SMTP
```

Report service is **read-only aggregation** over Equipment + Inspection (HTTP), not source of truth for domain data.

Notification service is **internal** (`POST /api/notifications/send`), invoked by User and Inspection services — not a public browser-facing API in the reference design.

---

## 2. Current Implementation vs Intended

| Aspect | Intended | Current codebase | Verdict |
|--------|----------|------------------|---------|
| Microservice count | 5 + gateway | 5 + gateway present | Aligned |
| Gateway proxy | Route prefixes per domain | Implemented in `api-gateway/src/index.js` | Aligned |
| Swagger | Full external contract | `swagger.json` ~23 paths | Mostly aligned |
| Service route mounting | All domains live | **Only `/health` on each service** | **Deviation** |
| Controllers | Full business logic | **All 6 controllers are stubs** | **Deviation** |
| Model registration | Sequelize models synced | **`models/index.js` exports sequelize only** | **Deviation** |
| PostgreSQL | Only datastore | Configured per service | Aligned (config) |
| Redis | **Must not exist** | `ioredis` in user-service; `otp.js` uses Redis; deps in notification-service; Redis in reference `docker-compose` | **Critical deviation** |
| JWT + RBAC | All protected routes | Middleware files exist; unused | Partial |
| OTP login flow | login → email → verify-otp | Utils partially exist; not wired | **Deviation** |
| Pagination | All list endpoints | Swagger only; no controller logic | **Deviation** |
| PDF/CSV export | Report service | Dependencies only | **Deviation** |
| Notification email | SMTP via notification-service | Empty service | **Deviation** |
| Frontend | Full SPA | 12 stub files + 6 real pages | **Deviation** |
| docker-compose | Orchestration | **Missing** (only Dockerfiles) | **Deviation** |
| DB export (scenario A5.2) | SQL in repo | Missing | **Deviation** |
| User self-registration | scenario Activity 2b | Not in Swagger | **Spec gap / deviation** |

---

## 3. Deviations from Documented Architecture

### 3.1 Critical — Redis (must remediate)

| Location | Issue |
|----------|-------|
| `services/user-service/src/utils/otp.js` | Uses `ioredis` and `REDIS_URL` |
| `services/user-service/package.json` | Lists `ioredis` |
| `services/notification-service/package.json` | Lists `ioredis` (unused) |
| Service `.env` files | Contain `REDIS_URL` |
| `docs/project-brief-missingcodes.md` | Documents `redis` service in compose and Redis-backed OTP |

**Required remediation (no new infrastructure):** Store OTP codes in **PostgreSQL** (`users_db`), e.g. table `otp_codes` with hashed code, expiry, purpose, `userId`. Remove `ioredis` from dependencies and all env references. Do **not** add Redis to `docker-compose.yml`.

### 3.2 Critical — Services not wired

Every microservice `index.js` follows this pattern:

```javascript
// const routes = require('./routes/...');
// app.use('/api', routes);
app.get('/health', ...);
app.listen(HARDCODED_PORT, ...);
```

Gateway forwards traffic to **404/empty handlers**. Documented REST architecture exists only at the edge.

### 3.3 Critical — Controllers and user routes are placeholders

All of:

- `auth.controller.js`, `user.controller.js`
- `extinguisher.controller.js`
- `inspection.controller.js`, `maintenance.controller.js`
- `report.controller.js`

contain a single-line stub referencing chat. `auth.routes.js` and `user.routes.js` are also stubs. Reference implementations exist only in markdown (`project-brief-missingcodes.md`), not in runnable `src/`.

### 3.4 High — Models defined but not registered

Model files:

- User, RefreshToken, AuditLog (user-service)
- Extinguisher (equipment-service)
- Inspection, MaintenanceLog (inspection-service)

`models/index.js` in each service exports only `{ sequelize }`. `sequelize.sync()` creates **no domain tables**. `seed-admin.js` imports `User` from models index and **will fail**.

### 3.5 High — Frontend cannot start

Stubbed (1-line “copy from chat”):

- `main.jsx`, `App.jsx`, `lib/api.js`, `stores/auth.store.js`, `index.css`
- `DashboardLayout.jsx`, `Login.jsx`, `OtpVerify.jsx`, `ChangePassword.jsx`
- `Dashboard.jsx`, `Extinguishers.jsx`, `Reports.jsx`

Implemented pages (`Users`, `Inspections`, `Maintenance`, `ExtinguisherDetail`, `Profile`, `NotFound`) import stubbed `api` and will not run.

### 3.6 High — Notification service hollow

Gateway proxies `/api/notifications` but:

- No routes, controllers, or nodemailer usage in `src/`
- Not documented in `swagger.json`
- Reference design expects `POST /api/notifications/send` (internal)

Auth/inspection flows cannot send OTP or inspection emails.

### 3.7 Medium — API Gateway inconsistencies

| Issue | Detail |
|-------|--------|
| OTP rate limit path | `app.use('/api/auth/otp', otpLimiter)` but API is `/api/auth/verify-otp` |
| Unused auth middleware | `api-gateway/src/middleware/auth.middleware.js` not imported; gateway has no `jsonwebtoken` dependency |
| Notifications proxy | Proxied without Swagger entry |

### 3.8 Medium — Configuration inconsistencies

| Issue | Detail |
|-------|--------|
| Hardcoded ports | Services use `app.listen(3001)` etc., ignoring `process.env.PORT` |
| Wrong route comment names | e.g. `user-service.routes` vs actual `auth.routes.js` |
| Wrong mount prefix if uncommented | `app.use('/api', routes)` would not match gateway paths like `/api/extinguishers` |
| `.env.example` | References missing `Start-App.ps1`; implies different DB ports; all dev envs use `5432` |
| Dependencies | `"latest"` pins in all service `package.json` files — reproducibility risk |

### 3.9 Medium — Scenario vs Swagger vs Reference Brief

| Topic | scenario.md | swagger.json | Reference brief |
|-------|-------------|--------------|-----------------|
| User signup | Public registration API required | Admin `POST /api/users` only | Admin creates users + temp password |
| Login | Frontend signup/login | OTP two-step JWT | Same as swagger |
| Extinguisher types | 4 types | 6 types (+ wet_chemical, halon) | Matches swagger |
| Extinguisher sizes | 2.5, 5, 9, 12 lbs | Adds 20lbs | Extension |
| Redis | Not mentioned | Not mentioned | **Included — reject** |

**Recommendation:** Add `POST /api/auth/register` to meet scenario Activity 2b, **or** document explicit waiver in `architecture.md` with Figma/signup UI scoped to admin-driven onboarding only.

### 3.10 Low — Security and logging

| Expected | Current |
|----------|---------|
| Gateway CORS + helmet + rate limits | Implemented |
| Service helmet + morgan | Implemented |
| Service rate limiting | Dependency present, unused |
| Audit logs for admin actions | Model file exists; no controller |
| Structured application logging | Console + morgan only |

### 3.11 Low — Missing repository artifacts

- `docs/architecture.md`, `docs/project-brief.md` (requested but absent)
- `docker-compose.yml`
- `README.md`
- SQL database export / migrations
- Figma mock-up (Activity 1 — outside repo)

---

## 4. Architecture Compliance Scorecard

| Category | Compliant | Notes |
|----------|-----------|-------|
| Microservice decomposition | Yes | Folder structure matches |
| REST + Gateway pattern | Partial | Gateway yes; services no |
| PostgreSQL only | **No** | Redis in OTP path |
| JWT + RBAC | Partial | Middleware only |
| Swagger | Partial | Missing notifications; registration gap |
| React frontend | Partial | Non-bootstrapping |
| Pagination | No | Backend |
| PDF/CSV reports | No | |
| Logging | Partial | morgan only |
| CORS / edge security | Yes | Gateway |
| Reuse existing patterns | N/A | Patterns exist but incomplete |

---

## 5. Deviations from `project-brief-missingcodes.md` (Reference Only)

When implementing from the reference brief, **do not** adopt:

1. **Redis service** in Docker Compose  
2. **`ioredis` OTP storage** in `otp.js`  
3. **`REDIS_URL`** environment variables  

**Safe to adopt** (into existing file structure):

- Controller and route implementations  
- Notification nodemailer templates and `POST /send`  
- Report dashboard/export logic (pdfkit, json2csv)  
- Frontend files from `frontend-brief-codes.md`  
- Multi-Postgres compose layout (**without** redis service)

---

## 6. Recommended Architectural Corrections (Ordered)

1. **Remove Redis** from code, env, and planned compose; add PostgreSQL `OtpCode` entity.  
2. **Create `docs/architecture.md`** stating: microservices, DB-per-service, no Redis, JWT+OTP(Postgres), internal notification API.  
3. **Register Sequelize models** and fix mount paths:  
   - `/api/auth`, `/api/users`  
   - `/api/extinguishers`  
   - `/api/inspections`, `/api/maintenance`  
   - `/api/reports`  
   - `/api/notifications/send` (internal)  
4. **Implement controllers** from reference brief (PostgreSQL OTP variant).  
5. **Resolve registration** scenario vs admin-only Swagger.  
6. **Fix gateway** OTP rate limit path; extend Swagger for internal notification or mark private.  
7. **Restore frontend bootstrap** from `frontend-brief-codes.md`.  
8. **Add `docker-compose.yml`** with PostgreSQL only.  

---

## 7. Conclusion

The repository has a **correct high-level microservices skeleton** (gateway, five services, React app, OpenAPI contract, Sequelize models, route validators) but is **not architecturally compliant** for production or grading because:

- **Business APIs are not mounted or implemented**  
- **Redis is present** despite the project constraint of PostgreSQL-only  
- **Frontend core is non-functional**  
- **Key documentation files are missing**  
- **Scenario requirements for self-registration and DB export are unmet**

Treat the codebase as **~28% complete** structurally (see `IMPLEMENTATION_PLAN.md` §8) with **critical deviations** listed above blocking end-to-end operation.

---

*See `docs/IMPLEMENTATION_PLAN.md` for the requirement matrix, full gap list, module dependencies, and phased implementation order.*
