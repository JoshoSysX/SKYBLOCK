-- Pantalla de protección global: una única configuración editable por administradores.
create table if not exists public.modo_proteccion (
  id boolean primary key default true check (id),
  activo boolean not null default false,
  titulo text not null default 'Volvemos pronto',
  descripcion text not null default '',
  mostrar_cuenta_regresiva boolean not null default false,
  finaliza_en timestamptz,
  fondo_url text,
  fondo_identificador_publico text,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users(id)
);

insert into public.modo_proteccion (id) values (true) on conflict (id) do nothing;

alter table public.modo_proteccion enable row level security;

create policy modo_proteccion_lectura_publica
on public.modo_proteccion for select
to anon, authenticated
using (true);

create policy modo_proteccion_administracion
on public.modo_proteccion for all
to authenticated
using ((select public.es_administrador()))
with check ((select public.es_administrador()));
