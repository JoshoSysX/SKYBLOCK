# SKYBLOCK STUDIO

Sitio de SKYBLOCK STUDIO construido con React/Vite como puente de datos y páginas editoriales HTML para la interfaz pública.

## Estructura

- `src/`: capa frontend React que gestiona SEO, sesión y comunicación entre la interfaz y Supabase.
- `public/legacy/`: frontend visual activo: páginas, estilos, scripts y recursos de la tienda.
- `supabase/`: backend: migraciones SQL y funciones Edge protegidas.
- `assets/image/PERFIL.jpg`: imagen de perfil usada por la capa React.

Consulta [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) para la separación completa entre frontend y backend.

## Inicio local

1. Usa Node.js 22 o superior.
2. Copia `.env.example` a `.env.local` y configura las variables públicas de Supabase.
3. Ejecuta `npm install` y `npm run dev`.
4. Para una base de datos nueva, aplica las migraciones dentro de `supabase/migrations/` en orden.

Las claves secretas de Supabase, Cloudinary, Resend, Turnstile y HMAC no deben existir en variables `VITE_` ni en el frontend.
