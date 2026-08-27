alter table public.codigos_autenticidad alter column producto_id drop not null;
alter table public.codigos_autenticidad drop constraint codigos_autenticidad_producto_id_numero_serie_key;
alter table public.codigos_autenticidad add constraint codigos_autenticidad_coleccion_serie_key unique (coleccion_id, numero_serie);
