alter table public.modo_proteccion
  add column if not exists desenfoque_fondo smallint not null default 4
  check (desenfoque_fondo between 0 and 20);

update public.modo_proteccion
set desenfoque_fondo = 4
where desenfoque_fondo is null;

create or replace view public.modo_proteccion_publico as
select id, activo, titulo, descripcion, mostrar_cuenta_regresiva, finaliza_en,
  fondo_url, fondo_identificador_publico, color_acento, requiere_contrasena,
  actualizado_en, desenfoque_fondo
from public.modo_proteccion;

grant select on public.modo_proteccion_publico to anon, authenticated;
