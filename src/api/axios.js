import axios from 'axios'

/**
 * Instancia global de Axios.
 * baseURL se lee de la variable de entorno VITE_API_URL definida en .env.
 * Todos los módulos de API deben importar esta instancia, no axios directamente.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

// ── Interceptor de request: adjuntar token Bearer ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Interceptor de response: manejo centralizado de errores ───────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message ?? 'Error inesperado.'

    if (status === 401) {
      // Token inválido o expirado — limpiar sesión y redirigir
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      // Disparar evento global para que AuthContext reaccione
      window.dispatchEvent(new Event('auth:logout'))
    }

    if (status === 403) {
      console.warn('[API 403]', message)
    }

    if (status === 422) {
      // Los errores de validación se propagan con sus campos
      // El componente que llame puede leer error.response.data.errors
      console.warn('[API 422]', error.response?.data?.errors)
    }

    if (status === 500) {
      console.error('[API 500] Error interno del servidor.', message)
    }

    return Promise.reject(error)
  },
)

export default api
