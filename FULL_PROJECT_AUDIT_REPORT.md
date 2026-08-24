# Invera Digital Agency — Full-Stack Audit Report

**Date:** 2026-08-03
**Scope:** Entire repository at `/home/sohan/Projects/Coding/Agency`
**Nature:** Read-only review. No source files were modified.

---

## 1. Project Overview

A full-stack digital agency platform ("Invera") with a client-facing marketing site, a client portal, and an admin dashboard, plus a broad B2B backend. It is an ambitious modular build with dozens of feature modules.

| Layer | Stack | Location |
|---|---|---|
| Frontend | Next.js `16.2.12` (App Router), React `19.2.4`, Tailwind v4, TypeScript (strict) | `frontend/` |
| Backend | Express 4 + TypeScript, Mongoose 8 (MongoDB), JWT (access+refresh), Zod validation | `backend/` |
| Storage | MongoDB (Mongoose), local disk uploads (`uploads/`) with optional Cloudinary service | — |
| Payments | Stripe (PaymentIntent + webhook) | `backend/src/modules/webhooks` |
| Email | Custom SMTP service (opt-out if no config) | `backend/src/services/email.service.ts` |

No package `monorepo` tooling; `frontend/` and `backend/` are independent npm projects. The working repo is **not** a git repo at root.

---

## 2. Architecture & Routing

### Backend
- Single Express app (`backend/src/index.ts`). All routers are mounted under `/api/*`:
  ```
  /api/auth /api/users /api/roles /api/permissions /api/leads /api/projects
  /api/quotes /api/invoices /api/webhooks /api/messages /api/reviews /api/notifications
  /api/cms /api/blog /api/activity-log /api/analytics /api/uploads /api/files
  /api/proposals /api/case-studies /api/services /api/support /api/finance
  /api/hr /api/sales /api/tasks /api/pricing /api/budget-options
  ```
- Stripe webhook mounted with `express.raw()` before body parsing and verifies the signature (correctly done).
- Global `errorHandler` returns JSON; unknown errors fall through to a 500.

### Frontend
- App Router. Public marketing site under `app/(root)`, auth under `app/(auth)`, client portal under `app/client`, admin under `app/dashboard`.
- **No `middleware.ts` exists anywhere** — all route protection is client-side only.
- Root `app/layout.tsx` mounts `AuthContext` on every page (fires `GET /auth/me` whenever a token exists, including on public marketing pages).

---

## 3. Roles, Permissions & Authorization

### 3.1 Two parallel authorization models (active simultaneously)
1. **`roleGuard(...roles)`** (`backend/src/middleware/roleGuard.ts`) — checks `User.role` against an allow-list; **always grants `super_admin`** regardless of the list.
2. **`permissionGuard(...slugs)`** (`backend/src/middleware/permissionGuard.ts`) — loads the User, walks `UserRole → Role → RolePermission → Permission` and requires that **every** supplied slug be present (`every` semantics). **No `super_admin` bypass.** It performs a lazy dynamic `import()` of the User model inside the guard body.

Codebase uses **both** — some modules rely on `roleGuard`, a few use `permissionGuard`, and they are never reconciled. A `super_admin` who lacks a specifically seeded `RolePermission` record can be denied by `permissionGuard`, while `roleGuard` gives them carte blanche. This is the single largest architectural inconsistency.

### 3.2 Roles
- **Hard role field on `User`:** `super_admin | admin | team | client` (single `role` string).
- **Seeded Role documents** (`backend/src/seed/defaultRoles.ts`): 11 roles (incl. `project_manager`, `finance_manager`, `support_executive`, `hr`, etc.) mapped through `RolePermission` → `Permission`.
- `authGuard` re-loads the user from the DB every request and attaches `role` from the DB; this respects deactivation but adds a DB round-trip per request.

### 3.3 Frontend gate
- `app/dashboard/layout.tsx` performs **client-only** role check via an `adminOnlyPrefixes` list (which is incomplete — e.g. it does not cover `/dashboard/services`).
- `app/client/layout.tsx` redirects non-`client` roles to `/dashboard` and unauthenticated users to `/login`.

Because there is no server-side middleware, a non-privileged user can navigate directly to any protected route and briefly render the shell before the client-side effect redirects; the protection is cosmetic gating only. Actual data security depends entirely on backend guards (which have their own gaps, see §5).

---

## 4. Feature Inventory

### Implemented (backend)
auth, users, roles, permissions, leads (incl. convert-to-client, bulk), projects (milestones, contracts, revisions, team assignment), quotes, invoices (PDF, send/void, Stripe, manual confirm, verify), webhooks (Stripe), messages (per-project chat), reviews (approval flow), notifications, CMS (regional, schema-typed, SEO), blog, activity-log, analytics/dashboard, uploads/files, proposals, case-studies, services, support tickets + categories, finance (incomes/expenses/summary/monthly), HR (attendance, leaves, recruitment), sales (pipelines, targets, commissions), task management (tasks, sprints, subtasks, time entries), pricing plans, budget options.

### Implemented — frontend
- Marketing pages: home (hero/logo/services/why-us/portfolio/testimonials/FAQ/CTA), about, services, process, work, testimonials, pricing, faq, contact, blog (list/detail), case-studies (list/detail), jobs/careers.
- Client portal: dashboard, projects (+ detail/milestones), invoices (+ detail/PDF/pay), proposals (list/new/detail), messages, notifications, support tickets, settings.
- Admin dashboard: analytics/home, leads, projects, quotes, invoices, proposals, users, roles, permissions, tasks, HR, finance, sales, support, cms, blog, case-studies, services, pricing, budget-options, files, activity-log, publications.

### Not implemented / missing
- **`movies.ts` / `robots.ts`** — no SEO-site-map / robots routes.
- **`loading.tsx` / `error.tsx` / `not-found.tsx`** — no loading or error boundaries anywhere.
- **Server-side route protection middleware** (none).
- **Real-time / push notifications** — notifications are DB-stored only; client must poll.
- **Public single-plan endpoint** (`/pricing/:id` is admin-only).
- **Recruitment/jobs page on the client site** appears incomplete as a fully wired flow despite HR recruitment APIs existing.

---

## 5. High-Severity Issues

### 5.1 CRITICAL — `POST /api/leads` is anonymous
`backend/src/modules/leads/routes.ts:2` mounts `/` with **no `authGuard`**. Anyone on the public contact form / newsletter can create leads. This is intentional for the public form, but `leadService.create` does not sanitize `assignedTo`/`status`/`priority`/`leadScore`, so an anonymous caller can spoof assignment fields. Also no rate-limiting on this public write endpoint (spam surface).

### 5.2 HIGH — Any authenticated user can view **all** tasks
`backend/src/modules/tasks/routes.ts:18` applies only `authGuard` globally and `GET /` has no role/ownership filter. A `client` (or team user) can list every task in the agency. Sprints and time entries are similarly readable by any authenticated user.

### 5.3 HIGH — Any authenticated user can read/send messages for any project
`backend/src/modules/messages/routes.ts` has only `authGuard`; `GET /:projectId`, `POST /:projectId`, `POST /:id/reply` perform **no project-membership check** (an ownership filter only exists in some controller branches). Any authenticated user can read and inject into any project's chat.

### 5.4 HIGH — Uploads: arbitrary user → arbitrary project
- `uploads/routes.ts` is behind `authGuard` only; no **project membership / ownership** check. Any authenticated user can upload files (multipart, 50 MB limit) into any `projectId`.
- Allowed-image extensions **include SVG**, which risks stored-XSS if the file is later served inline with the same origin.
- Frontend `services/uploads.ts:5` force-sets `Content-Type: multipart/form-data` (no boundary) via the header spread, corrupting multipart uploads on most servers (`lib/api.ts` already omits Content-Type for FormData).

### 5.5 HIGH — Invoice PDF and Stripe payment lack ownership checks
- `GET /api/invoices/:id/pdf` (`invoices/routes.ts:13`) is behind `authGuard` **only**. Any client can download any invoice's PDF (another client's billing data). `getById` correctly enforces ownership, but the PDF route does not reapply it.
- `POST /api/invoices/:id/stripe-payment` is `roleGuard('client')` but does **not** verify the invoice belongs to the requesting client. A client can create a Stripe PaymentIntent for any invoice id.
- The Stripe webhook marks an invoice `paid` from `metadata.invoiceId` **without reconciling** `paymentIntent.amount` with the stored `invoice.total` or currency.

### 5.6 HIGH — Tokens in `localStorage` + non-HttpOnly cookie (XSS → account takeover)
- `frontend/lib/api.ts` writes both the **access** and long-lived **refresh** tokens to `localStorage` AND a JS-readable cookie (`lib/cookies.ts`, `SameSite=Lax`, no `HttpOnly`, no `Secure`).
- The refresh token is the persistent credential (7-d performer) — an XSS payload can exfiltrate it and take over the account permanently.
- The cookie is redundant (the API is on a different origin; auth uses the `Authorization` header), so it only widens the blast radius.

### 5.7 HIGH — Hard-coded fallback JWT secrets
`backend/src/config/env.ts` falls back to `'dev-jwt-secret'` / `'dev-jwt-refresh-secret'` and `15m` / `7d` expiries if env vars are absent. If deployed without secrets, tokens are signed with a **public, known secret** → anyone can forge tokens. Should fail fast instead of defaulting.

### 5.8 HIGH — Converted lead password is lost
`leads/service.ts` `convertToClient` sets a random password and never returns it nor emails it; the new client cannot authenticate without a manual reset (the email welcome service is unused here).

---

## 6. Medium-Severity Issues

| Finding | Location |
|---|---|
| `rememberMe` on the login page is dead state; tokens always persisted regardless | `frontend/app/(auth)/login/page.tsx:18,139` |
| Blog `slugify()` is a stub that `throw new Error("Function not implemented.")` — first title keystroke breaks the create/edit modal | `frontend/app/dashboard/blog/page.tsx:653` → called `:142,456` |
| `Contact.tsx` and footer each fetch `/cms/contact` / `/cms/home` twice; with `no-store` caching the marketing homepage makes 4–6 uncached backend calls | `app/(root)/contact/page.tsx:24-25`, `app/(root)/(home)/page.tsx:12,24` |
| Stripe "Pay Now" in client invoice detail creates a PaymentIntent clientSecret but never mounts Stripe Elements/redirect — user **cannot complete payment**, and the raw clientSecret is printed in the UI | `frontend/app/client/invoices/[id]/page.tsx:49-68` |
| Invoice totals are recomputed inconsistently: `create` never adds `tax`; PDF hard-codes `$`; `grandTotal` (frontend) can go negative; invoice PDF and list amounts can diverge | backend `invoices/controller.ts:47,272-294`; frontend invoice detail `:98-101` |
| `consoles.log({ segs })` debug in `Title.tsx:30` runs on every marketing render (leaks CMS to console) | `frontend/components/ui/Title.tsx` |
| Object-Id string fields validated only as `z.string()` across schemas → malformed ids become Mongoose cast errors (500) instead of 400s;
 several `PATCH` routes skip the `validate` middleware (invoices `:id`, sales `targets/:id`), leaving mass-assignment/mixed state | routes/validation |
| Leads search builds MongoDB `$regex` from the raw query string unescaped — ReDoS / regex injection vector | `leads/service.ts:139` |
| `bulkAction` passes raw `data` into `updateMany` — operator injection (`$set` etc.) by admin/team | `services/leads.ts` / leads controller |
| Analytics dashboard runs multiple full-collection scans per request, no caching (degrades poorly with growth) | `analytics/controller.ts:10-64` |
| `GET /api/leads/.../my` vs public; notification `markRead` correctly scoped, but no pagination; notifications grow unbounded | notifications controller |
| Sales `updateTarget` not validated | `sales/routes.ts:29` |
| Task `estimatedHours`/`actualHours` no negative bound | `tasks/validation.ts:12,27` |
| HR `createLeave` allows any authenticated role and an arbitrary `userId`; only `z.string()` date validation | `hr/routes.ts:22`, `hr/validation.ts` |
| `assignTeam` accepts arbitrary/malformed `teamMemberIds` | `projects/controller.ts:275` |
| `updateMilestone` division-by-zero → `progressPercent` NaN | `projects/controller.ts:201` |
| Milestone matched by `title` in client project detail (ambiguous under duplicate titles); `milestone._id` optional | `frontend/app/client/projects/[id]/page.tsx:62-75` |
| Ticket "View" button is a no-op; tickets detail has no read route | `frontend/app/client/tickets/page.tsx:148` |
| Messages: `senderId` may be a populated object → own-message alignment breaks | `frontend/app/client/messages/page.tsx:104` |
| In-client invoice list: pagination not wired (`page` unused, `totalPages=1`); search box no-op | `frontend/app/client/invoices/page.tsx` |
| `dashboard/blog slugify` (see top) breaks publish; quotes/invoices/proposals list pagination similarly no-op | various dashboard list pages |
| `remember`/settings `setState` during render (derived state anti-pattern) | `frontend/app/client/settings/page.tsx:31` |
| `console.log` and stray artifact `/frontend/0` zero-byte file committed | `frontend/0` |
| Custom cursor sets `cursor:none` with no coarse-pointer / reduced-motion restore; focus-ring suppression with `:focus:not(:focus-visible)` | `app/styles/globals.css` |
| Webhook only handles `payment_intent.succeeded` / `.payment_failed`; refunds/cancels silently ignored | `webhooks/routes.ts` |

---

## 7. Bugs & Code Quality

**Backend**
- `invoice.create` silently ignores invalid discount codes; `discount.service` (in-memory, hard-coded codes `WELCOME10`,`SAVE50`) increments `currentUses` even if the invoice insert later fails, is not concurrency-safe, and resets on restart (no persistence).
- `invoiceNumber` uses `Date.now().toString(36).slice(-6)` — 6-char collision risk under rapid creation.
- `auth.register` maps `developer`→`team`, else `client`; **users can self-register as `client` with no admin approval flow**.
- No whistle `session` reuse-detection beyond hashed single-slot refresh rotation (acceptable).
- `getAll`/`getById` for projects scope clients to their own, team to assigned; milestones restrict team field-set — generally solid.

**Frontend**
- No error boundaries; failed CMS calls silently render blank sections (`cms-public.ts` swallows all errors).
- `adminOnlyPrefixes` missing `/dashboard/services`; no server-side guard.
- `/frontend/.env` sets `NEXT_PUBLIC_API_URL=https://craft-agency-backend-production.up.railway.app` **without** `/api`; backend mounts everything under `/api/*`. If not overridden in deployment, **all API calls 404**. `config/env.ts` default has `/api` but is overridden. `services/invoices.ts` also hard-codes a separate fallback (`localhost:5000/api`) → duplicated, drifting config.
- `Header` active-link highlight uses `pathname.startsWith(href)` → overlapping routes wrongly highlighted.
- `FooterNewsletter.tsx:114` renders stray literal text `"The message"`.
- `next.config.ts` remote image allowlist only `images.unsplash.com`; CMS-hosted images elsewhere will fail `next/image`.
- No `revalidate` strategy (all `cache:'no-store'`).

---

## 8. Performance Notes

- `authGuard` loads the user from DB on every authed request.
- Analytics dashboard issues ~7 parallel aggregate/count full-collection scans per call, no caching.
- Public marketing pages each make 4–6 uncached CMS/backend round-trips.
- No DB indexing for `refreshToken` (hashed) lookups; no pagination on notifications.

---

## 9. Tech Debt & Inconsistencies

1. **Two authorization systems not reconciled** (`roleGuard` + `permissionGuard`), with `/` semantics difference. This must be consolidated.
2. Token storage model is designed for security failure (XSS = takeover) and is architecturally inverted relative to "HttpOnly refresh cookie + rotating access token".
3. Seed/repair inconsistency: `npm run seed` doesn't `repairCmsDefaults`, and pricing/plans seeding `skip if count>0` won't backfill missing defaults (unlike CMS which repairs).

---

## 10. Roadmap Recommendation (priority order)

### P0 — Critical, do immediately
1. Add **server-side route protection** (`frontend/middleware.ts`) for `/dashboard` and `/client`.
2. Fix **token storage**: move the refresh token to an `HttpOnly; Secure; SameSite` cookie set by backend; rotate; keep access token in memory only (drop `localStorage`). At minimum add `Secure` and drop duplicate storage.
3. **Enforce ownership**: invoice PDF + Stripe payment (client), uploads (project membership), messages (project membership), tasks (scope client to own project / prevent client delegation).
4. Reject unsafe default JWT secrets in production (`env.ts` fail-fast). Never fall back to known dev secrets.
5. Return/email the generated password on lead→client conversion.

**P1**
- Add rate limiting to public `POST /leads` and other anonymous writes.
- Fix blog `slugify` stub; wire real pagination/search on invoices/quotes/proposals lists; implement an actual Stripe pay UI (or remove the dead button).
- Clean up leads `$regex` + `bulkAction` operator injection; apply consistent `validate()` to all `PATCH` routes and ObjectId refinement.
- Add `error.tsx`/`loading.tsx`; remove `console.log` in `Title.tsx`; delete stray `/frontend/0`; dedupe CMS fetches.

**P2**
- Add SEO infra (`sitemap.ts`, `robots.ts`), canonical/OG tags.
- Cache analytics/dashboard and bounds scans; add pagination on notifications; date-bounded invoice aggregates.
- Normalize validation (negative-hour guards, date ordering, cross-checks for commission amounts, `leave` ownership).
- Add real-time notifications transport.

---

## 11. Verdict

The platform is feature-dense and the backend is largely well-factored (clean modules, good ownership checks on projects, correct Stripe raw-signature verification, idempotent safe seed/repair strategy). However, a cluster of **authorization gaps — anonymous writes, missing ownership checks on invoices/uploads/messages/tasks, token-in-localStorage, and hard-coded JWT defaults — constitute serious production blockers** that must be fixed before real clients/cash. Frontend has P0 correctness gaps (broken base URL `/api` prefix, blog slugize crash, dead Stripe payment flow) and zero server-side route protection. The highest-value next steps are the P0 items in §10.
