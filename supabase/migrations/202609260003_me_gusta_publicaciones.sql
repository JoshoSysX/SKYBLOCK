-- Un "me gusta" anónimo por dispositivo y publicación.
create table if not exists public.me_gusta_publicaciones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  dispositivo_id uuid not null,
  creado_en timestamptz not null default now(),
  unique (publicacion_id, dispositivo_id)
);

create index if not exists me_gusta_publicaciones_publicacion_idx
  on public.me_gusta_publicaciones (publicacion_id);

alter table public.me_gusta_publicaciones enable row level security;
revoke all on public.me_gusta_publicaciones from anon, authenticated;

create or replace function public.resumen_me_gusta_publicaciones(
  p_publicaciones uuid[],
  p_dispositivo uuid
)
returns table (publicacion_id uuid, total bigint, marcado boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    publicacion.id,
    count(me_gusta.id)::bigint as total,
    coalesce(bool_or(me_gusta.dispositivo_id = p_dispositivo), false) as marcado
  from public.publicaciones as publicacion
  left join public.me_gusta_publicaciones as me_gusta on me_gusta.publicacion_id = publicacion.id
  where publicacion.id = any(p_publicaciones)
    and publicacion.estado = 'publicado'
    and publicacion.publicado_en <= now()
  group by publicacion.id;
$$;

create or replace function public.alternar_me_gusta_publicacion(
  p_publicacion uuid,
  p_dispositivo uuid
)
returns table (total bigint, marcado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_marcado boolean;
begin
  if not exists (
    select 1
    from public.publicaciones
    where id = p_publicacion
      and estado = 'publicado'
      and publicado_en <= now()
  ) then
    raise exception 'Publicación no disponible';
  end if;

  delete from public.me_gusta_publicaciones
  where publicacion_id = p_publicacion
    and dispositivo_id = p_dispositivo;

  if found then
    v_marcado := false;
  else
    insert into public.me_gusta_publicaciones (publicacion_id, dispositivo_id)
    values (p_publicacion, p_dispositivo)
    on conflict (publicacion_id, dispositivo_id) do nothing;
    v_marcado := true;
  end if;

  return query
  select count(*)::bigint, v_marcado
  from public.me_gusta_publicaciones
  where publicacion_id = p_publicacion;
end;
$$;

revoke all on function public.resumen_me_gusta_publicaciones(uuid[], uuid) from public;
revoke all on function public.alternar_me_gusta_publicacion(uuid, uuid) from public;
grant execute on function public.resumen_me_gusta_publicaciones(uuid[], uuid) to anon, authenticated;
grant execute on function public.alternar_me_gusta_publicacion(uuid, uuid) to anon, authenticated;
