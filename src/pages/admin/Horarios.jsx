import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import { useAuth }  from '../../context/AuthContext'
import { getCarreras }           from '../../api/carreras'
import { getCarreraConJornadas } from '../../api/carreraJornadas'
import { getPeriodos }  from '../../api/periodosAcademicos'
import {
  getHorarios,
  getDetallesHorario,
  getTransiciones,
  aprobarHorario,
  bloquearHorario,
  publicarHorario,
  generarHorario,
} from '../../api/horarios'

/**
 * Horarios — Paso 15
 *
 * Consulta y gestión de estados de horarios existentes.
 *
 * Permisos:
 *   GET  /horarios, /horarios/{id}/detalles, /transiciones → admin + coord
 *   PATCH aprobar / bloquear / publicar                    → solo admin
 *   El coordinador ve solo las carreras que coordina (filtrado en backend).
 *
 * Máquina de estados:
 *   generado → aprobar → aprobado → bloquear → bloqueado
 *                             ↓                      ↓
 *                          publicar             publicar
 *                             ↓                      ↓
 *                         publicado (terminal)
 *
 * Generación:
 *   POST /horarios/generar → admin + coord (endpoint creado en PARENTESIS técnico)
 *
 * NO implementado:
 *   - Edición manual de detalles
 *   - Reportes
 */

const ESTADO_BADGE = {
  borrador:   { texto: 'Borrador',   variante: 'neutral'  },
  generado:   { texto: 'Generado',   variante: 'info'     },
  aprobado:   { texto: 'Aprobado',   variante: 'success'  },
  bloqueado:  { texto: 'Bloqueado',  variante: 'warning'  },
  publicado:  { texto: 'Publicado',  variante: 'primary'  },
}

const ACCION_LABEL = {
  aprobar:  { label: 'Aprobar',   variante: 'secondary' },
  bloquear: { label: 'Bloquear',  variante: 'ghost'     },
  publicar: { label: 'Publicar',  variante: 'primary'   },
}

export default function Horarios() {
  const { perfilActivo } = useAuth()
  const esAdmin = perfilActivo === 'administrador'

  // ── Lista de horarios ──────────────────────────────────────
  const [horarios,    setHorarios]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)

  // ── Catálogos para filtros ─────────────────────────────────
  const [carreras,    setCarreras]    = useState([])
  const [periodos,    setPeriodos]    = useState([])
  const [cargandoCat, setCargandoCat] = useState(true)

  // ── Filtros ────────────────────────────────────────────────
  const [filtroCarrera,  setFiltroCarrera]  = useState('')
  const [filtroPeriodo,  setFiltroPeriodo]  = useState('')
  const [filtroEstado,   setFiltroEstado]   = useState('')

  // ── Generación de horario ──────────────────────────────────
  const [mostrarGen,      setMostrarGen]      = useState(false)
  const [genCarrera,      setGenCarrera]      = useState('')
  const [genJornadas,     setGenJornadas]     = useState([])  // jornadas_activas de carrera
  const [genCarreraJorn,  setGenCarreraJorn]  = useState('')
  const [genPeriodo,      setGenPeriodo]      = useState('')
  const [cargandoJorns,   setCargandoJorns]   = useState(false)
  const [generando,       setGenerando]       = useState(false)
  const [resultadoGen,    setResultadoGen]    = useState(null)
  const [errorGen,        setErrorGen]        = useState(null)

  // ── Detalle expandido de un horario ───────────────────────
  const [horarioAbierto,  setHorarioAbierto]  = useState(null)  // id_horario
  const [detalles,        setDetalles]        = useState([])
  const [transiciones,    setTransiciones]    = useState(null)  // { acciones, estado_actual }
  const [cargandoDet,     setCargandoDet]     = useState(false)
  const [errorDet,        setErrorDet]        = useState(null)

  // ── Transiciones ───────────────────────────────────────────
  const [ejecutando,     setEjecutando]    = useState(null)  // accion en proceso
  const [obsInput,       setObsInput]      = useState('')
  const [errorTransic,   setErrorTransic]  = useState(null)
  const [okTransic,      setOkTransic]     = useState(null)

  // ── Cargar horarios ────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroCarrera) params.id_carrera            = filtroCarrera
      if (filtroPeriodo) params.id_periodo_academico  = filtroPeriodo
      if (filtroEstado)  params.estado                = filtroEstado
      const data = await getHorarios(params)
      setHorarios(data.horarios ?? [])
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver los horarios.'
          : (err.response?.data?.message ?? 'Error al cargar horarios.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroCarrera, filtroPeriodo, filtroEstado])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar jornadas al seleccionar carrera para generación ─
  async function onGenCarreraChange(val) {
    setGenCarrera(val)
    setGenCarreraJorn('')
    setGenJornadas([])
    setResultadoGen(null)
    setErrorGen(null)
    if (!val) return
    setCargandoJorns(true)
    try {
      const data = await getCarreraConJornadas(Number(val))
      setGenJornadas(data.jornadas_activas ?? [])
    } catch { setGenJornadas([]) }
    finally { setCargandoJorns(false) }
  }

  // ── Ejecutar generación ────────────────────────────────────
  async function onGenerar() {
    if (!genPeriodo || !genCarreraJorn) return
    setGenerando(true)
    setResultadoGen(null)
    setErrorGen(null)
    try {
      const res = await generarHorario({
        id_periodo_academico: Number(genPeriodo),
        id_carrera_jornada:   Number(genCarreraJorn),
      })
      setResultadoGen(res)
      await cargar()  // refrescar lista de horarios
    } catch (err) {
      setErrorGen(err.response?.data?.message ?? 'Error al generar el horario.')
    } finally {
      setGenerando(false)
    }
  }

  // ── Cargar catálogos para filtros ──────────────────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCat(true)
      try {
        const [dc, dp] = await Promise.all([
          getCarreras({ estado: 'activo' }),
          getPeriodos(),
        ])
        setCarreras(dc)
        dp.sort((a, b) => (b.es_vigente ? 1 : 0) - (a.es_vigente ? 1 : 0) || (b.anio ?? 0) - (a.anio ?? 0))
        setPeriodos(dp)
      } catch { /* filtros quedan vacíos — no bloqueante */ }
      finally { setCargandoCat(false) }
    }
    cargarCatalogos()
  }, [])

  // ── Abrir / cerrar detalle de horario ──────────────────────
  async function abrirDetalle(idHorario) {
    if (horarioAbierto === idHorario) { cerrarDetalle(); return }
    setHorarioAbierto(idHorario)
    setDetalles([])
    setTransiciones(null)
    setErrorDet(null)
    setErrorTransic(null)
    setOkTransic(null)
    setObsInput('')
    setCargandoDet(true)
    try {
      const [dataDet, dataTrans] = await Promise.all([
        getDetallesHorario(idHorario),
        getTransiciones(idHorario),
      ])
      setDetalles(dataDet.detalles ?? [])
      setTransiciones(dataTrans)
    } catch (err) {
      setErrorDet(err.response?.data?.message ?? 'Error al cargar el detalle.')
    } finally {
      setCargandoDet(false)
    }
  }

  function cerrarDetalle() {
    setHorarioAbierto(null)
    setDetalles([])
    setTransiciones(null)
    setErrorDet(null)
    setErrorTransic(null)
    setOkTransic(null)
  }

  // ── Ejecutar transición (solo admin) ──────────────────────
  async function onTransicion(accion) {
    if (!esAdmin || !horarioAbierto) return
    setEjecutando(accion)
    setErrorTransic(null)
    setOkTransic(null)
    try {
      const obs = obsInput.trim() || null
      let res
      if (accion === 'aprobar')  res = await aprobarHorario(horarioAbierto, obs)
      if (accion === 'bloquear') res = await bloquearHorario(horarioAbierto, obs)
      if (accion === 'publicar') res = await publicarHorario(horarioAbierto, obs)

      setOkTransic(res?.message ?? 'Transición ejecutada correctamente.')
      setObsInput('')

      // Refrescar la lista y el detalle con el nuevo estado
      await cargar()
      // Refrescar transiciones del horario abierto
      const dataTrans = await getTransiciones(horarioAbierto)
      setTransiciones(dataTrans)

    } catch (err) {
      setErrorTransic(err.response?.data?.message ?? `Error al ejecutar ${accion}.`)
    } finally {
      setEjecutando(null)
    }
  }

  // ── Agrupar detalles por día ───────────────────────────────
  function agruparPorDia(detalles) {
    return detalles.reduce((acc, d) => {
      const dia = d.nombre_dia ?? 'Sin día'
      if (!acc[dia]) acc[dia] = []
      acc[dia].push(d)
      return acc
    }, {})
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Horarios"
        descripcion={
          esAdmin
            ? 'Consulta y gestiona el ciclo de vida de los horarios académicos.'
            : 'Consulta los horarios de las carreras que coordinas.'
        }
        accion={
          <Button variante="primary" onClick={() => { setMostrarGen(g => !g); setResultadoGen(null); setErrorGen(null) }}>
            {mostrarGen ? '▲ Ocultar generación' : '⚙ Generar horario'}
          </Button>
        }
      />

      {/* ── Panel de generación ──────────────────────────────── */}
      {mostrarGen && (
        <Card style={{ marginBottom: '20px' }}>
          <h2 style={est.genTitulo}>Generar horario automático</h2>
          <p style={est.genDesc}>
            Selecciona el período y la carrera-jornada. El sistema asignará bloques
            a las secciones con docente usando el algoritmo interno.
            Si el horario ya existe, se regenerará limpiando los detalles anteriores.
          </p>
          <div style={est.genGrid}>
            <div style={est.campo}>
              <label style={est.label}>Período académico</label>
              <select value={genPeriodo} onChange={e => setGenPeriodo(e.target.value)} style={est.select}
                disabled={generando}>
                <option value=''>— Selecciona un período —</option>
                {periodos.map(p => (
                  <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
                    {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''}{p.es_vigente ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={est.campo}>
              <label style={est.label}>Carrera</label>
              <select value={genCarrera} onChange={e => onGenCarreraChange(e.target.value)} style={est.select}
                disabled={generando}>
                <option value=''>— Selecciona una carrera —</option>
                {carreras.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                ))}
              </select>
            </div>
            <div style={est.campo}>
              <label style={est.label}>Jornada</label>
              <select value={genCarreraJorn} onChange={e => setGenCarreraJorn(e.target.value)} style={est.select}
                disabled={!genCarrera || cargandoJorns || generando}>
                <option value=''>
                  {cargandoJorns ? 'Cargando…' : '— Selecciona una jornada —'}
                </option>
                {genJornadas.map(j => (
                  <option key={j.pivot?.id_carrera_jornada} value={j.pivot?.id_carrera_jornada}>
                    {j.nombre_jornada}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resultado de generación */}
          {resultadoGen && (
            <div style={est.genResultado}>
              <p style={est.genOk}>✓ {resultadoGen.message}</p>
              <div style={est.genResumen}>
                <span>Asignadas: <strong>{resultadoGen.resumen?.asignadas ?? 0}</strong></span>
                <span>No asignadas: <strong>{resultadoGen.resumen?.no_asignadas ?? 0}</strong></span>
                <span>Detalles insertados: <strong>{resultadoGen.resumen?.detalles_insertados ?? 0}</strong></span>
              </div>
              {resultadoGen.no_asignadas?.length > 0 && (
                <p style={est.genWarn}>
                  ⚠ {resultadoGen.no_asignadas.length} sección{resultadoGen.no_asignadas.length !== 1 ? 'es' : ''} no
                  {' '}pudieron asignarse (sin bloque disponible o conflicto de disponibilidad).
                </p>
              )}
            </div>
          )}
          {errorGen && (
            <div style={est.alertaError} role='alert'>{errorGen}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button
              variante='primary'
              cargando={generando}
              disabled={!genPeriodo || !genCarreraJorn || generando}
              onClick={onGenerar}
            >
              Generar horario
            </Button>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <div style={est.filtros}>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="generado">Generado</option>
          <option value="aprobado">Aprobado</option>
          <option value="bloqueado">Bloqueado</option>
          <option value="publicado">Publicado</option>
        </select>
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={est.select}
          disabled={cargandoCat}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => (
            <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
              {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''}{p.es_vigente ? ' ★' : ''}
            </option>
          ))}
        </select>
        <select value={filtroCarrera} onChange={e => setFiltroCarrera(e.target.value)} style={est.select}
          disabled={cargandoCat}>
          <option value="">Todas las carreras</option>
          {carreras.map(c => (
            <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
          ))}
        </select>
      </div>

      {/* Lista de horarios */}
      <Card padding="0" style={{ marginBottom: horarioAbierto ? '20px' : 0 }}>
        {cargando  && <LoadingState texto="Cargando horarios…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && horarios.length === 0 && (
          <EmptyState
            icono="📅"
            titulo="Sin horarios registrados"
            descripcion="Los horarios aparecerán aquí una vez que sean generados."
          />
        )}
        {!cargando && !error && horarios.length > 0 && (
          <table style={est.tabla}>
            <thead>
              <tr>
                <th style={est.th}>Carrera</th>
                <th style={est.th}>Período</th>
                <th style={est.th}>Estado</th>
                <th style={est.th}>Clases</th>
                <th style={{ ...est.th, textAlign: 'right' }}>Ver detalle</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map(h => {
                const badgeMeta = ESTADO_BADGE[h.estado_horario?.nombre_estado]
                               ?? ESTADO_BADGE[h.estado]
                               ?? { texto: h.estado ?? '—', variante: 'neutral' }
                const abierto = horarioAbierto === h.id_horario
                return (
                  <tr key={h.id_horario} style={{
                    ...est.tr,
                    ...(abierto ? { background: 'var(--color-primary-subtle)' } : {}),
                  }}>
                    <td style={est.td}>
                      <div style={est.nombreCarrera}>{h.carrera?.nombre_carrera ?? '—'}</div>
                      {h.carrera?.codigo_carrera && (
                        <code style={est.codigoCarrera}>{h.carrera.codigo_carrera}</code>
                      )}
                    </td>
                    <td style={est.td}>
                      <div>{h.periodo_academico?.nombre_periodo ?? '—'}</div>
                      {h.periodo_academico?.anio && (
                        <div style={est.periodoAnio}>{h.periodo_academico.anio}</div>
                      )}
                    </td>
                    <td style={est.td}>
                      <Badge texto={badgeMeta.texto} variante={badgeMeta.variante} dot />
                    </td>
                    <td style={est.td}>
                      <span style={est.totalDet}>
                        {h.total_detalles ?? '—'}
                      </span>
                    </td>
                    <td style={{ ...est.td, textAlign: 'right' }}>
                      <Button
                        variante={abierto ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => abrirDetalle(h.id_horario)}
                      >
                        {abierto ? '▲ Cerrar' : '▼ Ver detalles'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Panel de detalle del horario abierto ──────────────── */}
      {horarioAbierto && (
        <Card>
          {cargandoDet && <LoadingState texto="Cargando detalles y transiciones…" />}
          {!cargandoDet && errorDet && <ErrorState mensaje={errorDet} />}

          {!cargandoDet && !errorDet && (
            <div style={est.detalleWrapper}>

              {/* Encabezado del detalle */}
              <div style={est.detalleCabecera}>
                <div>
                  <h2 style={est.detalleTitulo}>
                    Detalles del horario #{horarioAbierto}
                  </h2>
                  {transiciones && (
                    <p style={est.estadoActual}>
                      Estado actual:{' '}
                      <strong>{transiciones.estado_actual}</strong>
                      {transiciones.es_terminal && (
                        <span style={est.terminal}> — estado terminal (publicado)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Botones de transición — solo admin */}
                {esAdmin && transiciones && transiciones.acciones.length > 0 && (
                  <div style={est.transicionesWrapper}>
                    <div style={est.transicionesBotones}>
                      {transiciones.acciones.map(accion => {
                        const meta = ACCION_LABEL[accion] ?? { label: accion, variante: 'ghost' }
                        return (
                          <Button
                            key={accion}
                            variante={meta.variante}
                            size="sm"
                            cargando={ejecutando === accion}
                            disabled={ejecutando !== null}
                            onClick={() => onTransicion(accion)}
                          >
                            {meta.label}
                          </Button>
                        )
                      })}
                    </div>
                    <input
                      type="text"
                      placeholder="Observación opcional para la transición…"
                      value={obsInput}
                      onChange={e => setObsInput(e.target.value)}
                      maxLength={200}
                      style={est.inputObs}
                    />
                    {okTransic    && <p style={est.okMsg}>✓ {okTransic}</p>}
                    {errorTransic && <p style={est.errorMsg}>{errorTransic}</p>}
                  </div>
                )}
              </div>

              {/* Tabla de detalles (clases) */}
              {detalles.length === 0 ? (
                <EmptyState
                  icono="🕐"
                  titulo="Sin clases en este horario"
                  descripcion="El horario no tiene detalles activos registrados."
                />
              ) : (
                <>
                  {/* Agrupar por día */}
                  {Object.entries(agruparPorDia(detalles)).map(([dia, clases]) => (
                    <div key={dia} style={est.diaBloque}>
                      <div style={est.diaLabel}>{dia}</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={est.tablaInterna}>
                          <thead>
                            <tr>
                              <th style={est.thInt}>Horario</th>
                              <th style={est.thInt}>Curso</th>
                              <th style={est.thInt}>Sección</th>
                              <th style={est.thInt}>Docente</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clases.map(d => (
                              <tr key={d.id_detalle_horario} style={est.trInt}>
                                <td style={est.tdInt}>
                                  <code style={est.horaChip}>
                                    {d.hora_inicio?.slice(0,5)}–{d.hora_fin?.slice(0,5)}
                                  </code>
                                </td>
                                <td style={est.tdInt}>
                                  <div style={est.cursoNombre}>{d.nombre_curso}</div>
                                  <code style={est.cursoCodigo}>{d.codigo_curso}</code>
                                </td>
                                <td style={est.tdInt}>
                                  <span style={est.seccionBadge}>{d.numero_seccion}</span>
                                </td>
                                <td style={est.tdInt}>
                                  <div>{d.nombre_docente}</div>
                                  {d.codigo_docente && (
                                    <code style={est.cursoCodigo}>{d.codigo_docente}</code>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  <p style={est.nota}>
                    Total: {detalles.length} clase{detalles.length !== 1 ? 's' : ''} en este horario.
                  </p>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
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
  tr:            { borderBottom: '1px solid var(--color-border)' },
  td:            { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombreCarrera: { fontWeight: 600, marginBottom: '2px' },
  codigoCarrera: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 6px', borderRadius: 'var(--radius-sm)',
    fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  periodoAnio: { fontSize: '12px', color: 'var(--color-text-muted)' },
  totalDet:    { fontWeight: 600, color: 'var(--color-primary)' },

  // Panel de detalle
  detalleWrapper:   { display: 'flex', flexDirection: 'column', gap: '20px' },
  detalleCabecera:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' },
  detalleTitulo:    { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' },
  estadoActual:     { fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 },
  terminal:         { color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 400 },

  transicionesWrapper: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '240px' },
  transicionesBotones: { display: 'flex', gap: '8px' },
  inputObs: {
    padding: '7px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%',
  },
  okMsg:    { fontSize: '12.5px', color: '#166534', fontWeight: 500, margin: 0 },
  errorMsg: { fontSize: '12.5px', color: 'var(--color-error)', fontWeight: 500, margin: 0 },

  // Tabla interna de detalles por día
  diaBloque:   { borderTop: '1px solid var(--color-border)', paddingTop: '12px' },
  diaLabel: {
    fontSize: '12px', fontWeight: 700, textTransform: 'capitalize',
    color: 'var(--color-text-secondary)', letterSpacing: '.04em',
    marginBottom: '8px',
  },
  tablaInterna: { width: '100%', borderCollapse: 'collapse' },
  thInt: {
    padding: '8px 12px', background: 'var(--color-bg)',
    fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)',
  },
  trInt:       { borderBottom: '1px solid var(--color-border)' },
  tdInt:       { padding: '10px 12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'middle' },
  horaChip: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 6px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  cursoNombre:  { fontWeight: 500, marginBottom: '2px' },
  cursoCodigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 5px', borderRadius: 'var(--radius-sm)',
    fontSize: '11px', fontFamily: 'var(--font-mono)',
  },
  seccionBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px',
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)',
    fontSize: '13px', fontWeight: 700,
  },
  nota: { fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right', margin: '4px 0 0' },
  // Estilos del panel de generación
  genTitulo:    { fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' },
  genDesc:      { fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 },
  genGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' },
  campo:        { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:        { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  genResultado: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '12px' },
  genOk:        { fontSize: '13.5px', color: '#166534', fontWeight: 600, margin: '0 0 8px' },
  genResumen:   { display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' },
  genWarn:      { fontSize: '12.5px', color: '#92400e', marginTop: '8px', margin: '8px 0 0' },
  alertaError:  { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500 },
}
