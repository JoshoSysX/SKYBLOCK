-- Acceso opcional que el administrador puede mostrar en el perfil público de Posts.
alter table public.perfil_editorial
  add column if not exists etiqueta_titulo text not null default '' check (char_length(etiqueta_titulo) <= 48),
  add column if not exists etiqueta_url text not null default '' check (char_length(etiqueta_url) <= 500);
