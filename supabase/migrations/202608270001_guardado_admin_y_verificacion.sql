alter table public.codigos_autenticidad
  add column if not exists propietario_nombre text;

create or replace function public.verificar_codigo_autenticidad(codigo_hash text)
returns table(numero_serie text, coleccion text, propietario_nombre text, estado text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select ca.numero_serie, c.nombre, ca.propietario_nombre, ca.estado
  from public.codigos_autenticidad ca
  join public.colecciones c on c.id = ca.coleccion_id
  where codigo_hash ~ '^[0-9a-fA-F]{64}$'
    and ca.codigo_hmac = decode(lower(codigo_hash), 'hex')
  limit 1
$$;

revoke all on function public.verificar_codigo_autenticidad(text) from public;
grant execute on function public.verificar_codigo_autenticidad(text) to anon, authenticated;
