# Arquitectura del proyecto

## Frontend

### Puente React/Vite

`src/` contiene el punto de entrada de la aplicación:

- `App.tsx`: carga la página visual solicitada, actualiza metadatos SEO, consulta datos públicos y atiende las acciones del panel administrativo.
- `lib/supabase.ts`: crea el cliente público de Supabase con variables `VITE_`.
- `index.css`: estilos mínimos del contenedor que presenta la interfaz.

### Interfaz visual

`public/legacy/` es el frontend que ve la persona visitante:

- archivos `.html`: páginas de inicio, catálogo, colecciones, productos, publicaciones y administración;
- `css/styles.css`: estilos visuales y responsive;
- `js/`: interacción de cada página y el puente de comunicación con React;
- `assets/image/`: recursos visuales utilizados por esas páginas.

`vercel.json` publica las rutas limpias, conserva las páginas internas en `/legacy/` para el iframe y define la caché de recursos estáticos.

## Backend

`supabase/` contiene exclusivamente código que se ejecuta o se aplica en Supabase:

- `migrations/`: esquema PostgreSQL, políticas RLS, validaciones y cambios de datos. No se deben borrar migraciones ya aplicadas.
- `functions/contact-submit/`: endpoint para mensajes de contacto.
- `functions/cloudinary-signature/`: firma segura para subir imágenes a Cloudinary.
- `functions/cloudinary-delete/`: eliminación autenticada de recursos en Cloudinary.

## Flujo de datos

1. La persona abre una ruta pública, por ejemplo `/colecciones`.
2. React carga `/legacy/colecciones.html` dentro del iframe.
3. El script `supabase-bridge.js` solicita datos al contenedor React.
4. React consulta Supabase y devuelve productos, colecciones y publicaciones mediante `postMessage` del mismo origen.
5. Las acciones del panel vuelven al contenedor React, que valida la sesión y escribe en Supabase o invoca una función Edge.

## Límites de seguridad

- Variables `VITE_`: solo URL pública y anon key de Supabase.
- Secretos de Cloudinary, HMAC, correo y servicio: únicamente en secretos/configuración de Supabase.
- No se exponen claves de servicio ni tokens privados en `public/` o `src/`.
