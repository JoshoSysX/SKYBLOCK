# SKYBLOCK STUDIO

Aplicación React, Vite y TypeScript para SKYBLOCK STUDIO. Conserva la dirección editorial del sitio HTML original y prepara Supabase Auth/PostgreSQL, Cloudinary y Resend sin incluir secretos.

## Inicio

1. Usa Node.js 22 o superior.
2. Copia `.env.example` a `.env.local` y completa el entorno.
3. Ejecuta `npm install` y `npm run dev`.
4. Aplica `supabase/migrations/202608260001_esquema_inicial.sql` en un proyecto nuevo.

Las variables `VITE_` son públicas. Las claves secretas de Supabase, Cloudinary, Resend, Turnstile y HMAC solo pueden existir en endpoints del servidor.

Configura Site URL, redirect URLs exactas y verificación por correo en Supabase Auth. Crea el primer `superadministrador` desde SQL Editor usando el UUID de un usuario ya verificado; nunca expongas esa operación al cliente. Las rutas privadas de firma Cloudinary, contacto, autenticidad y correo deben validar JWT, rol, Zod y rate limiting.

Antes de producción reemplaza `example.com` en `robots.txt`, configura sitemap, canonical, SPF/DKIM/DMARC, CSP, HSTS, CORS exacto, Turnstile, MFA de administradores y backups. Ejecuta lint, pruebas y build.
