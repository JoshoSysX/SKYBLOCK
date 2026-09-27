-- Tamaño actual de PostgreSQL y límite del plan Free de este proyecto.
create or replace function public.estado_almacenamiento_base_datos()
returns table (usado_bytes bigint, limite_bytes bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_administrador() then
    raise exception 'Acceso administrativo requerido';
  end if;

  return query select pg_database_size(current_database())::bigint, (500::bigint * 1024 * 1024);
end;
$$;

revoke all on function public.estado_almacenamiento_base_datos() from public;
grant execute on function public.estado_almacenamiento_base_datos() to authenticated;
