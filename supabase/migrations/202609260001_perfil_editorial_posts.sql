create table if not exists public.perfil_editorial (
  id boolean primary key default true check (id),
  nombre text not null default 'SKYBLOCK STUDIO' check (char_length(nombre) <= 80),
  biografia text not null default '' check (char_length(biografia) <= 280),
  ubicacion text not null default '' check (char_length(ubicacion) <= 100),
  intereses text not null default '' check (char_length(intereses) <= 160),
  avatar_url text,
  portada_url text,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users(id)
);

alter table public.perfil_editorial enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'perfil_editorial' and policyname = 'perfil_editorial_publico') then
    create policy perfil_editorial_publico on public.perfil_editorial for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'perfil_editorial' and policyname = 'perfil_editorial_admin') then
    create policy perfil_editorial_admin on public.perfil_editorial for all to authenticated
      using ((select public.es_administrador()))
      with check ((select public.es_administrador()));
  end if;
end $$;

insert into public.perfil_editorial (id)
values (true)
on conflict (id) do nothing;
