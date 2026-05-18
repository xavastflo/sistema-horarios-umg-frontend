import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader   from '../components/ui/PageHeader'
import Card         from '../components/ui/Card'
import Button       from '../components/ui/Button'

/**
 * ModuloPendiente
 *
 * Página genérica para rutas del menú aún no implementadas.
 * Usa los componentes reutilizables del Paso 3.
 *
 * Lee location.state?.modulo para el título del módulo.
 * Fallback: si el usuario recarga directamente en /pendiente sin state,
 * muestra un mensaje genérico en lugar de un error.
 */
export default function ModuloPendiente() {
  const location = useLocation()
  const navigate  = useNavigate()

  const nombreModulo = location.state?.modulo ?? 'Módulo del sistema'

  return (
    <div className="fade-in">
      <PageHeader
        titulo={nombreModulo}
        descripcion="Este módulo estará disponible en una próxima versión."
      />

      <Card>
        <div style={estilos.contenido}>
          <div style={estilos.icono}>🔧</div>

          <p style={estilos.mensaje}>
            La funcionalidad de <strong>{nombreModulo}</strong> está en desarrollo.
          </p>

          <p style={estilos.submensaje}>
            Si necesitas acceso urgente, contacta al administrador del sistema.
          </p>

          <Button
            variante="secondary"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </Button>
        </div>
      </Card>
    </div>
  )
}

const estilos = {
  contenido: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    padding:        '32px 16px',
    textAlign:      'center',
  },
  icono: {
    fontSize:     '40px',
    lineHeight:   1,
    marginBottom: '16px',
  },
  mensaje: {
    fontSize:     '14.5px',
    color:        'var(--color-text)',
    lineHeight:   1.6,
    marginBottom: '8px',
    maxWidth:     '380px',
  },
  submensaje: {
    fontSize:     '13px',
    color:        'var(--color-text-muted)',
    lineHeight:   1.5,
    marginBottom: '28px',
    maxWidth:     '340px',
  },
}
