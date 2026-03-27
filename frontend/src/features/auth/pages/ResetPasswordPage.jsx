import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { authService } from '../services/authService'

const initialForm = {
  nuevaPassword: '',
  confirmarPassword: '',
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isTokenPresent = useMemo(() => Boolean(token), [token])

  function handleNavbarSearch(searchValue) {
    const query = new URLSearchParams()
    if (searchValue?.trim()) {
      query.set('name', searchValue.trim())
    }
    navigate(`/catalogo${query.toString() ? `?${query.toString()}` : ''}`)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!isTokenPresent) {
      setError('El token de recuperación no está presente o es inválido.')
      return
    }

    if (!form.nuevaPassword || form.nuevaPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (form.nuevaPassword !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)

    try {
      const response = await authService.resetPasswordWithToken({
        token,
        nuevaPassword: form.nuevaPassword,
      })

      setSuccess(response?.message || 'Contraseña actualizada con éxito.')
      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message || 'No se pudo actualizar la contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout navbar={<HomePublicNavbar searchValue="" onSearchSubmit={handleNavbarSearch} />}>
      <section className="card admin-login-card">
        <div className="admin-login-header">
          <p className="kicker">Recuperación</p>
          <h1>Restablecer contraseña</h1>
          <p>Ingresá tu nueva contraseña para volver a acceder al panel.</p>
        </div>

        {!isTokenPresent ? (
          <p className="contact-form-error" role="alert">
            Link inválido: faltan datos para restablecer la contraseña.
          </p>
        ) : null}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nueva contraseña</span>
            <input
              type="password"
              name="nuevaPassword"
              value={form.nuevaPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <label className="field">
            <span>Confirmar contraseña</span>
            <input
              type="password"
              name="confirmarPassword"
              value={form.confirmarPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="btn" disabled={submitting || !isTokenPresent}>
            {submitting ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>

          {error ? <p className="contact-form-error" role="alert">{error}</p> : null}
          {success ? <p className="alert" role="status">{success}</p> : null}
        </form>

        <Link to="/admin/login" className="admin-login-reset-toggle">Volver al inicio de sesión</Link>
      </section>
    </MainLayout>
  )
}
