alter table public.modo_proteccion
  add column if not exists color_acento text not null default '#1996ff';

update public.modo_proteccion
set color_acento = '#1996ff'
where color_acento is null;
