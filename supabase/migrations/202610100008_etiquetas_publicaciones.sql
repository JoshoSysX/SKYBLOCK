-- Etiquetas con enlaces, independientes para cada publicación.
alter table public.publicaciones
  add column if not exists etiquetas jsonb not null default '[]'::jsonb
  check (jsonb_typeof(etiquetas) = 'array' and jsonb_array_length(etiquetas) <= 6);
