import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute
 *
 * Protege una ruta verificando:
 *   1. Que exista token (usuario autenticado)
 *   2. Opcionalmente, que el perfil activo esté en rolesPermitidos
 *
 * Mientras AuthContext está cargando (verificando token en localStorage)
 * muestra un spinner para evitar redirección prematura al /login.
 *
 * @param {string[]} rolesPermitidos — si se omite, solo verifica autenticación
 */
export default function ProtectedRoute({ children, rolesPermitidos = [] }) {
  const { token, perfilActivo, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div style={estilos.wrapper}>
        <div style={estilos.spinner} />
      </div>
    )
  }

  // Sin token → redirigir al login guardando la ruta intentada
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Con rolesPermitidos → verificar que el perfil activo esté incluido
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(perfilActivo)) {
    // Redirigir al dashboard del perfil activo real
    return <Navigate to={rutaDashboard(perfilActivo)} replace />
  }

  return children
}

/** Devuelve la ruta del dashboard según el perfil activo */
export function rutaDashboard(perfil) {
  const mapa = {
    administrador: '/admin/dashboard',
    coordinador:   '/coordinador/dashboard',
    docente:       '/docente/dashboard',
    estudiante:    '/estudiante/dashboard',
  }
  return mapa[perfil] ?? '/login'
}

const estilos = {
  wrapper: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    height:          '100vh',
    background:      'var(--color-bg)',
  },
  spinner: {
    width:           '32px',
    height:          '32px',
    border:          '3px solid var(--color-border)',
    borderTopColor:  'var(--color-primary)',
    borderRadius:    '50%',
    animation:       'spin .7s linear infinite',
  },
}
