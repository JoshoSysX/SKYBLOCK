create extension if not exists pgcrypto with schema extensions;

alter table public.modo_proteccion
  add column if not exists requiere_contrasena boolean not null default false;

create table if not exists public.modo_proteccion_clave (
  id boolean primary key default true check (id),
  contrasena_hash text,
  actualizado_en timestamptz not null default now()
);

alter table public.modo_proteccion_clave enable row level security;

create or replace view public.modo_proteccion_publico as
select id, activo, titulo, descripcion, mostrar_cuenta_regresiva, finaliza_en,
  fondo_url, fondo_identificador_publico, color_acento, requiere_contrasena,
  actualizado_en
from public.modo_proteccion;

grant select on public.modo_proteccion_publico to anon, authenticated;

create or replace function public.configurar_contrasena_modo_proteccion(
  p_requiere boolean,
  p_contrasena text default null
) returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.es_administrador() then raise exception 'Acceso no autorizado'; end if;
  if p_requiere and (p_contrasena is null or length(trim(p_contrasena)) < 4) then
    raise exception 'La contraseña debe tener al menos 4 caracteres';
  end if;
  insert into public.modo_proteccion_clave (id, contrasena_hash, actualizado_en)
  values (true, case when p_requiere then extensions.crypt(p_contrasena, extensions.gen_salt('bf')) else null end, now())
  on conflict (id) do update set contrasena_hash = excluded.contrasena_hash, actualizado_en = excluded.actualizado_en;
end;
$$;

create or replace function public.verificar_contrasena_modo_proteccion(p_contrasena text)
returns boolean
language plpgsql security definer
set search_path = public, extensions
as $$
declare configuracion public.modo_proteccion%rowtype; secreto text;
begin
  select * into configuracion from public.modo_proteccion where id = true;
  if not configuracion.activo or not configuracion.requiere_contrasena then return true; end if;
  select contrasena_hash into secreto from public.modo_proteccion_clave where id = true;
  return secreto is not null and extensions.crypt(p_contrasena, secreto) = secreto;
end;
$$;

revoke all on function public.configurar_contrasena_modo_proteccion(boolean, text) from public;
grant execute on function public.configurar_contrasena_modo_proteccion(boolean, text) to authenticated;
revoke all on function public.verificar_contrasena_modo_proteccion(text) from public;
grant execute on function public.verificar_contrasena_modo_proteccion(text) to anon, authenticated;
