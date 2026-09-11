# Ziu Gym — Apple Developer Academy Portfolio Entry
> **Format**: Sesuai template resmi `NamaLengkap_Portofolio_Academy.pdf`
> **Bahasa**: English (sesuai requirement Academy)
> **Project**: 1 of 5

---

## PROJECT METADATA

| Field | Content |
|---|---|
| **Artwork/Project Title** | Ziu Gym — Full-Stack Gym Management Web Platform |
| **Year Accomplished** | 2026 |
| **Role/Position** | Full-Stack Developer & UI/UX Designer |
| **Publication Link** | GitHub: `[YOUR_GITHUB_URL]` · Live: `[YOUR_VERCEL_URL]` |
| **Project Type** | Self-initiated individual project |

---

## ARTWORK/PROJECT DESCRIPTION

### One-Sentence Summary
Ziu Gym is a production-ready, full-stack web application that replaces manual gym membership management with a real-time, role-protected digital system covering the entire member lifecycle from sign-up to expiry.

---

### Problem Understanding

Manual gym management — using spreadsheets or paper records — creates three compounding problems: data inconsistency when multiple staff members edit the same records, zero visibility into membership health (how many members are active vs. expiring), and no audit trail when status changes are made. For a small gym aiming to scale, this friction translates directly into lost renewals and administrative overhead.

The core question I set out to answer: **Can a solo developer build a production-grade, secure member management system in a single cohesive codebase that is both visually compelling and technically rigorous?**

---

### Research & Design Process

Before writing a single line of code, I studied what gym management systems need at their core:

- **Member lifecycle states**: A member is not simply "in" or "out" — they can be `active`, `paused` (temporarily on hold), or `expired`. The system must track all three and allow quick status transitions.
- **Data integrity**: Each member record needs: name, email (unique), phone, membership plan, status, join date, and expiry date. Email uniqueness prevents duplicate entries. Expiry must always be after join date (validated at both the schema and server level).
- **Access control**: Member data is sensitive. Only authenticated administrators should read or modify it. Public users see only the editorial landing page.
- **Performance aesthetic**: A gym brand must feel energetic. I studied editorial fitness platforms and chose a **dark performance-lab** visual direction — charcoal surfaces (`#101111`), off-white typography (`#f6f6ef`), and acid-lime accents (`#d9ff3f`) — a palette that communicates strength without aggression.

This research shaped both the database schema and the UI architecture before development began.

---

### Technical Solution & Problem Solving

**Architecture: Monorepo with 3 layers**

The project uses a single TypeScript monorepo organized into three packages:

- `client/` ? React 19 SPA (Vite 7, Tailwind CSS v4, tRPC client)
- `server/` ? Express 4 + tRPC router (protected procedures, auth)
- `shared/` ? Constants and types shared between client and server

This structure eliminates type drift between frontend and backend — a common source of runtime bugs in separate repos.

**Database: MySQL + Drizzle ORM**

I designed a minimal but complete schema with 2 tables:

| Table | Key Fields |
|---|---|
| `users` | `id`, `openId` (OAuth), `email`, `role` (user/admin), `lastSignedIn` |
| `members` | `id`, `name`, `email` (unique), `phone`, `plan` (flex/unlimited/coach), `status` (active/paused/expired), `joinedAt`, `expiresAt` |

Drizzle ORM provides type-safe query builders and handles migrations via `drizzle-kit`. The database connection is lazily initialized — the app starts without a database configured, which improves local development ergonomics.

**API Layer: tRPC v11 — End-to-End Type Safety**

Rather than REST endpoints, I used tRPC to expose 5 typed procedures:

| Procedure | Access | Function |
|---|---|---|
| `members.list` | Admin only | Returns all members ordered by creation date |
| `members.stats` | Admin only | Computes total, active, paused, expired counts |
| `members.create` | Admin only | Validates and inserts a new member |
| `members.update` | Admin only | Updates all fields for an existing member |
| `members.updateStatus` | Admin only | Changes only the status field |

Each mutation runs through Zod schema validation before touching the database. The `expiresAt >= joinedAt` constraint is enforced at the API layer, not just the UI.

**Authentication: OAuth + JWT Cookie Sessions**

Authentication uses an OAuth flow with JWT-signed session cookies (`__Host-` prefix for CSRF protection). The server reads the session on every request and exposes a `ctx.user` object to all tRPC procedures. The `adminProcedure` middleware throws `FORBIDDEN` if `ctx.user.role !== 'admin'`.

**Frontend: React 19 + Wouter + CSS Animations**

The application has 2 routes:
- `/` — Public editorial landing page (no auth required)
- `/dashboard` — Protected member management dashboard (admin only)

The landing page features a **hero phrase rotation system** — 4 motivational phrases cycle in a seamless CSS keyframe loop (13.2s cubic-bezier), with a marquee band (`Strength · Focus · Discipline · Repeat`) and a floating equipment image. All animations respect the `prefers-reduced-motion` media query, falling back to a static complete phrase.

The dashboard uses a searchable member table with real-time status counters (total, active, paused, expired) and a dialog-based member form that handles both creation and editing from a single component.

**Testing: Vitest Unit Tests**

I wrote 5 unit tests covering:
1. Valid member input schema parsing
2. Rejection of expiry date before join date
3. Admin can create a member
4. Admin can update member details and status
5. Non-admin receives `FORBIDDEN` on all 3 mutations

---

### Impact

- **End-to-end gym management system** deployed to production on Vercel
- **Zero-fabrication data policy** — member counts reflect actual live database records, not hardcoded numbers
- **Accessibility-first animations** — degrades gracefully for users with vestibular disorders (`prefers-reduced-motion`)
- **Production deployment** — live at Vercel URL with MySQL production database

---

### What I Learned

1. **Type safety across the full stack** — TypeScript + tRPC means a field rename in the database schema propagates as a compile error in the frontend, eliminating an entire class of bugs.

2. **Auth is infrastructure, not a feature** — Building OAuth + JWT session before any product feature forced security-first thinking. The `__Host-` cookie prefix and role-based procedure guards taught me that access control must exist at every layer.

3. **CSS animations require engineering** — Getting the hero phrase loop to transition seamlessly from the last item back to the first required understanding cubic-bezier timing and the array duplication trick. Reduced-motion support added a progressive enhancement constraint.

4. **Database constraints are product decisions** — `email` uniqueness, `expiresAt >= joinedAt` enforcement, and the 3-state status enum are product decisions encoded in schema. Schema design IS product design.

5. **Monorepo architecture** — A single `shared/` package for types that both client and server import maintains one source of truth for the entire project.

---

## TECH STACK

| Category | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build tool | Vite | 7.1 |
| Styling | Tailwind CSS | v4.1 |
| API layer | tRPC | v11.6 |
| Server | Express | 4.21 |
| ORM | Drizzle ORM | 0.44 |
| Database | MySQL | via mysql2 3.15 |
| Auth | OAuth + JWT (jose) | 6.1 |
| Validation | Zod | v4.1 |
| Testing | Vitest | 2.1 |
| Deployment | Vercel | — |
| Routing (client) | Wouter | 3.3 |

---

## CONNECT THE DOTS — Apple Developer Academy Values

| Academy Criterion | How Ziu Gym Demonstrates It |
|---|---|
| **Interest & Motivation** | Self-initiated project to solve a real operational problem — not an assignment, driven by curiosity about full-stack architecture |
| **Creativity & Expression** | Dark performance-lab visual system (charcoal + acid-lime), animated hero phrase rotation, editorial asymmetric landing page — deliberate creative decisions grounded in fitness brand identity |
| **Interdisciplinary Potential** | Spans frontend design (color theory, animation, typography), backend engineering (auth, ORM, tRPC), database design (schema, constraints, migrations), and product thinking (lifecycle states, access control) |
| **Work Ethic & Excellence** | Production deployment, unit test coverage for all mutations, accessibility (reduced-motion), zero-fabrication data policy, meaningful GitHub commit history — commitment beyond just making it work |
