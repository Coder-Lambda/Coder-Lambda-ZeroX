# ZeroX

Business management app sold to many niches. Formerly "Dahjon": the single-client predecessor is frozen at
tag `dahjon-v1.0` in `Coder-Lambda/DhajonWebv1` and is the reference for business rules in later prompts.

Stack: React + Vite + TypeScript, Tailwind v4 (mapped onto CSS-variable tokens), react-router, lucide-react, Outfit.
UI language: Brazilian Portuguese. All strings live in `src/core/i18n/pt-BR.ts`.

## Architecture: one base, many isolated clients

- **Base** = everything in `src/` except `src/extensions/`. Only generic features, themes and modules.
  A bug in the base is fixed here and reaches every client.
- **Client config (data)** = one `ClientConfig` per business, written by the onboarding, stored per `tenant_id`
  (= clientId) and `business_id`. Today in localStorage (`src/core/data/localDb.ts`), later Supabase.
- **Client extensions (code)** = `src/extensions/<clientId>/index.ts`, exporting a `ClientExtension`
  (`src/core/extensions/types.ts`): extra routes, widgets, label overrides. A client-only bug is fixed only there.
- **The base never imports from `src/extensions`.** Vite aliases `@client-extension` to the current client's
  extension (or `src/core/extensions/empty.ts`), loaded lazily. ESLint rule `zerox/base-boundary` enforces this.
- **Client registry** = `clients/<clientId>.json` (clientId, name, theme, enabledModules, hostingUrl,
  supabaseProjectRef, baseVersion, notes). No secrets in the repo.
- **Per-client build/deploy**: `VITE_CLIENT_ID` picks the client. Add `dev:<id>` / `build:<id>` scripts per client;
  each builds to `dist/<id>` and deploys on its own.
- **Data isolation**: every table/row carries `tenant_id` (and `business_id`). See `supabase/schema.draft.sql`.
- No per-client forks of the base.

## Design

- `docs/design/icy.md` rules surfaces, layout, color tokens and type (Outfit, weights ≤ 600, liquid glass, blobs).
- `docs/design/uxstyling.md` recipes are used for controls (tactile buttons, chips, debossed wells), recolored with tokens.
- `docs/design/interactions.md` rules motion (60ms press / 400ms springy release, only the 3 easing tokens).
- Themes (all dark glass): mono (pre-onboarding), dolphin, blackwidow, frog, wolf — `src/core/styles/tokens.css`.
- Components never contain hex values; they read tokens. A new theme is a new block of variables.

## Build order (one prompt each)

&onboarding& (done) → &collaborations& (done) → &personalfinance& (done) → &stock& (done) → &businessfinance& (done) → &rulesandactions& →
&widgets& → &maindashboard& → &whatisleft&. Each prompt fills its own module; a built module sets `Page` in
`src/core/modules/registry.ts`, the others show their placeholder shell.

- Collaborators (`src/core/modules/collaborators/`): employees (sheet import, filters, card with 7 widgets,
  warnings, files, PDF, presence list), partners, suppliers. `collaboratorStats()` in its `store.ts` is what
  &maindashboard& reads (total employees, payroll, average salary, absences today/month).
- Finance (`src/core/modules/finance/`): `FinancePage` takes a `book` ('personal' | 'business'); rows carry `book`,
  so &businessfinance& reuses the same accounts/entries/titles tables and page, adding employee payments.
  `financeSummary()` in its `store.ts` is what &maindashboard& reads. Paying a title creates its entry.
- Business finance (`src/core/modules/finance/business/`): same engine, book 'business', shared page wiring via
  `useFinanceController`. Parts: 1 Contas bancárias, 2+3 Receitas e despesas (labels = `fin_categories` with
  description/origin; entries carry `party`). Expenses also show payroll (from Colaboradores) and stock purchases
  (receipts with `price` in Estoque); paying them creates entries with `source`/`sourceRef`. `businessSummary()`
  is what &maindashboard& reads.
- Stock (`src/core/modules/stock/`): products + moves (in / out / adjust). Quantity = initialQuantity + moves;
  editing a quantity records an adjustment so history and charts stay true. `stockSummary()` is what &maindashboard&
  reads. Extra navbar tabs a client orders come from its extension's `moduleTabs.stock` (see `src/extensions/demo`).
- Shared building blocks live in `src/core/ui` (MonthSwitch, StatTile, TextInput, Dialog, charts…) and
  `src/core/styles/ui.css` (module navbar, lists, month switch). Module CSS files only hold module-specific rules,
  because they load lazily with their module.
- Charts (`src/core/ui/charts/`): hand-built SVG/HTML per the dataviz skill (line + crosshair, grouped columns,
  ranked bars, table twin). Series colors `--series-1/2` were validated against every theme's card surface;
  single-series charts use `--chart-accent`.
- Data hooks: `useTable()` (src/core/data/useTable.ts) re-reads on every write; files go to IndexedDB (`fileStore`).

## Commands

- `npm run dev:demo` / `npm run build:demo`
- `npm run lint` (tsc + eslint)
