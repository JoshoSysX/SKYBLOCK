-- El perfil del feed solo utiliza nombre, descripción, avatar y portada.
-- Estas columnas dejaron de usarse en la interfaz y en el backend.
alter table public.perfil_editorial
  drop column if exists ubicacion,
  drop column if exists intereses;
