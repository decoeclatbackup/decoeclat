import SiteFooter from '../shared/components/SiteFooter'
import FloatingWhatsAppButton from '../shared/components/FloatingWhatsAppButton'
import { useLocation } from 'react-router-dom'

export function MainLayout({navbar, children }) {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <>
      {navbar ? <div className="app-topbar">{navbar}</div> : null}
      <main className="app-shell">
        <section className="content">{children}</section>
      </main>
      <SiteFooter />
      {!isAdminRoute ? <FloatingWhatsAppButton /> : null}
    </>
  )
}
