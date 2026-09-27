-- Mantiene los likes protegidos y expone únicamente su total a administradores.
create or replace function public.conteo_me_gusta_publicaciones()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_administrador() then
    raise exception 'Acceso administrativo requerido';
  end if;

  return (select count(*)::bigint from public.me_gusta_publicaciones);
end;
$$;

revoke all on function public.conteo_me_gusta_publicaciones() from public;
grant execute on function public.conteo_me_gusta_publicaciones() to authenticated;
