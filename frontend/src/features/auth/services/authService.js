import { request } from '../../carrito/services/http'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

function safeParseUser(value) {
	if (!value) return null
	try {
		return JSON.parse(value)
	} catch {
		return null
	}
}

export const authService = {
	async loginAdmin({ email, contrasenia }) {
		const payload = {
			email: email?.trim(),
			contrasenia,
		}

		const response = await request('/api/login', {
			method: 'POST',
			suppressAuthRedirect: true,
			body: JSON.stringify(payload),
		})

		if (!response?.token || !response?.user) {
			throw new Error('Respuesta de autenticacion invalida')
		}

		if (Number(response.user.rol) !== 1) {
			throw new Error('Acceso denegado. Solo administradores.')
		}

		localStorage.setItem(AUTH_TOKEN_KEY, response.token)
		localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user))

		return response
	},

	logout() {
		localStorage.removeItem(AUTH_TOKEN_KEY)
		localStorage.removeItem(AUTH_USER_KEY)
		localStorage.removeItem('token')
	},

	getSession() {
		const token = localStorage.getItem(AUTH_TOKEN_KEY)
		const user = safeParseUser(localStorage.getItem(AUTH_USER_KEY))
		return { token, user }
	},

	getToken() {
		return localStorage.getItem(AUTH_TOKEN_KEY)
	},

	isAdminAuthenticated() {
		const { token, user } = this.getSession()
		return Boolean(token && user && Number(user.rol) === 1)
	},
}
