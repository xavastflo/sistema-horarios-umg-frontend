import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Badge        from '../../components/ui/Badge'
import Button       from '../../components/ui/Button'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import { getCarreras } from '../../api/carreras'

/**
 * MisCarreras — vista exclusiva del coordinador.
 *
 * Consume GET /api/carreras sin parámetros adicionales.
 * El scope backend ya filtra por carrera.id_usuario_coordinador = usuario autenticado,
 * por lo que el coordinador solo recibe las carreras que coordina.
 *
 * Solo lectura: sin crear, editar ni desactivar carreras.
 * Los botones de acción navegan a rutas ya existentes en App.jsx.
 */
export default function MisCarreras() {
  const navigate = useNavigate()

  const [carreras,  setCarreras]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        // El backend devuelve solo las carreras del coordinador autenticado
        const data = await getCarreras({ estado: 'activo' })
        setCarreras(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'No tienes permisos para ver esta información.'
            : (err.response?.data?.message ?? 'Error al cargar tus carreras.')
        )
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="fade-in">
      <PageHeader
        titulo="Mis carreras"
        descripcion="Carreras académicas asignadas a tu coordinación."
      />

      {cargando && <LoadingState texto="Cargando tus carreras…" />}

      {!cargando && error && (
        <ErrorState
          mensaje={error}
          onReintentar={() => {
            setCargando(true)
            setError(null)
            getCarreras({ estado: 'activo' })
              .then(data => setCarreras(Array.isArray(data) ? data : []))
              .catch(err => setError(err.response?.data?.message ?? 'Error al cargar tus carreras.'))
              .finally(() => setCargando(false))
          }}
        />
      )}

      {!cargando && !error && carreras.length === 0 && (
        <EmptyState
          icono="🎓"
          titulo="Sin carreras asignadas"
          descripcion="No tienes carreras asignadas actualmente. Contacta al administrador del sistema."
        />
      )}

      {!cargando && !error && carreras.length > 0 && (
        <div style={est.grid}>
          {carreras.map(carrera => (
            <Card key={carrera.id_carrera} style={est.tarjeta}>

              {/* Encabezado */}
              <div style={est.encabezado}>
                <div style={est.codigoBadge}>
                  <code style={est.codigo}>{carrera.codigo_carrera}</code>
                </div>
                <Badge
                  texto={carrera.estado === 'activo' ? 'Activa' : 'Inactiva'}
                  variante={carrera.estado === 'activo' ? 'success' : 'neutral'}
                  dot
                />
              </div>

              {/* Nombre */}
              <h2 style={est.nombre}>{carrera.nombre_carrera}</h2>

              {/* Facultad / sede */}
              {carrera.facultad && (
                <p style={est.meta}>
                  <span style={est.metaLabel}>Facultad:</span>
                  {carrera.facultad.nombre_facultad}
                </p>
              )}
              {carrera.facultad?.centro_educativo && (
                <p style={est.meta}>
                  <span style={est.metaLabel}>Sede:</span>
                  {carrera.facultad.centro_educativo.nombre}
                </p>
              )}

              {/* Jornadas activas */}
              {carrera.jornadas_activas?.length > 0 && (
                <div style={est.jornadasWrap}>
                  <span style={est.metaLabel}>Jornadas:</span>
                  <div style={est.jornadas}>
                    {carrera.jornadas_activas.map(j => (
                      <Badge
                        key={j.id_jornada}
                        texto={j.nombre_jornada.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                        variante="info"
                        dot
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones de navegación */}
              <div style={est.acciones}>
                <Button
                  variante="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/pensum', {
                    state: { id_carrera: carrera.id_carrera }
                  })}
                >
                  Pensum
                </Button>
                <Button
                  variante="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/secciones', {
                    state: { id_carrera: carrera.id_carrera }
                  })}
                >
                  Secciones
                </Button>
                <Button
                  variante="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/horarios', {
                    state: { id_carrera: carrera.id_carrera }
                  })}
                >
                  Horarios
                </Button>
                <Button
                  variante="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/carrera-jornadas', {
                    state: { id_carrera: carrera.id_carrera }
                  })}
                >
                  Jornadas
                </Button>
              </div>

            </Card>
          ))}
        </div>
      )}

      {!cargando && !error && carreras.length > 0 && (
        <p style={est.nota}>
          Total: {carreras.length} carrera{carreras.length !== 1 ? 's' : ''} asignada{carreras.length !== 1 ? 's' : ''}.
        </p>
      )}
    </div>
  )
}

/* ── Estilos ──────────────────────────────────────────────────────── */
const est = {
  grid: {
    display:               'grid',
    gridTemplateColumns:   'repeat(auto-fill, minmax(320px, 1fr))',
    gap:                   '20px',
  },
  tarjeta: {
    display:        'flex',
    flexDirection:  'column',
    gap:            '10px',
  },
  encabezado: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '2px',
  },
  codigoBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  codigo: {
    background:   'var(--color-primary-subtle)',
    color:        'var(--color-primary)',
    padding:      '2px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize:     '12px',
    fontFamily:   'var(--font-mono)',
    fontWeight:   600,
  },
  nombre: {
    fontSize:     '15px',
    fontWeight:   700,
    color:        'var(--color-text)',
    margin:       0,
    lineHeight:   1.35,
  },
  meta: {
    fontSize:   '13px',
    color:      'var(--color-text-secondary)',
    margin:     0,
    display:    'flex',
    gap:        '6px',
    alignItems: 'baseline',
  },
  metaLabel: {
    fontSize:   '11.5px',
    fontWeight: 600,
    color:      'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    flexShrink: 0,
  },
  jornadasWrap: {
    display:    'flex',
    gap:        '8px',
    alignItems: 'flex-start',
    flexWrap:   'wrap',
  },
  jornadas: {
    display:  'flex',
    gap:      '6px',
    flexWrap: 'wrap',
  },
  acciones: {
    display:        'flex',
    gap:            '6px',
    flexWrap:       'wrap',
    paddingTop:     '8px',
    borderTop:      '1px solid var(--color-border)',
    marginTop:      '4px',
  },
  nota: {
    marginTop:  '12px',
    fontSize:   '12px',
    color:      'var(--color-text-muted)',
    textAlign:  'right',
  },
}
