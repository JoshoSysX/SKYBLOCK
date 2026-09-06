update public.productos
set moneda = 'PEN',
    actualizado_en = now()
where moneda is distinct from 'PEN';;
