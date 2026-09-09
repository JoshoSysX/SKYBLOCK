-- Las operaciones administrativas requieren rol autorizado y una sesión AAL2.
create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.roles_usuario
      where usuario_id = (select auth.uid())
        and rol in ('administrador', 'superadministrador')
    );
$$;

revoke all on function public.es_administrador() from public;
grant execute on function public.es_administrador() to authenticated;
