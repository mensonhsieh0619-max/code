# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step. Open `index.html` directly in any modern browser.

- **Reset demo data**: Click "重置 Demo 資料" in the sidebar, or clear `localStorage.removeItem('ai_health_platform_login_state_v2')` in the browser console.
- **Inspect state**: `JSON.parse(localStorage.getItem('ai_health_platform_login_state_v2'))` in browser DevTools.

## Architecture

Single-page application — three files only:

| File | Purpose |
|---|---|
| `index.html` | All HTML sections (~25 role-scoped views), no templating |
| `script.js` | All business logic (~1,558 lines, vanilla JS) |
| `style.css` | Styling with CSS variables, sidebar layout, responsive breakpoints |

No dependencies, no bundler, no framework.

### State Management

One global `state` object persisted to `localStorage`. All reads and writes go through `loadState()` / `saveState()`. The shape:

```
state.accounts            // user credentials and profiles
state.healthRecords       // vital observations (BP, weight, HR, steps, exercise)
state.authorizations      // data-sharing grants with expiry and scopes
state.registrations       // competition entries
state.trainingRecords     // coach → student records
state.nutritionRecords    // nutritionist → case records
state.blockchainLogs      // simulated immutable audit trail
state.notifications       // per-account notifications
state.currentAccount      // logged-in account or null
state.role                // "guest" | "user" | "coach" | "nutritionist" | "admin"
```

### Navigation & Permissions

`showSection(id)` controls which `<section>` is visible at a time. Role-gated nav items are defined in the `NAV_ITEMS` array and rendered by `applyRolePermissions()`, which sets `data-allowed` attributes and visibility on every nav/section that is role-restricted.

### Key Subsystems in `script.js`

- **Auth**: `loginAccount`, `registerAccount`, `demoLogin`, `logoutAccount`
- **Health data**: `submitHealthData`, uses `recordsByAccount(email)` for queries
- **FHIR generation**: `generateFHIRBundle(account, records)` — produces a FHIR R4 Bundle with Patient + Observation resources; called from the FHIR viewer section
- **AI analysis**: `runAIAnalysis()` — rule-based scoring (55–92 pts), produces risk level and 4-category advice
- **Charts**: `drawLineChart`, `drawBarChart`, `drawRangeChart` — all Canvas-based, redrawn on each render; `attachChartTooltip` for hover interactions
- **Authorization / QR**: `createAuthorization`, `isAuthorizationValid`, QR rendered via pseudo-random pixel algorithm (no external library)
- **Utilities**: `escapeHTML` (sanitize before innerHTML), `hashText` (simple hash for blockchain simulation), `nowText` (timestamp), `calculateBMI`

### Data Conventions

- Record IDs follow patterns: `HR-001`, `AUTH-YYYYMMDD-NNN`, `REG-001`
- Timestamps: `YYYY-MM-DD HH:mm` (24-hour)
- Permanent authorization stored as the string `"永久授權"` — check `isAuthorizationValid()` for the fallback parsing logic
- All user-supplied strings must pass through `escapeHTML()` before being written to `innerHTML`

### Roles & Default Demo Accounts

Four roles are pre-seeded via `initDefaultAccounts()`:

| Role | Login |
|---|---|
| 一般使用者 (user) | demo quick-login button |
| 健身教練 (coach) | demo quick-login button |
| 營養師 (nutritionist) | demo quick-login button |
| 系統管理員 (admin) | demo quick-login button |

Each role has its own dashboard section and a distinct set of visible nav items and data views.
