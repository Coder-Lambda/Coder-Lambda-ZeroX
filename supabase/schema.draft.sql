-- ZeroX draft schema. NOT executed yet: data lives in localStorage (src/core/data/localDb.ts)
-- until Supabase is wired. Every table carries tenant_id (= clientId) so RLS can be added later
-- with a single policy shape: tenant_id = current client.

create table accounts (
  id          text primary key,
  tenant_id   text not null,
  display_name text not null,
  provider    text not null,              -- 'google'
  created_at  timestamptz not null default now()
);

create table client_configs (
  id               text primary key,      -- = business_id
  tenant_id        text not null,
  business_id      text not null,
  owner_account_id text not null references accounts (id),
  config           jsonb not null,        -- ClientConfig (theme, businessType, modules, layout, labels…)
  created_at       timestamptz not null default now()
);

create index client_configs_tenant_owner on client_configs (tenant_id, owner_account_id);

-- Module tables (collaborators, finance, stock…) follow the same pattern:
--   id, tenant_id, business_id, …
-- RLS (later): alter table … enable row level security;
--              create policy tenant_isolation on … using (tenant_id = current_setting('app.tenant_id'));
