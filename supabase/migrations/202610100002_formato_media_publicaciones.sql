alter table public.publicaciones
  add column if not exists formato_media text not null default 'portrait'
  check (formato_media in ('square', 'landscape', 'portrait'));

update public.publicaciones
set formato_media = 'portrait'
where formato_media is null;
