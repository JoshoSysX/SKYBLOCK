-- Solo los administradores pueden leer esta columna mediante la política RLS
-- existente de codigos_autenticidad. El HMAC sigue siendo la única referencia
-- usada por la verificación pública.
alter table public.codigos_autenticidad
  add column if not exists codigo_admin text;

alter table public.codigos_autenticidad
  add constraint codigos_autenticidad_codigo_admin_formato
  check (codigo_admin is null or length(trim(codigo_admin)) between 1 and 32);
