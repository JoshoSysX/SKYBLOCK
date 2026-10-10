alter table public.mensajes_contacto
  alter column correo drop not null;

alter table public.mensajes_contacto
  add column if not exists canal_contacto text not null default 'correo'
  check (canal_contacto in ('correo', 'telefono'));

update public.mensajes_contacto
set canal_contacto = 'correo'
where canal_contacto is null;
