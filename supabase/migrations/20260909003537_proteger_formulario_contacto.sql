drop policy if exists mensajes_contacto_envio_publico on public.mensajes_contacto;

create table if not exists public.contacto_intentos (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  creado_en timestamptz not null default now()
);

alter table public.contacto_intentos enable row level security;
revoke all on table public.contacto_intentos from anon, authenticated;
grant all on table public.contacto_intentos to service_role;
grant usage, select on sequence public.contacto_intentos_id_seq to service_role;

create index if not exists contacto_intentos_ip_fecha_idx
  on public.contacto_intentos (ip_hash, creado_en desc);
