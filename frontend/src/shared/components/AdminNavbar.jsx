import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../../features/auth/services/authService'

const ADMIN_TABS = [
  { to: '/admin/home', label: 'Admin Home' },
  { to: '/admin/productos', label: 'Admin Productos' },
  { to: '/admin/ventas', label: 'Admin Ventas' },
]

const QUICK_LINKS = [
  { to: '/', label: 'Inicio' },
]

export default function AdminNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 900px)')
    const handleViewportChange = (event) => {
      if (!event.matches) {
        setIsMobileMenuOpen(false)
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange)
      return () => mediaQuery.removeEventListener('change', handleViewportChange)
    }

    mediaQuery.addListener(handleViewportChange)
    return () => mediaQuery.removeListener(handleViewportChange)
  }, [])

  function handleMobileToggle() {
    setIsMobileMenuOpen((prev) => !prev)
  }

  function handleCloseMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  function handleLogout() {
    handleCloseMobileMenu()
    authService.logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <nav className={`admin-navbar ${isMobileMenuOpen ? 'menu-open' : ''}`} aria-label="Navegacion administrativa">
      <div className="admin-navbar-main">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          aria-expanded={isMobileMenuOpen}
          aria-controls="admin-navbar-menu"
          aria-label={isMobileMenuOpen ? 'Cerrar menu admin' : 'Abrir menu admin'}
          onClick={handleMobileToggle}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <Link to="/" className="admin-brand" onClick={handleCloseMobileMenu}>
          DECOECLAT
        </Link>

        <span className="admin-navbar-main-spacer" aria-hidden="true" />
      </div>

      <div id="admin-navbar-menu" className="admin-navbar-menu">
        <div className="admin-mobile-menu-header" aria-hidden="true">
          <p>Panel Admin</p>
          <small>Navegacion rapida</small>
        </div>

        <div className="admin-navbar-tabs">
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
              onClick={handleCloseMobileMenu}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <Link to="/" className="admin-brand-desktop" onClick={handleCloseMobileMenu}>
          DECOECLAT
        </Link>

        <div className="admin-navbar-links">
          {QUICK_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `admin-quick-link ${isActive ? 'active' : ''}`}
              onClick={handleCloseMobileMenu}
            >
              {link.label}
            </NavLink>
          ))}
          <button type="button" className="admin-quick-link" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <button
          type="button"
          className="admin-mobile-backdrop"
          aria-label="Cerrar menu admin"
          onClick={handleCloseMobileMenu}
        />
      ) : null}
    </nav>
  )
}
