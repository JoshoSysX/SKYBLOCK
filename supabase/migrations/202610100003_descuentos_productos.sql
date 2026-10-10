alter table public.productos
  add column if not exists precio_original numeric(10,2),
  add column if not exists descuento_porcentaje numeric(5,2) not null default 0
    check (descuento_porcentaje between 0 and 100);

update public.productos
set precio_original = precio
where precio_original is null;

alter table public.productos
  alter column precio_original set not null;
