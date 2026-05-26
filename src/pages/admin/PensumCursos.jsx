import { useState, useEffect, useCallback } from 'react'
import PageHeader    from '../../components/ui/PageHeader'
import Card          from '../../components/ui/Card'
import Button        from '../../components/ui/Button'
import Badge         from '../../components/ui/Badge'
import EmptyState    from '../../components/ui/EmptyState'
import LoadingState  from '../../components/ui/LoadingState'
import ErrorState    from '../../components/ui/ErrorState'
import { getPensums }                                           from '../../api/pensum'
import { getCursos }                                           from '../../api/cursos'
import { getCursosPensum, asociarCurso, actualizarCiclo, quitarCurso } from '../../api/pensumCursos'

/**
 * PensumCursos — gestión de asociaciones curso ↔ pensum.
 *
 * Flujo:
 *   1. Seleccionar pensum → ver sus cursos asociados
 *   2. Asociar nuevos cursos con ciclo_semestre
 *   3. Editar ciclo_semestre de asociaciones existentes (inline)
 *   4. Quitar asociaciones (estado → inactivo)
 *
 * Endpoints:
 *   GET    /pensums                       lista de pensums
 *   GET    /cursos?estado=activo          catálogo de cursos
 *   GET    /pensums/{id}/cursos           cursos del pensum seleccionado
 *   POST   /pensums/{id}/cursos           asociar curso
 *   PATCH  /pensums/{id}/cursos/{pc}      editar ciclo_semestre
 *   DELETE /pensums/{id}/cursos/{pc}      desactivar asociación
 */
export default function PensumCursos() {
  // ── Catálogos ──────────────────────────────────────────────
  const [pensums,      setPensums]      = useState([])
  const [cursosCat,    setCursosCat]    = useState([])   // catálogo global
  const [cargandoCat,  setCargandoCat]  = useState(true)
  const [errorCat,     setErrorCat]     = useState(null)

  // ── Pensum seleccionado ────────────────────────────────────
  const [idPensum,       setIdPensum]       = useState('')
  const [pensumActual,   setPensumActual]   = useState(null)

  // ── Cursos asociados al pensum ─────────────────────────────
  const [asociaciones,      setAsociaciones]      = useState([])
  const [cargandoAsoc,      setCargandoAsoc]      = useState(false)
  const [errorAsoc,         setErrorAsoc]         = useState(null)
  const [filtroEstadoAsoc,  setFiltroEstadoAsoc]  = useState('activo')
  const [filtroCiclo,       setFiltroCiclo]        = useState('')

  // ── Lista activa separada (para selector) ──────────────
  // Siempre ?estado=activo, independiente de los filtros de la tabla.
  const [asocActivas, setAsocActivas] = useState([])

  // ── Formulario de asociar ──────────────────────────────────
  const [formNuevo,     setFormNuevo]     = useState({ id_curso: '', ciclo_semestre: '', bloques_semanales: 1 })
  const [asociando,     setAsociando]     = useState(false)
  const [erroresAsoc,   setErroresAsoc]   = useState({})
  const [errorFormAsoc, setErrorFormAsoc] = useState(null)
  const [okAsoc,        setOkAsoc]        = useState(null)

  // ── Edición inline de ciclo_semestre y bloques_semanales ──
  const [editandoId,   setEditandoId]   = useState(null)  // id_pensum_curso en edición
  const [cicloEdit,    setCicloEdit]    = useState('')
  const [bloquesEdit,  setBloquesEdit]  = useState(1)
  const [guardandoEdit,setGuardandoEdit]= useState(false)
  const [errorEdit,    setErrorEdit]    = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [quitando,   setQuitando]   = useState(null)
  const [errorQuitar,setErrorQuitar]= useState(null)

  // ── Cargar catálogos al montar ─────────────────────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCat(true)
      setErrorCat(null)
      try {
        const [dataPensums, dataCursos] = await Promise.all([
          getPensums({ estado: 'activo' }),
          getCursos({ estado: 'activo' }),
        ])
        setPensums(dataPensums)
        setCursosCat(dataCursos)
      } catch (err) {
        setErrorCat(
          err.response?.status === 403
            ? 'No tienes permisos para este módulo.'
            : 'Error al cargar pensums o cursos. Recarga la página.'
        )
      } finally {
        setCargandoCat(false)
      }
    }
    cargarCatalogos()
  }, [])

  // ── Cargar cursos del pensum seleccionado ──────────────────
  const cargarCursosPensum = useCallback(async () => {
    if (!idPensum) { setAsociaciones([]); return }
    setCargandoAsoc(true)
    setErrorAsoc(null)
    try {
      const params = {}
      if (filtroEstadoAsoc) params.estado          = filtroEstadoAsoc
      if (filtroCiclo)      params.ciclo_semestre  = filtroCiclo
      setAsociaciones(await getCursosPensum(Number(idPensum), params))
    } catch (err) {
      setErrorAsoc(err.response?.data?.message ?? 'Error al cargar los cursos del pensum.')
    } finally {
      setCargandoAsoc(false)
    }
  }, [idPensum, filtroEstadoAsoc, filtroCiclo])

  useEffect(() => { cargarCursosPensum() }, [cargarCursosPensum])

  // ── Cargar asociaciones activas (sin filtros) — solo para el selector ─
  const cargarAsocActivas = useCallback(async () => {
    if (!idPensum) { setAsocActivas([]); return }
    try {
      setAsocActivas(await getCursosPensum(Number(idPensum), { estado: 'activo' }))
    } catch {
      // Fallo silencioso — el selector puede quedar incompleto,
      // pero el backend igualmente rechazaría un duplicado con 422.
    }
  }, [idPensum])

  useEffect(() => { cargarAsocActivas() }, [cargarAsocActivas])

  // ── Seleccionar pensum ─────────────────────────────────────
  function onSeleccionarPensum(e) {
    const val = e.target.value
    setIdPensum(val)
    setPensumActual(pensums.find(p => p.id_pensum === Number(val)) ?? null)
    setFormNuevo({ id_curso: '', ciclo_semestre: '', bloques_semanales: 1 })
    setErroresAsoc({})
    setErrorFormAsoc(null)
    setOkAsoc(null)
    setEditandoId(null)
    setErrorQuitar(null)
  }

  // ── IDs activos derivados de asocActivas (independiente de filtros de tabla) ─
  const idsAsocActivos = new Set(asocActivas.map(a => a.id_curso))

  // ── Asociar curso ──────────────────────────────────────────
  async function onAsociar(e) {
    e.preventDefault()
    setAsociando(true)
    setErroresAsoc({})
    setErrorFormAsoc(null)
    setOkAsoc(null)
    try {
      await asociarCurso(Number(idPensum), {
        id_curso:       Number(formNuevo.id_curso),
        ciclo_semestre:    Number(formNuevo.ciclo_semestre),
        bloques_semanales: Number(formNuevo.bloques_semanales) || 1,
      })
      setOkAsoc('Curso asociado correctamente.')
      setFormNuevo({ id_curso: '', ciclo_semestre: '', bloques_semanales: 1 })
      await cargarCursosPensum()
      await cargarAsocActivas() // mantener selector sincronizado
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErroresAsoc(err.response?.data?.errors ?? {})
        setErrorFormAsoc(err.response?.data?.message ?? null)
      } else if (status === 403) {
        setErrorFormAsoc('No tienes permisos para esta acción.')
      } else {
        setErrorFormAsoc(err.response?.data?.message ?? 'Error al asociar el curso.')
      }
    } finally {
      setAsociando(false)
    }
  }

  // ── Edición inline de ciclo_semestre y bloques_semanales ──
  function abrirEdicion(asoc) {
    setEditandoId(asoc.id_pensum_curso)
    setCicloEdit(String(asoc.ciclo_semestre))
    setBloquesEdit(asoc.bloques_semanales ?? 1)
    setErrorEdit(null)
  }
  function cancelarEdicion() {
    setEditandoId(null)
    setCicloEdit('')
    setBloquesEdit(1)
    setErrorEdit(null)
  }

  async function onGuardarCiclo(asoc) {
    setGuardandoEdit(true)
    setErrorEdit(null)
    try {
      await actualizarCiclo(Number(idPensum), asoc.id_pensum_curso, {
        ciclo_semestre:    Number(cicloEdit),
        bloques_semanales: Number(bloquesEdit) || 1,
      })
      setEditandoId(null)
      await cargarCursosPensum()
    } catch (err) {
      const msg = err.response?.data?.errors?.ciclo_semestre?.[0]
              ?? err.response?.data?.errors?.bloques_semanales?.[0]
              ?? err.response?.data?.message
              ?? 'Error al actualizar.'
      setErrorEdit(msg)
    } finally {
      setGuardandoEdit(false)
    }
  }

  // ── Quitar asociación ──────────────────────────────────────
  async function onQuitar(asoc) {
    if (!window.confirm(`¿Quitar "${asoc.curso?.nombre_curso}" del pensum?`)) return
    setQuitando(asoc.id_pensum_curso)
    setErrorQuitar(null)
    try {
      await quitarCurso(Number(idPensum), asoc.id_pensum_curso)
      await cargarCursosPensum()
      await cargarAsocActivas() // mantener selector sincronizado
    } catch (err) {
      setErrorQuitar(err.response?.data?.message ?? 'No se pudo quitar el curso.')
    } finally {
      setQuitando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Cursos por pensum"
        descripcion="Asocia cursos a cada pensum y define su ciclo semestral."
      />

      {errorCat  && <ErrorState mensaje={errorCat} />}
      {cargandoCat && <LoadingState texto="Cargando pensums y cursos…" />}

      {!cargandoCat && !errorCat && (
        <>
          {/* ── Selector de pensum ──────────────────────────── */}
          <Card style={{ marginBottom: '20px' }}>
            <div style={est.campo}>
              <label style={est.label}>Pensum</label>
              <select value={idPensum} onChange={onSeleccionarPensum} style={est.select}>
                <option value="">— Selecciona un pensum —</option>
                {pensums.map(p => (
                  <option key={p.id_pensum} value={p.id_pensum}>
                    {p.nombre_pensum}
                    {p.codigo_pensum ? ` [${p.codigo_pensum}]` : ''}
                    {p.carrera ? ` — ${p.carrera.nombre_carrera}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {pensumActual && (
              <div style={est.pensumInfo}>
                <span style={est.pensumBadge}>{pensumActual.codigo_pensum}</span>
                <span style={est.pensumNombre}>{pensumActual.carrera?.nombre_carrera}</span>
                <span style={est.pensumPeriodo}>
                  {pensumActual.periodoAcademico?.nombre_periodo} ({pensumActual.periodoAcademico?.anio})
                </span>
              </div>
            )}
          </Card>

          {idPensum && (
            <div style={est.mainGrid}>

              {/* ── Panel izquierdo: asociar curso ─────────── */}
              <Card>
                <h2 style={est.panelTitulo}>Asociar curso</h2>
                <p style={est.panelDesc}>
                  Los cursos ya asociados y activos no aparecen en el selector.
                </p>

                <form onSubmit={onAsociar} noValidate style={est.form}>
                  {/* Select de curso */}
                  <div style={est.campo}>
                    <label style={est.label}>Curso <span style={est.req}>*</span></label>
                    <select
                      value={formNuevo.id_curso}
                      onChange={e => setFormNuevo(f => ({ ...f, id_curso: e.target.value }))}
                      disabled={asociando}
                      style={{ ...est.select, ...(erroresAsoc.id_curso ? est.inputErr : {}) }}
                    >
                      <option value="">— Selecciona un curso —</option>
                      {cursosCat
                        .filter(c => !idsAsocActivos.has(c.id_curso))
                        .map(c => (
                          <option key={c.id_curso} value={c.id_curso}>
                            [{c.codigo_curso}] {c.nombre_curso}
                          </option>
                        ))
                      }
                    </select>
                    {erroresAsoc.id_curso && (
                      <span style={est.errorMsg}>{erroresAsoc.id_curso[0]}</span>
                    )}
                  </div>

                  {/* Ciclo semestral */}
                  <div style={est.campo}>
                    <label style={est.label}>Ciclo semestral <span style={est.req}>*</span></label>
                    <input
                      type="number" min={1} max={15}
                      value={formNuevo.ciclo_semestre}
                      onChange={e => setFormNuevo(f => ({ ...f, ciclo_semestre: e.target.value }))}
                      placeholder="1 – 15"
                      disabled={asociando}
                      style={{ ...est.input, ...(erroresAsoc.ciclo_semestre ? est.inputErr : {}) }}
                    />
                    {erroresAsoc.ciclo_semestre && (
                      <span style={est.errorMsg}>{erroresAsoc.ciclo_semestre[0]}</span>
                    )}
                  </div>

                  {/* Bloques semanales */}
                  <div style={est.campo}>
                    <label style={est.label}>Bloques por semana <span style={est.req}>*</span></label>
                    <select
                      value={formNuevo.bloques_semanales}
                      onChange={e => setFormNuevo(f => ({ ...f, bloques_semanales: Number(e.target.value) }))}
                      disabled={asociando}
                      style={{ ...est.input, ...(erroresAsoc.bloques_semanales ? est.inputErr : {}) }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} bloque{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    {erroresAsoc.bloques_semanales && (
                      <span style={est.errorMsg}>{erroresAsoc.bloques_semanales[0]}</span>
                    )}
                  </div>

                  {okAsoc    && <div style={est.alertaOk}>✓ {okAsoc}</div>}
                  {errorFormAsoc && <div style={est.alertaError} role="alert">{errorFormAsoc}</div>}

                  <Button
                    type="submit" variante="primary" cargando={asociando}
                    disabled={!formNuevo.id_curso || !formNuevo.ciclo_semestre || asociando}
                  >
                    Asociar al pensum
                  </Button>
                </form>
              </Card>

              {/* ── Panel derecho: cursos del pensum ─────────── */}
              <Card padding="0">
                {/* Filtros de la tabla */}
                <div style={est.filtrosTabla}>
                  <select
                    value={filtroEstadoAsoc}
                    onChange={e => setFiltroEstadoAsoc(e.target.value)}
                    style={{ ...est.selectSm }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                  <input
                    type="number" min={1} max={15}
                    placeholder="Ciclo…"
                    value={filtroCiclo}
                    onChange={e => setFiltroCiclo(e.target.value)}
                    style={{ ...est.input, width: '80px' }}
                  />
                </div>

                {errorQuitar && (
                  <div style={{ ...est.alertaError, margin: '12px 16px 0' }} role="alert">
                    {errorQuitar}
                  </div>
                )}

                {cargandoAsoc && <LoadingState texto="Cargando cursos…" alto="100px" />}

                {!cargandoAsoc && errorAsoc && (
                  <ErrorState mensaje={errorAsoc} onReintentar={cargarCursosPensum} />
                )}

                {!cargandoAsoc && !errorAsoc && asociaciones.length === 0 && (
                  <EmptyState
                    icono="📖"
                    titulo="Sin cursos asociados"
                    descripcion="Asocia cursos usando el formulario de la izquierda."
                  />
                )}

                {!cargandoAsoc && !errorAsoc && asociaciones.length > 0 && (
                  <table style={est.tabla}>
                    <thead>
                      <tr>
                        <th style={est.th}>Curso</th>
                        <th style={est.th}>Ciclo</th>
                        <th style={est.th}>Bloques/sem.</th>
                        <th style={est.th}>Estado</th>
                        <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asociaciones.map(a => {
                        const enAccion = quitando === a.id_pensum_curso
                                       || guardandoEdit && editandoId === a.id_pensum_curso
                        return (
                          <tr key={a.id_pensum_curso} style={est.tr}>
                            <td style={est.td}>
                              <div style={est.cursoNombre}>{a.curso?.nombre_curso ?? '—'}</div>
                              <code style={est.cursoCodigo}>{a.curso?.codigo_curso}</code>
                            </td>
                            <td style={est.td}>
                              {editandoId === a.id_pensum_curso ? (
                                <div style={est.editInline}>
                                  <input
                                    type="number" min={1} max={15}
                                    value={cicloEdit}
                                    onChange={e => setCicloEdit(e.target.value)}
                                    disabled={guardandoEdit}
                                    style={{ ...est.input, width: '60px', padding: '5px 8px' }}
                                    autoFocus
                                  />
                                  {errorEdit && <span style={est.errorMsg}>{errorEdit}</span>}
                                </div>
                              ) : (
                                <Badge
                                  texto={`Ciclo ${a.ciclo_semestre}`}
                                  variante="info"
                                />
                              )}
                            </td>
                            {/* Bloques semanales */}
                            <td style={est.td}>
                              {editandoId === a.id_pensum_curso ? (
                                <select
                                  value={bloquesEdit}
                                  onChange={e => setBloquesEdit(Number(e.target.value))}
                                  disabled={guardandoEdit}
                                  style={{ ...est.input, width: '80px', padding: '5px 8px' }}
                                >
                                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                              ) : (
                                <Badge
                                  texto={`${a.bloques_semanales ?? 1} blq`}
                                  variante={a.bloques_semanales > 1 ? 'warning' : 'neutral'}
                                />
                              )}
                            </td>
                            <td style={est.td}>
                              <Badge
                                texto={a.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                variante={a.estado === 'activo' ? 'success' : 'neutral'}
                                dot
                              />
                            </td>
                            <td style={{ ...est.td, textAlign: 'right' }}>
                              {editandoId === a.id_pensum_curso ? (
                                <div style={est.acciones}>
                                  <Button
                                    variante="primary" size="sm"
                                    cargando={guardandoEdit}
                                    disabled={!cicloEdit}
                                    onClick={() => onGuardarCiclo(a)}
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    variante="ghost" size="sm"
                                    onClick={cancelarEdicion}
                                    disabled={guardandoEdit}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div style={est.acciones}>
                                  {a.estado === 'activo' && (
                                    <>
                                      <Button
                                        variante="ghost" size="sm"
                                        onClick={() => abrirEdicion(a)}
                                        disabled={enAccion}
                                      >
                                        Editar ciclo
                                      </Button>
                                      <Button
                                        variante="danger" size="sm"
                                        cargando={quitando === a.id_pensum_curso}
                                        disabled={enAccion}
                                        onClick={() => onQuitar(a)}
                                      >
                                        Quitar
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </Card>

            </div>
          )}

          {!idPensum && (
            <EmptyState
              icono="📋"
              titulo="Selecciona un pensum"
              descripcion="Los cursos asociados aparecerán aquí."
            />
          )}
        </>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px', alignItems: 'start',
  },
  pensumInfo: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginTop: '12px', flexWrap: 'wrap',
  },
  pensumBadge: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
  },
  pensumNombre: { fontSize: '13px', fontWeight: 600 },
  pensumPeriodo:{ fontSize: '12px', color: 'var(--color-text-muted)' },

  panelTitulo: { fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' },
  panelDesc:   { fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 },

  form:  { display: 'flex', flexDirection: 'column', gap: '14px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:   { color: 'var(--color-error)' },
  select: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
  },
  selectSm: {
    padding: '6px 10px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', outline: 'none',
  },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  alertaOk: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '9px 12px',
    fontSize: '13px', color: '#166534', fontWeight: 500,
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '9px 12px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500,
  },
  filtrosTabla: {
    display: 'flex', gap: '8px', padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', alignItems: 'center',
  },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr:         { borderBottom: '1px solid var(--color-border)' },
  td:         { padding: '11px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  cursoNombre:{ fontWeight: 600, marginBottom: '2px' },
  cursoCodigo:{
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 5px', borderRadius: 'var(--radius-sm)',
    fontSize: '11px', fontFamily: 'var(--font-mono)',
  },
  editInline: { display: 'flex', flexDirection: 'column', gap: '4px' },
  acciones:   { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
}
