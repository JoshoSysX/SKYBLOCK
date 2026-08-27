import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { products } from '../data/demo'
export function Home() {
  const logo = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useEffect(() => {
    document.querySelectorAll('.reveal').forEach((n) => n.classList.add('visible'))
    let y = 0,
      x = -4,
      drag = false,
      lx = 0,
      ly = 0
    const el = logo.current
    if (!el) return
    const down = (e: PointerEvent) => {
      drag = true
      lx = e.clientX
      ly = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      y += (e.clientX - lx) * 0.3
      x = Math.max(-55, Math.min(55, x - (e.clientY - ly) * 0.2))
      lx = e.clientX
      ly = e.clientY
      el.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`
    }
    const up = () => {
      drag = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
  }, [])
  return (
    <>
      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-editorial reveal">
          <div className="hero-editorial-title hero-editorial-skyblock">
            <h1>SKYBLOCK</h1>
            <p>IN TARAPOTO</p>
          </div>
          <div className="hero-editorial-title hero-editorial-risk">
            <h2>SIN RIESGO</h2>
            <p>NO HAY GANANCIA</p>
          </div>
        </div>
      </section>
      <section className="hologram-section reveal">
        <div ref={logo} className="hologram-stage skb-hologram-stage image-logo-stage">
          <img
            className="skb-logo-image"
            src="/skb-logo-black-3d.png"
            alt="Logotipo oficial SKB de SKYBLOCK STUDIO"
            draggable="false"
          />
        </div>
        <div className="hologram-caption">
          <span>Logotipo oficial / 001</span>
          <strong>SKB — SKYBLOCK STUDIO</strong>
          <small>IDENTIDAD PRINCIPAL DE LA MARCA</small>
        </div>
      </section>
      <div className="light-page">
        <section className="section reveal" id="shop">
          <div className="section-head">
            <h2>Colección destacada</h2>
            <Link to="/catalogo">
              Ver todo <span>→</span>
            </Link>
          </div>
          <div className="featured-grid">
            {products.map((p) => (
              <article className="product" key={p.id} onClick={() => navigate(`/producto/${p.slug}`)}>
                <div className="product-image">
                  <img src={p.image} alt={p.name} />
                </div>
                <div className="product-copy">
                  <h3>
                    {p.type === 'Accesorios' ? 'Accesorio' : 'Prenda'}{' '}
                    <span>{p.name.split(' ').slice(-1)}</span>
                  </h3>
                  <b>${(p.price / 3.25).toFixed(2)}</b>
                  <button className="buy">
                    Ver producto <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="restock-section reveal">
          <div className="restock-main">
            <span>Lanzamiento limitado</span>
            <h2>No Restock.</h2>
            <p>Cuando se agote, no volverá.</p>
            <Link className="light-button compact" to="/catalogo">
              Ver todos los productos
            </Link>
          </div>
          <div className="restock-reason">
            <div className="story-number">Edición / 001</div>
            <div className="story-copy">
              <span>Nuestra filosofía</span>
              <p>
                Creamos cada prenda en cantidades limitadas para proteger su identidad y evitar la producción
                excesiva. Cuando una edición termina, dejamos espacio para una nueva idea.
              </p>
              <p>
                Esto significa menos desperdicio, mayor atención a cada detalle y piezas que conservan su
                carácter exclusivo.
              </p>
            </div>
          </div>
        </section>
        <section className="benefits reveal">
          <article>
            <i>◇</i>
            <div>
              <h3>Calidad premium</h3>
              <p>Materiales de alta calidad pensados para el clima de Tarapoto.</p>
            </div>
          </article>
          <article>
            <i>◉</i>
            <div>
              <h3>Envío rápido</h3>
              <p>
                Atención directa
                <br />
                para cada consulta.
              </p>
            </div>
          </article>
          <article>
            <i>▢</i>
            <div>
              <h3>Pagos seguros</h3>
              <p>
                Cancela contraentrega o<br />
                presencialmente.
              </p>
            </div>
          </article>
          <article>
            <i>☆</i>
            <div>
              <h3>Diseños exclusivos</h3>
              <p>
                Lanzamientos únicos
                <br />
                disponibles para Tarapoto.
              </p>
            </div>
          </article>
        </section>
        <section className="newsletter reveal">
          <div>
            <h2>Únete a la comunidad</h2>
            <p>
              ¿Tienes una idea, una propuesta de colaboración o necesitas información sobre una pieza?
              <br />
              Estamos para escucharte.
            </p>
          </div>
          <Link className="community-contact" to="/contacto">
            Contactar con nosotros <span>→</span>
          </Link>
        </section>
      </div>
    </>
  )
}
