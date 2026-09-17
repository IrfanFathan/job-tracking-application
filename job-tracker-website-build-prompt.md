# Job Application & Interview Tracker — Web App Build Prompt
*(RISEN + TIDD-EC hybrid. Paste directly into Claude Code, Cursor, or any agentic coding assistant.)*

## Template Variables
Fill these in before use — defaults assume your usual stack:

| Variable | Default | Change to |
|---|---|---|
| `{{PROJECT_NAME}}` | `job-tracker` | your repo/app name |
| `{{STACK}}` | Next.js 14 (App Router) + TypeScript + Node.js + MySQL 8 + Prisma + Tailwind CSS | any other stack — keep the schema/logic below identical |
| `{{AUTH}}` | none (single-user local tool) | `NextAuth (email/password)` if you need multi-user later |
| `{{DEPLOYMENT}}` | Vercel (app) + PlanetScale/Railway (MySQL) | your host of choice |

---

## ROLE
You are a senior full-stack engineer who specializes in `{{STACK}}` and writes production-quality, well-typed, modular code. You default to clean relational design over denormalized shortcuts, and you validate every input server-side, not just in the UI.

## TASK TYPE
Build a complete, working CRUD web application — **{{PROJECT_NAME}}** — that ports an existing, fully-specced Google Sheets job-search tracker into a relational web app. Two linked entities, one dashboard.

## CONTEXT

This is a 1:many port of a spreadsheet with three tabs: **Applications** → **Interviews** (linked by ID) → **Dashboard**. Below is the full data model, carried over field-for-field from the validated spreadsheet spec.

### `applications` table

| Field | Type | Notes |
|---|---|---|
| `id` | INT PK, autoincrement | internal key |
| `app_code` | VARCHAR(10), unique | display ID, server-generated as `APP-001`, `APP-002`, … — never user-editable |
| `company_name` | VARCHAR(255) NOT NULL | |
| `job_title` | VARCHAR(255) NOT NULL | |
| `role_type` | ENUM | `Full-Time, Part-Time, Contract, Internship` |
| `work_mode` | ENUM | `Remote, Hybrid, On-site` |
| `location_details` | VARCHAR(255) | city / state / country, free text |
| `job_posting_url` | VARCHAR(500) | |
| `notes` | TEXT | job description / notes |
| `salary_range` | VARCHAR(100) | stored as text — ranges like "$90k–$110k" don't fit a numeric currency column |
| `application_date` | DATE NOT NULL | |
| `application_source` | ENUM | `LinkedIn, Indeed, Company Portal, Referral, Other` |
| `referral_contact` | VARCHAR(255) | |
| `status` | ENUM, default `Bookmarked` | `Bookmarked, Applied, Screening, Interviewing, Offer Received, Rejected, Withdrawn` |
| `follow_up_date` | DATE | |
| `created_at` / `updated_at` | TIMESTAMP | |

`days_since_applied` is **not a stored column** — compute it live (see STEPS, Phase 3), matching the spreadsheet's `DATEDIF` formula.

### `interviews` table

| Field | Type | Notes |
|---|---|---|
| `id` | INT PK, autoincrement | |
| `int_code` | VARCHAR(10), unique | server-generated `INT-001`, `INT-002`, … |
| `application_id` | INT NOT NULL, **FK → applications.id** | enforced at the DB level |
| `round_type` | ENUM | `HR Screen, Recruiter Call, Technical / Coding, Take-Home Assignment, System Design, Behavioral / Culture Fit, Final Round` |
| `interview_datetime` | DATETIME NOT NULL | |
| `interviewers` | VARCHAR(500) | name(s) & titles |
| `meeting_link` | VARCHAR(500) | |
| `prep_notes` | TEXT | |
| `feedback` | TEXT | questions asked / feedback received |
| `outcome` | ENUM, default `Pending Feedback` | `Passed, Pending Feedback, Needs Follow-Up, Rejected` |
| `thank_you_sent` | BOOLEAN, default `false` | |
| `created_at` / `updated_at` | TIMESTAMP | |

**Note the deliberate change from the spreadsheet:** `company_name` and `job_title` are **not** duplicated columns here (the sheet used `XLOOKUP` to copy them across). In a relational DB, the correct equivalent is a live JOIN through `application_id` — never store a denormalized copy that can drift out of sync.

### Color tokens (carry these over exactly, for visual continuity with the spreadsheet version)

**Status:**
| Status | Background | Text |
|---|---|---|
| Bookmarked | `#ECEFF1` | `#546E7A` |
| Applied | `#E3F2FD` | `#1565C0` |
| Screening | `#FFF8E1` | `#F9A825` |
| Interviewing | `#FFE0B2` | `#E65100` |
| Offer Received | `#E8F5E9` | `#2E7D32` |
| Rejected | `#FFEBEE` | `#C62828` |
| Withdrawn | `#F5F5F5` | `#9E9E9E` |

**Outcome:**
| Outcome | Background | Text |
|---|---|---|
| Passed | `#E8F5E9` | `#2E7D32` |
| Pending Feedback | `#FFF8E1` | `#F9A825` |
| Needs Follow-Up | `#FFE0B2` | `#E65100` |
| Rejected | `#FFEBEE` | `#C62828` |

---

## STEPS

**Phase 1 — Scaffold**
Initialize `{{PROJECT_NAME}}` on `{{STACK}}`. Set up Prisma with the two models above and the relation (`Interview.applicationId → Application.id`, `onDelete: Cascade`, with a confirm-before-delete UX step on the frontend so cascading deletes are never a surprise).

**Phase 2 — Applications module**
List view (sortable/filterable table, status badges colored per the token table), create/edit form (dropdowns validated against the enums, date pickers for `application_date`/`follow_up_date`), delete with confirmation.

**Phase 3 — Days Since Applied (computed, not stored)**
In the API layer or a shared util, compute per row:
```
if (!application_date) return null
if (status in ['Rejected','Withdrawn','Offer Received']) return 'Closed'
return daysBetween(application_date, today)   // DATEDIFF equivalent
```
Recompute on every read — this must never be a persisted column, or it goes stale exactly like a spreadsheet formula that got pasted as a value.

**Phase 4 — Interviews module**
List view + create/edit form. Application ID is a **searchable select** (typeahead over `applications`, not free text), and choosing one live-fills read-only Company Name / Job Title via the join — the web equivalent of the sheet's `XLOOKUP`. Round Type / Outcome as validated dropdowns, colored per the token table. Thank-You Note as a real checkbox.

**Phase 5 — Dashboard**
One aggregate API endpoint (`/api/dashboard/summary`), not client-side filtering of the full dataset:
- Total Applications — `COUNT(*)` on applications
- Active Pipeline Count — `COUNT(*) WHERE status IN ('Bookmarked','Applied','Screening','Interviewing')`
- Total Interviews Scheduled — `COUNT(*)` on interviews
- Offer Rate / Rejection Rate — `COUNT(status = X) / COUNT(status != 'Bookmarked')`, as percentages

Plus three live views, the direct equivalents of the sheet's `QUERY`/`FILTER` formulas:
- **Follow-ups this week:** `WHERE follow_up_date BETWEEN CURDATE() AND CURDATE() + 7 AND status NOT IN ('Rejected','Withdrawn','Offer Received') ORDER BY follow_up_date ASC`
- **Upcoming interviews:** `WHERE interview_datetime >= NOW() ORDER BY interview_datetime ASC`
- **Grouped by status:** `SELECT status, COUNT(*) FROM applications GROUP BY status`

**Phase 6 — Polish**
Empty states for all three views, loading/error states on every form, mobile-responsive layout, seed script with 2–3 demo rows (see EXAMPLES).

## END GOAL
`npm run dev` produces a working app where: Applications and Interviews are both full CRUD with enum-validated fields and correctly colored badges; picking an Application ID on the Interview form live-fills Company/Job Title; the Dashboard shows all 5 KPIs plus the 3 live views, sourced from real aggregate queries; the DB is seeded and demoable immediately; the UI is usable on mobile; the repo is ready to push to `{{DEPLOYMENT}}`.

---

## DO
- Validate every form against schemas (e.g. `zod`) that mirror the enum lists exactly — reject invalid values client- *and* server-side.
- Auto-generate `app_code` / `int_code` server-side on create. Never expose them as editable text inputs.
- Define every enum list **once** (e.g. `constants/enums.ts`) and import it everywhere: form, badge colorizer, validation schema, seed script. No copy-pasted option lists.
- Keep `days_since_applied` fully computed, per Phase 3 — never persisted.
- Make the Interview form's Application ID field a constrained, searchable select — it must be impossible to create an interview pointing at a nonexistent application.
- Use the exact hex tokens above for status/outcome so the web app visually matches the spreadsheet version.

## DON'T
- Don't let `application_id` on `interviews` skip the foreign-key constraint — enforce it at the DB level, not only in the UI.
- Don't store Company Name / Job Title on `interviews` as copied text — join through the relation instead.
- Don't build Status/Outcome as free-text inputs — they must be constrained selects.
- Don't filter the Dashboard client-side against the full dataset — use aggregate queries so it stays fast as data grows.
- Don't skip loading/error states on the CRUD forms — this tool tracks something stressful; a form that fails silently is worse here than in a typical app.
- Don't add authentication, file uploads, email reminders, or multi-user sharing in this pass — see NARROWING.

## EXAMPLES

Seed data (mirrors the spreadsheet's example row):
```json
{
  "applications": [{
    "app_code": "APP-001",
    "company_name": "Acme Robotics",
    "job_title": "Embedded Firmware Engineer",
    "role_type": "Full-Time",
    "work_mode": "Hybrid",
    "location_details": "Kochi, Kerala, India",
    "salary_range": "₹18L - ₹22L / yr",
    "application_date": "2026-08-20",
    "application_source": "LinkedIn",
    "referral_contact": "Priya Menon",
    "status": "Applied",
    "follow_up_date": "2026-09-20"
  }],
  "interviews": [{
    "int_code": "INT-001",
    "application_id": 1,
    "round_type": "Technical / Coding",
    "interview_datetime": "2026-09-25T15:00:00",
    "interviewers": "Arjun Nair - Engineering Manager",
    "outcome": "Pending Feedback",
    "thank_you_sent": false
  }]
}
```

---

## NARROWING / CONSTRAINTS
- Stack is `{{STACK}}` — if you swap it, keep the schema, enums, computed-field logic, and color tokens identical.
- `{{AUTH}}` — no login in this pass. Structure the schema so a future `user_id` FK can be added to both tables without a rewrite.
- **Out of scope for v1** (note as "Phase 2" in a README, don't build now): resume/file attachments, email/SMS reminders, calendar sync, multi-user sharing.
- Don't introduce any library or framework outside `{{STACK}}` without flagging it first.
