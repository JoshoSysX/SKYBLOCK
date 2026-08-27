import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
const links = [
  ['/', 'Inicio'],
  ['/catalogo', 'Catálogo'],
  ['/colecciones', 'Colecciones'],
  ['/posts', 'Posts'],
  ['/nosotros', 'Nosotros'],
  ['/verificar', 'Autenticidad'],
]
const classes: Record<string, string> = {
  '/': 'home-page',
  '/catalogo': 'catalog-page',
  '/colecciones': 'collections-page',
  '/posts': 'posts-page',
  '/nosotros': 'about-page',
  '/contacto': 'contact-page',
  '/verificar': 'verify-page',
}
export function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    document.body.className = classes[pathname] || ''
    return () => {
      document.body.className = ''
    }
  }, [pathname])
  return (
    <>
      <header className={`nav ${pathname === '/' ? '' : 'catalog-nav'}`}>
        <Link className="brand" to="/">
          SKYBLOCK<small>STUDIO</small>
        </Link>
        <nav className="desktop-nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
          <Link to="/admin">Admin</Link>
        </nav>
        <div className="nav-actions">
          <Link className="auth-action" to="/login">
            <i className="auth-icon" />
            <span>Login</span>
          </Link>
          <Link className="auth-action" to="/login">
            <i className="auth-icon auth-icon-plus" />
            <span>Registro</span>
          </Link>
          <button onClick={() => setOpen(!open)} aria-label="Abrir menú" aria-expanded={open}>
            <span />
            <span />
          </button>
        </div>
      </header>
      <nav className={`mobile-nav ${open ? 'open' : ''}`}>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
        <Link to="/admin">Admin</Link>
        <Link to="/login">Iniciar sesión</Link>
        <Link to="/login">Crear cuenta</Link>
      </nav>
      <main>
        <Outlet />
      </main>
      <footer>
        <div className="footer-brand">
          <Link className="brand" to="/">
            SKYBLOCK<small>STUDIO</small>
          </Link>
          <p>CONSTRUYE. CREA. DOMINA.</p>
          <div className="social">◎ ♪ ▷ ◇</div>
        </div>
        <div className="footer-col">
          <h4>Tienda</h4>
          <Link to="/catalogo">Todos los productos</Link>
          <Link to="/catalogo#sudaderas">Sudaderas</Link>
          <Link to="/catalogo#camisetas">Camisetas</Link>
          <Link to="/catalogo#accesorios">Accesorios</Link>
        </div>
        <div className="footer-col">
          <h4>Colecciones</h4>
          <Link to="/colecciones">Colaboraciones</Link>
          <Link to="/colecciones">Recién llegados</Link>
          <Link to="/colecciones">Edición limitada</Link>
          <Link to="/colecciones">Archivo</Link>
        </div>
        <div className="footer-col">
          <h4>Empresa</h4>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/verificar">Verificar autenticidad</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/contacto">Envíos</Link>
        </div>
        <div className="footer-col">
          <h4>Síguenos</h4>
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
          <a href="#">YouTube</a>
          <a href="#">Discord</a>
        </div>
        <p className="copyright">
          © 2026 SKYBLOCK STUDIO
          <br />
          Todos los derechos reservados.
          <br />
          <br />
          Diseñado y desarrollado
          <br />
          con pasión.
        </p>
      </footer>
    </>
  )
}
