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

&onboarding& (done) → &collaborations& → &personalfinance& → &stock& → &businessfinance& → &rulesandactions& →
&widgets& → &maindashboard& → &whatisleft&. Each prompt fills its own module; module placeholders live in
`src/core/modules/`.

## Commands

- `npm run dev:demo` / `npm run build:demo`
- `npm run lint` (tsc + eslint)
