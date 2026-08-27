grant insert on table public.mensajes_contacto to anon, authenticated;
revoke execute on function public.es_administrador() from anon;

create policy mensajes_contacto_envio_publico
on public.mensajes_contacto
for insert
to anon, authenticated
with check (
  char_length(trim(nombre)) between 2 and 100
  and char_length(trim(correo)) between 5 and 254
  and correo like '%@%'
  and char_length(trim(asunto)) between 2 and 160
  and char_length(trim(mensaje)) between 5 and 4000
  and estado = 'nuevo'
  and respondido_por is null
  and respondido_en is null
);
