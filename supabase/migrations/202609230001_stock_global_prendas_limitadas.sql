-- Las tallas indican disponibilidad; el stock restante de una edición limitada
-- se administra en un único campo del producto.
alter table public.productos
  add column if not exists stock_disponible integer
  check (stock_disponible is null or stock_disponible >= 0);

alter table public.productos
  add column if not exists stock_por_talla boolean not null default false;

alter table public.productos
  add column if not exists stock_ilimitado boolean not null default false;

-- Conserva el inventario existente al migrar desde el stock por talla.
update public.productos p
set stock_disponible = coalesce((
  select sum(t.stock)
  from public.tallas_producto t
  where t.producto_id = p.id
), 0)
where p.es_limitado
  and p.stock_disponible is null;

-- Los productos regulares existentes no tenían límite de unidades.
update public.productos
set stock_ilimitado = true
where not es_limitado;

alter table public.productos
  drop constraint if exists productos_stock_limitado_valido;
alter table public.productos
  add constraint productos_stock_limitado_valido
  check (
    (es_limitado and not stock_ilimitado and (
      (stock_por_talla and stock_disponible is null)
      or (not stock_por_talla and stock_disponible is not null and stock_disponible <= unidades_limitadas)
    ))
    or (not es_limitado and (
      (stock_ilimitado and not stock_por_talla and stock_disponible is null)
      or (not stock_ilimitado and stock_por_talla and stock_disponible is null)
      or (not stock_ilimitado and not stock_por_talla and stock_disponible is not null)
    ))
  );
