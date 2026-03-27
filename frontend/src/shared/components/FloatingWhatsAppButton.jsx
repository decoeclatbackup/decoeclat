const RAW_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return `9${digits}`
  return digits
}

export default function FloatingWhatsAppButton() {
  const whatsappNumber = normalizeWhatsAppNumber(RAW_WHATSAPP_NUMBER)
  const defaultMessage = 'Hola! quiero realizar una consulta acerca de...'

  if (!whatsappNumber) return null

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`

  return (
    <a
      className="floating-whatsapp-btn"
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Abrir WhatsApp"
      title="WhatsApp"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12.02 2.5c-5.24 0-9.5 4.2-9.5 9.38c0 1.64.43 3.25 1.26 4.68L2.5 21.5l5.08-1.3a9.58 9.58 0 0 0 4.44 1.1c5.24 0 9.48-4.2 9.48-9.42c0-5.17-4.24-9.38-9.48-9.38Zm0 17.2a7.93 7.93 0 0 1-4.06-1.12l-.3-.18l-3.02.77l.8-2.94l-.2-.31a7.78 7.78 0 0 1-1.2-4.04c0-4.28 3.57-7.77 7.98-7.77c4.4 0 7.96 3.49 7.96 7.77c0 4.31-3.56 7.82-7.96 7.82Zm4.36-5.91c-.24-.12-1.43-.7-1.65-.78c-.22-.08-.38-.12-.54.12c-.16.23-.62.77-.76.93c-.14.16-.28.18-.52.06c-.24-.12-1.01-.36-1.93-1.14c-.71-.6-1.2-1.35-1.34-1.58c-.14-.23-.01-.36.1-.48c.11-.11.24-.28.36-.42c.12-.14.16-.23.24-.39c.08-.16.04-.29-.02-.41c-.06-.12-.54-1.28-.74-1.75c-.19-.46-.39-.4-.54-.41l-.46-.01c-.16 0-.41.06-.62.29c-.21.23-.82.8-.82 1.95c0 1.15.84 2.27.96 2.43c.12.16 1.65 2.62 4.08 3.57c2.42.95 2.42.63 2.86.59c.44-.04 1.43-.58 1.63-1.13c.2-.55.2-1.03.14-1.13c-.06-.1-.22-.16-.46-.28Z"
          fill="currentColor"
        />
      </svg>
    </a>
  )
}