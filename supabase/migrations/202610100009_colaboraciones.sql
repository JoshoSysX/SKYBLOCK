create table public.colaboraciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  descripcion text not null,
  historia text not null,
  estado public.estado_contenido not null default 'borrador',
  publicado_en timestamptz,
  logo_ajuste_x numeric not null default 50 check (logo_ajuste_x between 0 and 100),
  logo_ajuste_y numeric not null default 50 check (logo_ajuste_y between 0 and 100),
  logo_zoom numeric not null default 1 check (logo_zoom between .5 and 2),
  creado_por uuid references auth.users(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table public.colaboracion_colecciones (
  colaboracion_id uuid not null references public.colaboraciones(id) on delete cascade,
  coleccion_id uuid not null references public.colecciones(id) on delete restrict,
  primary key (colaboracion_id, coleccion_id)
);
alter table public.imagenes add column colaboracion_id uuid references public.colaboraciones(id) on delete cascade;
alter table public.imagenes drop constraint if exists imagenes_check;
alter table public.imagenes add constraint imagenes_unica_relacion check (num_nonnulls(producto_id,coleccion_id,publicacion_id,colaboracion_id)=1);
create trigger colaboraciones_actualizadas before update on public.colaboraciones for each row execute function public.establecer_actualizado_en();
create index colaboraciones_publicas_idx on public.colaboraciones(estado,publicado_en desc);
create index colaboracion_colecciones_coleccion_idx on public.colaboracion_colecciones(coleccion_id);
alter table public.colaboraciones enable row level security;
alter table public.colaboracion_colecciones enable row level security;
grant select on public.colaboraciones, public.colaboracion_colecciones to anon, authenticated;
grant insert, update, delete on public.colaboraciones, public.colaboracion_colecciones to authenticated;
create policy colaboraciones_publicadas on public.colaboraciones for select to anon, authenticated using (estado='publicado');
create policy colaboraciones_administracion on public.colaboraciones for all to authenticated using ((select public.es_administrador())) with check ((select public.es_administrador()));
create policy colaboracion_colecciones_publicas on public.colaboracion_colecciones for select to anon, authenticated using (exists (select 1 from public.colaboraciones c where c.id=colaboracion_id and c.estado='publicado'));
create policy colaboracion_colecciones_administracion on public.colaboracion_colecciones for all to authenticated using ((select public.es_administrador())) with check ((select public.es_administrador()));
drop policy if exists imagenes_lectura_publica on public.imagenes;
create policy imagenes_lectura_publica on public.imagenes for select to anon,authenticated using(
  (producto_id is not null and exists(select 1 from public.productos p where p.id=producto_id and p.estado='publicado')) or
  (coleccion_id is not null and exists(select 1 from public.colecciones c where c.id=coleccion_id and c.estado='publicado')) or
  (publicacion_id is not null and exists(select 1 from public.publicaciones p where p.id=publicacion_id and p.estado='publicado')) or
  (colaboracion_id is not null and exists(select 1 from public.colaboraciones c where c.id=colaboracion_id and c.estado='publicado'))
);
