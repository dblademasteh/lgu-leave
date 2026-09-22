# LGU Leave Management – Agent Guide

## Commands

- Frontend dev: `cd frontend && npm run dev` → http://localhost:5175
- Frontend build verify: `cd frontend && npm run build`
- Backend dev: `cd backend && npm run dev` → http://localhost:4200
- Backend syntax check: `cd backend && node --check src/server.js`
- Prisma generate: `cd backend && npx prisma generate`
- Prisma migrate: `cd backend && npx prisma migrate dev`
- Seed demo user: `cd backend && node prisma/seed.js`

## Architecture

- Frontend: React 19 + Vite 5, React Router 6, Zustand, Tailwind 4, Axios. No build-time types.
- Backend: Express 5 ESM, port 4200, Prisma Postgres 16 on port 5440.
- DB URL from `backend/.env` → `postgresql://postgres:postgres@localhost:5440/lgu_leave`
- Auth: JWT access 15m + refresh 7d stored in `Employee.refreshToken`. Login `POST /auth/login` with `employeeNumber` + password.
- API base for frontend defaults to `http://localhost:4200`; override with `VITE_API_BASE_URL`.
- Storage keys: `lgu-leave-auth`, `lgu-leave-theme`, `lgu-leave-appearance`, `lgu-leave-sidebar-collapsed`.

## Data & Flow

- `Employee` has `employeeNumber` unique, `role`, `department`, `passwordHash`.
- `LeaveRequest` one per employee per period, status `PENDING|APPROVED|REJECTED|CANCELLED`.
- `LeaveType` code unique, e.g. `VL`, `SL`.
- Role-based approval on create:
  - VL → DEPARTMENT_HEAD → HR_MANAGER
  - SL → DEPARTMENT_HEAD
  - GL → DEPARTMENT_HEAD → HR_MANAGER → ADMIN
  - Approver chosen by role + same department, first role in chain.
- `POST /api/v1/leaves/:id/approve` with `{decision: 'APPROVE'|'REJECT', comment?}` updates approval and cascades status.
- HRMS sync stub: `POST /api/v1/webhooks/hrms` expects `event` + `data`, verifies `X-HRMS-Signature` with `HRMS_WEBHOOK_SECRET` if set. Handles `employee.created|updated|deleted`.

## Conventions

- Routes = HTTP + validation, services not yet separated; keep routes thin.
- Zod validation in routes, dates `YYYY-MM-DD`.
- Audit middleware logs non-GET requests to console.
- Frontend API client adds Bearer from `lgu-leave-auth`.
- No ESLint/Typecheck in repo; verify with `npm run build` + `node --check`.

## Gotchas

- Backend must be running before frontend login works.
- Prisma client must be generated after schema changes; migrations required for new fields.
- `backend/.env` must contain `DATABASE_URL`, `JWT_SECRET`. No `.env` for frontend; API URL via Vite env.
- Demo user seeded: employeeNumber `1001` / password `password123`, role ADMIN.
- Tailwind 4 uses `@tailwindcss/postcss`; `postcss.config.js` required.
