-- Migration: create vision_insights table for Gemini Vision pipeline
-- Created: 2025-10-14

create table if not exists public.vision_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  image_hash text not null,
  storage_path text,
  status text not null default 'processing',
  model text not null default 'gemini-1.5-flash',
  prompt_version text not null default 'vision_insight_v1',
  raw_response jsonb,
  normalized_insight jsonb,
  cost_tokens_in integer default 0,
  cost_tokens_out integer default 0,
  cost_usd numeric(10,4) default 0,
  latency_ms integer,
  cache_hit boolean default false,
  error_message text,
  created_at timestamptz default timezone('utc', now()) not null,
  processed_at timestamptz,
  constraint vision_insights_unique unique (user_id, image_hash)
);

create index if not exists vision_insights_user_created_idx on public.vision_insights (user_id, created_at desc);
create index if not exists vision_insights_hash_idx on public.vision_insights (image_hash);

alter table public.vision_insights enable row level security;

drop policy if exists "Users select own vision insights" on public.vision_insights;
drop policy if exists "Users insert own vision insights" on public.vision_insights;
drop policy if exists "Service updates vision insights" on public.vision_insights;

create policy "Users select own vision insights"
  on public.vision_insights
  for select
  using (auth.uid() = user_id);

create policy "Users insert own vision insights"
  on public.vision_insights
  for insert
  with check (auth.uid() = user_id);

create policy "Service updates vision insights"
  on public.vision_insights
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service deletes vision insights"
  on public.vision_insights
  for delete
  using (auth.role() = 'service_role');

comment on table public.vision_insights is 'Cache de resultados Gemini Vision con insights normalizados y costes asociados.';
comment on column public.vision_insights.normalized_insight is 'JSON schema vision_insight_v1 con ingredientes, acciones y metadatos.';
comment on column public.vision_insights.raw_response is 'Respuesta completa de Gemini Vision para auditoría y debugging.';
