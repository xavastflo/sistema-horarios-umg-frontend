import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import { getSecciones }                     from '../../api/secciones'
import { getCursos }                        from '../../api/cursos'
import { getPeriodos }                      from '../../api/periodosAcademicos'
import { getDocentes }                      from '../../api/docentes'
import { asignarDocente, quitarDocente }    from '../../api/asignacionDocente'

function obtenerNombreDocente(docente) {
  if (!docente) return null

  if (docente.nombre_docente) {
    return docente.nombre_docente
  }

  if (docente.usuario?.nombre_completo) {
    return docente.usuario.nombre_completo
  }

  const nombres = docente.usuario?.nombres
  const apellidos = docente.usuario?.apellidos

  if (nombres || apellidos) {
    return `${nombres ?? ''} ${apellidos ?? ''}`.trim()
  }

  return null
}

function obtenerCodigoDocente(docente) {
  return docente?.codigo_docente ?? null
}

/**
 * AsignacionDocente — Paso 14
 *
 * Gestión de asignaciones docente → sección.
 * Usa GET /secciones (ya implementado en Paso 13) con asignacion_activa incluida.
 * Agrega acciones POST/DELETE por fila.
 *
 * Reglas de negocio validadas por el backend (422):
 *   - La sección ya tiene docente activo
 *   - El docente no está activo
 *   - El docente alcanzó el máximo de cursos en el período
 *   - El docente ya tiene un curso del mismo ciclo_semestre
 *
 * Serialización snake_case (Laravel):
 *   asignacion_activa, periodo_academico
 */
export default function AsignacionDocente() {
  // ── Datos principales ──────────────────────────────────────
  const [secciones,   setSecciones]   = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)

  // ── Catálogos ──────────────────────────────────────────────
  const [cursos,      setCursos]      = useState([])
  const [periodos,    setPeriodos]    = useState([])
  const [docentes,    setDocentes]    = useState([])
  const [cargandoCat, setCargandoCat] = useState(true)
  const [errorCat,    setErrorCat]    = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [filtroEstado,  setFiltroEstado]  = useState('activo')
  const [filtroCurso,   setFiltroCurso]   = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('')

  // ── Asignación inline ──────────────────────────────────────
  // seccionAsignando: id de la sección cuyo select está abierto
  const [seccionAsignando, setSeccionAsignando] = useState(null)
  const [docenteSelec,     setDocenteSelec]     = useState('')
  const [asignando,        setAsignando]        = useState(null)  // id_seccion en proceso
  const [errorAsig,        setErrorAsig]        = useState(null)

  // ── Quitar asignación ──────────────────────────────────────
  const [quitando,    setQuitando]    = useState(null)   // id_seccion en proceso
  const [errorQuitar, setErrorQuitar] = useState(null)

  // ── Cargar secciones ───────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado               = filtroEstado
      if (filtroCurso)   params.id_curso              = filtroCurso
      if (filtroPeriodo) params.id_periodo_academico  = filtroPeriodo
      setSecciones(await getSecciones(params))
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver las secciones.'
          : (err.response?.data?.message ?? 'Error al cargar secciones.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroCurso, filtroPeriodo])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar catálogos al montar ─────────────────────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCat(true)
      setErrorCat(null)
      try {
        const [dc, dp, dd] = await Promise.all([
          getCursos({ estado: 'activo' }),
          getPeriodos(),
          getDocentes({ estado: 'activo' }),
        ])
        setCursos(dc)
        // Período vigente primero
        dp.sort((a, b) => {
          if (a.es_vigente && !b.es_vigente) return -1
          if (!a.es_vigente && b.es_vigente) return  1
          return (b.anio ?? 0) - (a.anio ?? 0)
        })
        setPeriodos(dp)
        // Docentes ordenados por prioridad (ya vienen ASC del backend)
        setDocentes(dd)
      } catch {
        setErrorCat('Error al cargar catálogos. Recarga la página.')
      } finally {
        setCargandoCat(false)
      }
    }
    cargarCatalogos()
  }, [])

  // ── Abrir selector de docente ──────────────────────────────
  function abrirAsignacion(idSeccion) {
    setSeccionAsignando(idSeccion)
    setDocenteSelec('')
    setErrorAsig(null)
  }
  function cancelarAsignacion() {
    setSeccionAsignando(null)
    setDocenteSelec('')
    setErrorAsig(null)
  }

  // ── Asignar ────────────────────────────────────────────────
  async function onAsignar(idSeccion) {
    if (!docenteSelec) return
    setAsignando(idSeccion)
    setErrorAsig(null)
    try {
      await asignarDocente(idSeccion, Number(docenteSelec))
      setSeccionAsignando(null)
      await cargar()
    } catch (err) {
      // Mostrar el mensaje del backend (422 con reglas de negocio)
      const msg = err.response?.data?.message ?? 'Error al asignar el docente.'
      setErrorAsig(msg)
    } finally {
      setAsignando(null)
    }
  }

  // ── Quitar ─────────────────────────────────────────────────
  async function onQuitar(seccion) {
    const docNombre = obtenerNombreDocente(seccion.asignacion_activa?.docente) ?? 'docente'
    if (!window.confirm(
      `¿Quitar a "${docNombre}" de la sección ${seccion.numero_seccion} — ${seccion.curso?.nombre_curso}?`
    )) return
    setQuitando(seccion.id_seccion)
    setErrorQuitar(null)
    try {
      await quitarDocente(seccion.id_seccion)
      await cargar()
    } catch (err) {
      setErrorQuitar(err.response?.data?.message ?? 'No se pudo quitar el docente.')
    } finally {
      setQuitando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Asignación de docentes"
        descripcion="Asigna docentes a las secciones académicas del período activo."
      />

      {/* Error catálogos */}
      {errorCat && <div style={est.alertaWarn}>{errorCat}</div>}

      {/* Filtros */}
      <div style={est.filtros}>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={est.select}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => (
            <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
              {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''}{p.es_vigente ? ' ★' : ''}
            </option>
          ))}
        </select>
        <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)} style={est.select}>
          <option value="">Todos los cursos</option>
          {cursos.map(c => (
            <option key={c.id_curso} value={c.id_curso}>
              [{c.codigo_curso}] {c.nombre_curso}
            </option>
          ))}
        </select>
      </div>

      {/* Error quitar */}
      {errorQuitar && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">
          {errorQuitar}
        </div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando secciones…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && secciones.length === 0 && (
          <EmptyState
            icono="📋"
            titulo="Sin secciones"
            descripcion="No hay secciones que coincidan con los filtros seleccionados."
          />
        )}
        {!cargando && !error && secciones.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Curso</th>
                  <th style={est.th}>Sec.</th>
                  <th style={est.th}>Período</th>
                  <th style={est.th}>Docente asignado</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map(s => {
                  const docente       = s.asignacion_activa?.docente
                  const nombreDocente = obtenerNombreDocente(docente)
                  const codigoDocente = obtenerCodigoDocente(docente)
                  const tieneDoc      = Boolean(docente)
                  const estaAsign     = seccionAsignando === s.id_seccion
                  const enAccion      = asignando === s.id_seccion || quitando === s.id_seccion

                  return (
                    <tr key={s.id_seccion} style={est.tr}>
                      {/* Curso */}
                      <td style={est.td}>
                        <div style={est.cursoNombre}>{s.curso?.nombre_curso ?? '—'}</div>
                        {s.curso?.codigo_curso && (
                          <code style={est.cursoCodigo}>{s.curso.codigo_curso}</code>
                        )}
                      </td>

                      {/* Número sección */}
                      <td style={est.td}>
                        <span style={est.numSeccion}>{s.numero_seccion}</span>
                      </td>

                      {/* Período */}
                      <td style={est.td}>
                        <div style={est.periodoNombre}>
                          {s.periodo_academico?.nombre_periodo ?? '—'}
                        </div>
                        {s.periodo_academico?.anio && (
                          <div style={est.periodoAnio}>{s.periodo_academico.anio}</div>
                        )}
                      </td>

                      {/* Docente */}
                      <td style={est.td}>
                        {tieneDoc ? (
                          <div>
                            <div style={est.docenteNombre}>
                              {nombreDocente ?? '—'}
                            </div>
                            {codigoDocente && (
                              <code style={est.cursoCodigo}>{codigoDocente}</code>
                            )}
                          </div>
                        ) : (
                          <span style={est.sinDocente}>Sin asignar</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td style={est.td}>
                        <Badge
                          texto={s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          variante={s.estado === 'activo' ? 'success' : 'neutral'}
                          dot
                        />
                      </td>

                      {/* Acciones */}
                      <td style={{ ...est.td, verticalAlign: 'top' }}>
                        {s.estado === 'activo' && !tieneDoc && !estaAsign && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variante="secondary" size="sm"
                              disabled={enAccion || cargandoCat}
                              onClick={() => abrirAsignacion(s.id_seccion)}
                            >
                              Asignar docente
                            </Button>
                          </div>
                        )}

                        {/* Selector inline de docente */}
                        {estaAsign && (
                          <div style={est.selectorWrapper}>
                            <select
                              value={docenteSelec}
                              onChange={e => { setDocenteSelec(e.target.value); setErrorAsig(null) }}
                              disabled={asignando === s.id_seccion}
                              style={est.selectDocente}
                            >
                              <option value="">— Selecciona docente —</option>
                              {docentes.map(d => (
                                <option key={d.id_docente} value={d.id_docente}>
                                  {obtenerNombreDocente(d) ?? d.codigo_docente ?? 'Docente'}
                                  {d.codigo_docente ? ` — ${d.codigo_docente}` : ''}
                                  {d.etiqueta_prioridad ? ` (${d.etiqueta_prioridad})` : ''}
                                </option>
                              ))}
                            </select>
                            {errorAsig && (
                              <p style={est.errorAsig}>{errorAsig}</p>
                            )}
                            <div style={est.botonesAsig}>
                              <Button
                                variante="ghost" size="sm"
                                onClick={cancelarAsignacion}
                                disabled={asignando === s.id_seccion}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variante="primary" size="sm"
                                cargando={asignando === s.id_seccion}
                                disabled={!docenteSelec || asignando === s.id_seccion}
                                onClick={() => onAsignar(s.id_seccion)}
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Quitar */}
                        {s.estado === 'activo' && tieneDoc && !estaAsign && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variante="danger" size="sm"
                              cargando={quitando === s.id_seccion}
                              disabled={enAccion}
                              onClick={() => onQuitar(s)}
                            >
                              Quitar docente
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!cargando && !error && secciones.length > 0 && (
        <p style={est.nota}>
          Docentes ordenados por prioridad. El backend valida el máximo de asignaciones
          y que no se repita ciclo semestral por docente en el mismo período.
        </p>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500,
  },
  alertaWarn: {
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: '#92400e', marginBottom: '16px',
  },
  filtros: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  select: {
    padding: '8px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13.5px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', outline: 'none',
  },
  tabla:   { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '11px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr:           { borderBottom: '1px solid var(--color-border)' },
  td:           { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  cursoNombre:  { fontWeight: 600, marginBottom: '2px' },
  cursoCodigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 6px', borderRadius: 'var(--radius-sm)',
    fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  numSeccion: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px',
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)',
    fontSize: '14px', fontWeight: 700,
  },
  periodoNombre: { fontWeight: 500 },
  periodoAnio:   { fontSize: '12px', color: 'var(--color-text-muted)' },
  docenteNombre: { fontWeight: 500, marginBottom: '2px' },
  sinDocente:    { color: 'var(--color-text-muted)', fontSize: '12.5px', fontStyle: 'italic' },

  selectorWrapper: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '10px', background: 'var(--color-bg)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    minWidth: '240px',
  },
  selectDocente: {
    padding: '8px 10px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%',
  },
  errorAsig: {
    fontSize: '12px', color: 'var(--color-error)', fontWeight: 500,
    margin: 0, lineHeight: 1.4,
  },
  botonesAsig: { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
  nota: { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
