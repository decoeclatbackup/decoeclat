import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { homePublicService } from '../services/homePublicService'

const RAW_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return `9${digits}`
  return digits
}

function buildContactWhatsAppMessage({ consultaId, mensaje }) {
  return [
    '*PEDIDO PERSONALIZADO*',
    '',
    consultaId ? `Consulta: #${consultaId}` : '',
    'Mensaje:',
    mensaje,
  ].filter(Boolean).join('\n')
}

const initialFormState = {
  mensaje: '',
}

export function ContactPage() {
  const navigate = useNavigate()
  const whatsappNumber = normalizeWhatsAppNumber(RAW_WHATSAPP_NUMBER)
  const [formValues, setFormValues] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handleNavbarSearch(searchValue) {
    const query = new URLSearchParams()
    if (searchValue?.trim()) {
      query.set('name', searchValue.trim())
    }
    navigate(`/catalogo${query.toString() ? `?${query.toString()}` : ''}`)
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitted(false)
    setIsSubmitting(true)

    try {
      if (!whatsappNumber) {
        throw new Error('Falta configurar VITE_WHATSAPP_NUMBER en el frontend')
      }

      const response = await homePublicService.sendContactMessage(formValues)
      const message = buildContactWhatsAppMessage({
        consultaId: response?.consulta_id,
        ...formValues,
      })
      const encodedMessage = encodeURIComponent(message)
      const appUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`
      const webUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = appUrl
        window.setTimeout(() => {
          window.location.href = webUrl
        }, 800)
      } else {
        window.open(webUrl, '_blank', 'noopener,noreferrer')
      }

      setIsSubmitted(true)
      setFormValues(initialFormState)
    } catch (error) {
      setSubmitError(error.message || 'No se pudo enviar el mensaje en este momento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout
      title="Contacto | Pedido personalizado"
      description="Contactate con DECOECLAT para pedidos personalizados de textiles, medidas y asesoramiento por WhatsApp."
      navbar={(
        <HomePublicNavbar
          searchValue=""
          onSearchSubmit={handleNavbarSearch}
        />
      )}
    >
      <section className="card contact-page">
        <div className="contact-page-header">
          <p className="kicker">Contacto</p>
          <h1>Armemos tu decoriación</h1>
          <p>
            Completa el formulario con tu consulta para ayudarte con telas, medidas y recomendaciones para tu espacio.
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form-grid">
            <label htmlFor="mensaje">Mensaje</label>
            <textarea
              id="mensaje"
              name="mensaje"
              value={formValues.mensaje}
              onChange={handleInputChange}
              required
              rows={5}
              placeholder="Contanos que estas buscando"
            />
          </div>

          <button type="submit" className="btn home-public-link-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje por WhatsApp'}
          </button>

          {submitError ? (
            <p className="contact-form-error" role="alert">
              {submitError}
            </p>
          ) : null}

          {isSubmitted ? (
            <p className="contact-form-success" role="status">
              Consulta guardada. Te abrimos WhatsApp para que la envies ahora.
            </p>
          ) : null}
        </form>
      </section>
    </MainLayout>
  )
}
