alter table public.productos
  add column if not exists agotado_manual boolean not null default false;
