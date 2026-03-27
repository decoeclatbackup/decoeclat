import { Link } from 'react-router-dom'

const RAW_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''
const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/'

function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return `9${digits}`
  return digits
}

export default function SiteFooter() {
  const year = new Date().getFullYear()
  const whatsappNumber = normalizeWhatsAppNumber(RAW_WHATSAPP_NUMBER)
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <h2>DECO ECLAT</h2>
          <p>Textiles y deco para transformar tus espacios.</p>
        </div>

        <nav className="site-footer-nav" aria-label="Enlaces de pie de pagina">
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catalogo</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/carrito">Carrito</Link>
        </nav>

        <div className="site-footer-contact">
          <p>Atencion personalizada por WhatsApp.</p>
          {whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noreferrer noopener">
              Escribir por WhatsApp
            </a>
          ) : (
            <span>Configura VITE_WHATSAPP_NUMBER para activar WhatsApp.</span>
          )}

          <div className="site-footer-social">
            <a
              className="site-footer-social-link"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram de DECO ECLAT"
              title="Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7.8 3.2h8.4a4.6 4.6 0 0 1 4.6 4.6v8.4a4.6 4.6 0 0 1-4.6 4.6H7.8a4.6 4.6 0 0 1-4.6-4.6V7.8a4.6 4.6 0 0 1 4.6-4.6Zm0 1.8A2.8 2.8 0 0 0 5 7.8v8.4A2.8 2.8 0 0 0 7.8 19h8.4a2.8 2.8 0 0 0 2.8-2.8V7.8A2.8 2.8 0 0 0 16.2 5H7.8Zm8.95 1.35a1.2 1.2 0 1 1 0 2.4a1.2 1.2 0 0 1 0-2.4ZM12 7.1a4.9 4.9 0 1 1 0 9.8a4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2a3.1 3.1 0 0 0 0-6.2Z"
                  fill="currentColor"
                />
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      <div className="site-footer-copy">
        <small>{`© ${year} DECO ECLAT. Todos los derechos reservados.`}</small>
      </div>
    </footer>
  )
}