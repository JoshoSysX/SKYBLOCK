-- Todo producto nuevo o editado debe pertenecer a una colección.
-- NOT VALID conserva productos históricos sin colección, pero bloquea nuevos datos incompletos.
alter table public.productos
  drop constraint if exists productos_coleccion_obligatoria;

alter table public.productos
  add constraint productos_coleccion_obligatoria
  check (coleccion_id is not null) not valid;

-- Un producto solo es público si su colección también está publicada.
drop policy if exists productos_publicados on public.productos;
drop policy if exists productos_lectura_publica on public.productos;
create policy productos_lectura_publica
on public.productos
for select
to anon, authenticated
using (
  estado in ('publicado', 'archivado')
  and exists (
    select 1
    from public.colecciones c
    where c.id = productos.coleccion_id
      and c.estado = 'publicado'
  )
);

drop policy if exists tallas_lectura_publica on public.tallas_producto;
create policy tallas_lectura_publica
on public.tallas_producto
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.productos p
    join public.colecciones c on c.id = p.coleccion_id
    where p.id = tallas_producto.producto_id
      and p.estado in ('publicado', 'archivado')
      and c.estado = 'publicado'
  )
);

drop policy if exists imagenes_lectura_publica on public.imagenes;
create policy imagenes_lectura_publica
on public.imagenes
for select
to anon, authenticated
using (
  (
    producto_id is not null
    and exists (
      select 1
      from public.productos p
      join public.colecciones c on c.id = p.coleccion_id
      where p.id = imagenes.producto_id
        and p.estado in ('publicado', 'archivado')
        and c.estado = 'publicado'
    )
  )
  or (
    coleccion_id is not null
    and exists (
      select 1 from public.colecciones c
      where c.id = imagenes.coleccion_id and c.estado = 'publicado'
    )
  )
  or (
    publicacion_id is not null
    and exists (
      select 1 from public.publicaciones p
      where p.id = imagenes.publicacion_id and p.estado = 'publicado'
    )
  )
);

comment on column public.productos.materiales is
  'Material, composición y acabados específicos del diseño mostrados en la ficha pública.';
