import { useState, useEffect, useCallback } from 'react'
import PageHeader    from '../../components/ui/PageHeader'
import Card          from '../../components/ui/Card'
import Button        from '../../components/ui/Button'
import Badge         from '../../components/ui/Badge'
import EmptyState    from '../../components/ui/EmptyState'
import LoadingState  from '../../components/ui/LoadingState'
import ErrorState    from '../../components/ui/ErrorState'
import { getCarreras }            from '../../api/carreras'
import { getJornadas, getCarreraConJornadas, asignarJornadas } from '../../api/carreraJornadas'

/**
 * CarreraJornadas
 *
 * Módulo de asignación de jornadas a carreras.
 * El usuario selecciona una carrera, ve sus jornadas activas, y puede
 * asignar jornadas adicionales del catálogo con checkboxes.
 *
 * Endpoints:
 *   GET  /catalogos/jornadas          — catálogo fijo de jornadas
 *   GET  /carreras                    — lista de carreras activas para el selector
 *   GET  /carreras/{id}               — jornadas activas de la carrera seleccionada
 *   POST /carreras/{id}/jornadas      — asignar jornadas
 *
 * Sin DELETE: el backend no expone desasignación de jornadas.
 */
/**
 * Convierte un valor snake_case del backend a texto legible para la UI.
 * Ejemplos: 'fin_de_semana' → 'Fin de semana' | 'matutina' → 'Matutina'
 */
function formatLabel(valor) {
  if (!valor) return valor
  return valor
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

export default function CarreraJornadas() {
  // ── Catálogos (carga inicial) ──────────────────────────────
  const [carreras,        setCarreras]        = useState([])
  const [jornadas,        setJornadas]        = useState([])
  const [cargandoCatalog, setCargandoCatalog] = useState(true)
  const [errorCatalog,    setErrorCatalog]    = useState(null)

  // ── Selección y detalle de carrera ─────────────────────────
  const [idCarreraSelected, setIdCarreraSelected] = useState('')
  const [carreraDetalle,    setCarreraDetalle]    = useState(null)
  const [cargandoDetalle,   setCargandoDetalle]   = useState(false)
  const [errorDetalle,      setErrorDetalle]      = useState(null)

  // ── Asignación ─────────────────────────────────────────────
  const [seleccionadas, setSeleccionadas] = useState([])  // ids marcados en checkboxes
  const [guardando,     setGuardando]     = useState(false)
  const [errorAsignar,  setErrorAsignar]  = useState(null)
  const [resultadoMsg,  setResultadoMsg]  = useState(null) // feedback post-asignación

  // ── Cargar catálogos al montar ─────────────────────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCatalog(true)
      setErrorCatalog(null)
      try {
        const [dataCarreras, dataJornadas] = await Promise.all([
          getCarreras({ estado: 'activo' }),
          getJornadas(),
        ])
        setCarreras(dataCarreras)
        setJornadas(dataJornadas)
      } catch (err) {
        setErrorCatalog(
          err.response?.status === 403
            ? 'No tienes permisos para ver este módulo.'
            : 'Error al cargar carreras o jornadas. Recarga la página.'
        )
      } finally {
        setCargandoCatalog(false)
      }
    }
    cargarCatalogos()
  }, [])

  // ── Cargar detalle de carrera seleccionada ─────────────────
  const cargarDetalle = useCallback(async (idCarrera) => {
    if (!idCarrera) { setCarreraDetalle(null); return }
    setCargandoDetalle(true)
    setErrorDetalle(null)
    setResultadoMsg(null)
    setErrorAsignar(null)
    setSeleccionadas([])
    try {
      const data = await getCarreraConJornadas(idCarrera)
      setCarreraDetalle(data)
    } catch (err) {
      setErrorDetalle(
        err.response?.data?.message ?? 'No se pudo cargar el detalle de la carrera.'
      )
    } finally {
      setCargandoDetalle(false)
    }
  }, [])

  function onSeleccionarCarrera(e) {
    const val = e.target.value
    setIdCarreraSelected(val)
    cargarDetalle(val ? Number(val) : '')
  }

  // ── IDs de jornadas ya activas en la carrera ───────────────
  // Laravel serializa la relación jornadasActivas() como 'jornadas_activas'
  // (snake_case por defecto). El componente usaba camelCase → siempre vacío.
  const jornadasAsignadas = carreraDetalle?.jornadas_activas ?? []
  const idsActivos = new Set(jornadasAsignadas.map(j => j.id_jornada))

  // ── Toggle de checkboxes ───────────────────────────────────
  function toggleJornada(idJornada) {
    setSeleccionadas(prev =>
      prev.includes(idJornada)
        ? prev.filter(id => id !== idJornada)
        : [...prev, idJornada]
    )
  }

  // ── Asignar jornadas seleccionadas ─────────────────────────
  async function onAsignar() {
    if (seleccionadas.length === 0) return
    setGuardando(true)
    setErrorAsignar(null)
    setResultadoMsg(null)
    try {
      const res = await asignarJornadas(Number(idCarreraSelected), seleccionadas)
      // Refrescar detalle desde backend para mostrar el estado real
      await cargarDetalle(Number(idCarreraSelected))
      setSeleccionadas([])
      const asig = res.asignadas?.length ?? 0
      const ign  = res.ignoradas?.length ?? 0
      setResultadoMsg(
        asig > 0
          ? `✓ ${asig} jornada${asig > 1 ? 's' : ''} asignada${asig > 1 ? 's' : ''} correctamente.` +
            (ign > 0 ? ` (${ign} ya estaban asignadas)` : '')
          : `Las jornadas seleccionadas ya estaban asignadas a esta carrera.`
      )
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErrorAsignar(err.response?.data?.message ?? 'Error de validación.')
      } else if (status === 403) {
        setErrorAsignar('No tienes permisos para asignar jornadas.')
      } else {
        setErrorAsignar(err.response?.data?.message ?? 'Error al asignar jornadas.')
      }
    } finally {
      setGuardando(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Jornadas por carrera"
        descripcion="Asigna las jornadas disponibles a cada carrera de la institución."
      />

      {/* Error de catálogos */}
      {errorCatalog && <ErrorState mensaje={errorCatalog} />}

      {cargandoCatalog && <LoadingState texto="Cargando carreras y jornadas…" />}

      {!cargandoCatalog && !errorCatalog && (
        <div style={estilos.grid}>

          {/* ── Panel izquierdo: selección de carrera ───────── */}
          <Card>
            <h2 style={estilos.panelTitulo}>1. Selecciona una carrera</h2>
            <select
              value={idCarreraSelected}
              onChange={onSeleccionarCarrera}
              style={estilos.select}
            >
              <option value="">— Selecciona una carrera —</option>
              {carreras.map(c => (
                <option key={c.id_carrera} value={c.id_carrera}>
                  {c.nombre_carrera}
                  {c.codigo_carrera ? ` (${c.codigo_carrera})` : ''}
                </option>
              ))}
            </select>

            {/* Jornadas actuales */}
            <div style={estilos.jornadasActualesWrapper}>
              <p style={estilos.subtitulo}>Jornadas asignadas actualmente:</p>

              {cargandoDetalle && <LoadingState texto="Cargando…" alto="60px" />}

              {errorDetalle && (
                <p style={estilos.errorInline}>{errorDetalle}</p>
              )}

              {!cargandoDetalle && !errorDetalle && !carreraDetalle && (
                <p style={estilos.sinSeleccion}>Selecciona una carrera para ver sus jornadas.</p>
              )}

              {!cargandoDetalle && !errorDetalle && carreraDetalle && (
                idsActivos.size === 0
                  ? <p style={estilos.sinJornadas}>Esta carrera no tiene jornadas asignadas aún.</p>
                  : <div style={estilos.jornadasActivas}>
                      {jornadasAsignadas.map(j => (
                        <Badge
                          key={j.id_jornada}
                          texto={formatLabel(j.nombre_jornada)}
                          variante="info"
                          dot
                        />
                      ))}
                    </div>
              )}
            </div>
          </Card>

          {/* ── Panel derecho: asignar jornadas ─────────────── */}
          <Card>
            <h2 style={estilos.panelTitulo}>2. Asignar jornadas</h2>

            {!idCarreraSelected && (
              <EmptyState
                icono="⬅️"
                titulo="Primero selecciona una carrera"
                descripcion="El selector de jornadas aparecerá aquí."
              />
            )}

            {idCarreraSelected && !cargandoDetalle && (
              <>
                <p style={estilos.subtitulo}>Marca las jornadas a asignar:</p>

                <div style={estilos.checkboxes}>
                  {jornadas.map(j => {
                    const yaActiva  = idsActivos.has(j.id_jornada)
                    const marcada   = seleccionadas.includes(j.id_jornada)
                    return (
                      <label
                        key={j.id_jornada}
                        style={{
                          ...estilos.checkLabel,
                          ...(yaActiva ? estilos.checkLabelActiva : {}),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={marcada || yaActiva}
                          disabled={yaActiva || guardando}
                          onChange={() => !yaActiva && toggleJornada(j.id_jornada)}
                          style={estilos.checkbox}
                        />
                        <span style={estilos.checkTexto}>
                          {formatLabel(j.nombre_jornada)}
                          {yaActiva && (
                            <span style={estilos.etiquetaActiva}> — ya asignada</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>

                {/* Feedback de resultado */}
                {resultadoMsg && (
                  <div style={estilos.alertaOk}>{resultadoMsg}</div>
                )}
                {errorAsignar && (
                  <div style={estilos.alertaError} role="alert">{errorAsignar}</div>
                )}

                {/* Nota informativa */}
                <p style={estilos.nota}>
                  Las jornadas ya asignadas aparecen deshabilitadas.
                  No existe opción de eliminar jornadas desde esta pantalla.
                </p>

                <div style={estilos.accionWrapper}>
                  <Button
                    variante="primary"
                    cargando={guardando}
                    disabled={seleccionadas.length === 0 || guardando}
                    onClick={onAsignar}
                  >
                    Asignar jornadas seleccionadas
                    {seleccionadas.length > 0 && ` (${seleccionadas.length})`}
                  </Button>
                </div>
              </>
            )}
          </Card>

        </div>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const estilos = {
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap:                 '20px',
    alignItems:          'start',
  },

  panelTitulo: {
    fontSize:     '14px',
    fontWeight:   700,
    color:        'var(--color-text)',
    marginBottom: '14px',
    margin:       '0 0 14px',
  },
  subtitulo: {
    fontSize:     '12.5px',
    fontWeight:   600,
    color:        'var(--color-text-secondary)',
    margin:       '16px 0 8px',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
  },

  select: {
    width:        '100%',
    padding:      '9px 12px',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '14px',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    fontFamily:   'var(--font-sans)',
    cursor:       'pointer',
    outline:      'none',
  },

  jornadasActualesWrapper: { marginTop: '4px' },
  jornadasActivas: { display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' },
  sinSeleccion:  { fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' },
  sinJornadas:   { fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' },
  errorInline:   { fontSize: '13px', color: 'var(--color-error)',      marginTop: '6px' },

  checkboxes: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  checkLabel: {
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    padding:     '10px 12px',
    border:      '1.5px solid var(--color-border)',
    borderRadius:'var(--radius-md)',
    cursor:      'pointer',
    transition:  'background .12s',
    userSelect:  'none',
  },
  checkLabelActiva: {
    background:   'var(--color-primary-subtle)',
    borderColor:  'var(--color-primary)',
    cursor:       'default',
    opacity:      .75,
  },
  checkbox:     { width: '16px', height: '16px', cursor: 'inherit', accentColor: 'var(--color-primary)', flexShrink: 0 },
  checkTexto:   { fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' },
  etiquetaActiva: { color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '12.5px' },

  alertaOk: {
    background:   '#f0fdf4',
    border:       '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)',
    padding:      '10px 14px',
    fontSize:     '13.5px',
    color:        '#166534',
    fontWeight:   500,
    marginBottom: '12px',
  },
  alertaError: {
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    padding:      '10px 14px',
    fontSize:     '13.5px',
    color:        'var(--color-error)',
    fontWeight:   500,
    marginBottom: '12px',
  },

  nota: {
    fontSize:   '12px',
    color:      'var(--color-text-muted)',
    lineHeight: 1.5,
    marginBottom: '14px',
  },
  accionWrapper: { display: 'flex', justifyContent: 'flex-end' },
}
