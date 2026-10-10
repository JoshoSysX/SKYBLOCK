-- Varios accesos opcionales para el perfil público de Posts.
alter table public.perfil_editorial
  add column if not exists etiquetas jsonb not null default '[]'::jsonb
  check (jsonb_typeof(etiquetas) = 'array' and jsonb_array_length(etiquetas) <= 6);
