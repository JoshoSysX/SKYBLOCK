drop policy if exists productos_lectura_publica on public.productos;

create policy productos_lectura_publica
on public.productos
for select
to anon, authenticated
using (estado in ('publicado', 'archivado'));
