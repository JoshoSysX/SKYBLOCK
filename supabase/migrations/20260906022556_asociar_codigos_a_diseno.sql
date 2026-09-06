alter table public.codigos_autenticidad drop constraint if exists codigos_autenticidad_coleccion_serie_key;
drop index if exists public.codigos_autenticidad_coleccion_serie_key;
create unique index if not exists codigos_autenticidad_producto_serie_idx
  on public.codigos_autenticidad(producto_id, numero_serie)
  where producto_id is not null;

drop function if exists public.verificar_codigo_autenticidad(text);
create function public.verificar_codigo_autenticidad(codigo_hash text)
returns table(numero_serie text, coleccion text, diseno text, unidades_limitadas integer, propietario_nombre text, estado text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select ca.numero_serie, c.nombre, p.nombre, p.unidades_limitadas,
         ca.propietario_nombre, ca.estado
  from public.codigos_autenticidad ca
  join public.colecciones c on c.id = ca.coleccion_id
  left join public.productos p on p.id = ca.producto_id
  where codigo_hash ~ '^[0-9a-fA-F]{64}$'
    and ca.codigo_hmac = decode(lower(codigo_hash), 'hex')
  limit 1
$$;

revoke all on function public.verificar_codigo_autenticidad(text) from public;
grant execute on function public.verificar_codigo_autenticidad(text) to anon, authenticated;
