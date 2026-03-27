import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../features/auth/services/authService'

const ADMIN_TABS = [
  { to: '/admin/home', label: 'Admin Home' },
  { to: '/admin/productos', label: 'Admin Productos' },
  { to: '/admin/ventas', label: 'Admin Ventas' },
]

const QUICK_LINKS = [
  { to: '/catalogo', label: 'Catalogo' },
  { to: '/carrito', label: 'Carrito' },
]

export default function AdminNavbar() {
  const navigate = useNavigate()

  function handleLogout() {
    authService.logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <nav className="admin-navbar" aria-label="Navegacion administrativa">
      <div className="admin-navbar-tabs">
        {ADMIN_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="admin-navbar-links">
        {QUICK_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `admin-quick-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
        <button type="button" className="admin-quick-link" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </div>
    </nav>
  )
}
