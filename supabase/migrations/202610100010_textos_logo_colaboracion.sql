alter table public.colaboraciones
  add column if not exists logo_meta text not null default 'COLABORACIÓN / SKYBLOCK',
  add column if not exists logo_pie text not null default 'IDENTIDAD COLABORATIVA';
