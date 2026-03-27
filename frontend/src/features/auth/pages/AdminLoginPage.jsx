import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import { authService } from '../services/authService'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'

const initialCredentials = {
  email: '',
  contrasenia: '',
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const expiredReason = searchParams.get('reason')
  const nextFromQuery = searchParams.get('next')
  const [credentials, setCredentials] = useState(initialCredentials)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authService.isAdminAuthenticated()) {
    return <Navigate to="/admin/home" replace />
  }

  const fromPath = location.state?.from?.pathname
  const nextPath = (nextFromQuery && nextFromQuery.startsWith('/admin'))
    ? nextFromQuery
    : (fromPath && fromPath.startsWith('/admin') ? fromPath : '/admin/home')

  function handleChange(event) {
    const { name, value } = event.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await authService.loginAdmin(credentials)
      navigate(nextPath, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'No se pudo iniciar sesion')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNavbarSearch(searchValue) {
    const query = new URLSearchParams()
    if (searchValue?.trim()) {
      query.set('name', searchValue.trim())
    }
    navigate(`/catalogo${query.toString() ? `?${query.toString()}` : ''}`)
  }

  return (
    <MainLayout navbar={<HomePublicNavbar searchValue="" onSearchSubmit={handleNavbarSearch} />}>
      <section className="card admin-login-card">
        <div className="admin-login-header">
          <p className="kicker">Panel administrativo</p>
          <h1>Iniciar sesion</h1>
        </div>

        {expiredReason === 'session-expired' ? (
          <p className="alert" role="status">Tu sesión expiró. Iniciá sesión nuevamente.</p>
        ) : null}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              name="contrasenia"
              value={credentials.contrasenia}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar al panel'}
          </button>

          {error ? <p className="contact-form-error" role="alert">{error}</p> : null}
        </form>
      </section>
    </MainLayout>
  )
}
