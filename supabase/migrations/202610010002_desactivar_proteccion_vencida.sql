-- Desactiva únicamente el modo de protección cuya cuenta regresiva ya terminó.
-- Es segura para invocarse desde visitantes: no acepta parámetros ni modifica otra configuración.
create or replace function public.desactivar_modo_proteccion_vencido()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  filas_actualizadas integer;
begin
  update public.modo_proteccion
     set activo = false,
         actualizado_en = now()
   where id = true
     and activo = true
     and mostrar_cuenta_regresiva = true
     and finaliza_en is not null
     and finaliza_en <= now();

  get diagnostics filas_actualizadas = row_count;
  return filas_actualizadas > 0;
end;
$$;

revoke all on function public.desactivar_modo_proteccion_vencido() from public;
grant execute on function public.desactivar_modo_proteccion_vencido() to anon, authenticated;
