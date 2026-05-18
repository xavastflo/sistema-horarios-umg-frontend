import { useState, useEffect, useCallback } from 'react'
import PageHeader    from '../../components/ui/PageHeader'
import Card          from '../../components/ui/Card'
import Button        from '../../components/ui/Button'
import Badge         from '../../components/ui/Badge'
import EmptyState    from '../../components/ui/EmptyState'
import LoadingState  from '../../components/ui/LoadingState'
import ErrorState    from '../../components/ui/ErrorState'
import { getCarreras }                                   from '../../api/carreras'
import { getCarreraConJornadas }                         from '../../api/carreraJornadas'
import {
  getBloquesPorCarreraJornada,
  generarBloques,
  crearBloque,
  eliminarBloque,
  getDias,
} from '../../api/bloquesHorarios'

/**
 * BloquesHorarios — módulo de gestión de bloques horarios.
 *
 * Dos secciones:
 *   1. Generación automática — la forma principal de crear bloques
 *   2. Bloques existentes — vista agrupada por día para la carrera-jornada seleccionada
 *
 * No existe PUT para bloques: sin edición de bloques existentes.
 */
export default function BloquesHorarios() {
  // ── Catálogos ──────────────────────────────────────────────
  const [carreras,     setCarreras]     = useState([])
  const [dias,         setDias]         = useState([])
  const [cargandoCat,  setCargandoCat]  = useState(true)
  const [errorCat,     setErrorCat]     = useState(null)

  // ── Selección de carrera y jornada ─────────────────────────
  const [idCarrera,         setIdCarrera]         = useState('')
  const [jornadasCarrera,   setJornadasCarrera]   = useState([])  // jornadasActivas de la carrera
  const [idCarreraJornada,  setIdCarreraJornada]  = useState('')
  const [cargandoJornadas,  setCargandoJornadas]  = useState(false)

  // ── Vista de bloques existentes ────────────────────────────
  const [bloquesPorDia,     setBloquesPorDia]     = useState({})
  const [infoCarreraJorn,   setInfoCarreraJorn]   = useState(null)
  const [cargandoBloques,   setCargandoBloques]   = useState(false)
  const [errorBloques,      setErrorBloques]      = useState(null)

  // ── Generación automática ──────────────────────────────────
  const [formGen, setFormGen] = useState({
    hora_inicio_general: '18:00',
    hora_fin_general:    '21:00',
    duracion_minutos:    '90',
    exclusiones:         '',   // texto libre "13:00-14:00, ..."
  })
  const [diasSelGen,    setDiasSelGen]    = useState([])
  const [generando,     setGenerando]    = useState(false)
  const [resultadoGen,  setResultadoGen] = useState(null)
  const [errorGen,      setErrorGen]     = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [eliminando,    setEliminando]   = useState(null)
  const [errorElim,     setErrorElim]    = useState(null)

  // ── Creación individual ────────────────────────────────
  const [formInd,     setFormInd]     = useState({
    id_dia: '', hora_inicio: '', hora_fin: '', duracion_minutos: '90',
  })
  const [creando,     setCreando]     = useState(false)
  const [erroresInd,  setErroresInd]  = useState({})
  const [errorInd,    setErrorInd]    = useState(null)
  const [okInd,       setOkInd]       = useState(null)

  // ── Cargar catálogos al montar ─────────────────────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCat(true)
      setErrorCat(null)
      try {
        const [dataCarreras, dataDias] = await Promise.all([
          getCarreras({ estado: 'activo' }),
          getDias(),
        ])
        setCarreras(dataCarreras)
        setDias(dataDias)
      } catch (err) {
        setErrorCat(
          err.response?.status === 403
            ? 'No tienes permisos para este módulo.'
            : 'Error al cargar datos. Recarga la página.'
        )
      } finally {
        setCargandoCat(false)
      }
    }
    cargarCatalogos()
  }, [])

  // ── Al cambiar carrera: cargar sus jornadas ────────────────
  async function onCarreraChange(e) {
    const val = e.target.value
    setIdCarrera(val)
    setIdCarreraJornada('')
    setJornadasCarrera([])
    setBloquesPorDia({})
    setInfoCarreraJorn(null)
    setResultadoGen(null)
    setErrorGen(null)
    setDiasSelGen([])
    if (!val) return
    setCargandoJornadas(true)
    try {
      const data = await getCarreraConJornadas(Number(val))
      setJornadasCarrera(data.jornadas_activas ?? [])  // snake_case: serialización Eloquent
    } catch {
      setJornadasCarrera([])
    } finally {
      setCargandoJornadas(false)
    }
  }

  // ── Al cambiar jornada: cargar bloques existentes ──────────
  const cargarBloques = useCallback(async (idCJ) => {
    if (!idCJ) { setBloquesPorDia({}); return }
    setCargandoBloques(true)
    setErrorBloques(null)
    try {
      const data = await getBloquesPorCarreraJornada(Number(idCJ))
      setBloquesPorDia(data.bloques_por_dia ?? {})
      setInfoCarreraJorn(data.carrera_jornada ?? null)
    } catch (err) {
      setErrorBloques(err.response?.data?.message ?? 'Error al cargar bloques.')
    } finally {
      setCargandoBloques(false)
    }
  }, [])

  function onJornadaChange(e) {
    const val = e.target.value
    setIdCarreraJornada(val)
    setResultadoGen(null)
    setErrorGen(null)
    setDiasSelGen([])
    setErrorElim(null)
    cargarBloques(val)
  }

  // ── Toggle de días para generación ────────────────────────
  function toggleDia(idDia) {
    setDiasSelGen(prev =>
      prev.includes(idDia) ? prev.filter(d => d !== idDia) : [...prev, idDia]
    )
  }

  // ── Parsear exclusiones de texto libre ─────────────────────
  // Formato aceptado: "13:00-14:00, 15:30-16:00"
  function parsearExclusiones(texto) {
    if (!texto.trim()) return []
    return texto.split(',').map(s => {
      const partes = s.trim().split('-')
      return { inicio: partes[0]?.trim(), fin: partes[1]?.trim() }
    }).filter(e => e.inicio && e.fin)
  }

  // ── Generación automática ──────────────────────────────────
  async function onGenerar(e) {
    e.preventDefault()
    if (!idCarreraJornada || diasSelGen.length === 0) return
    setGenerando(true)
    setResultadoGen(null)
    setErrorGen(null)
    try {
      const payload = {
        id_carrera_jornada:  Number(idCarreraJornada),
        ids_dia:             diasSelGen,
        hora_inicio_general: formGen.hora_inicio_general,
        hora_fin_general:    formGen.hora_fin_general,
        duracion_minutos:    Number(formGen.duracion_minutos),
        exclusiones:         parsearExclusiones(formGen.exclusiones),
      }
      const res = await generarBloques(payload)
      setResultadoGen(res)
      await cargarBloques(idCarreraJornada) // refrescar vista
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        const errs = err.response?.data?.errors
        const msg  = errs
          ? Object.values(errs).flat().join(' · ')
          : (err.response?.data?.message ?? 'Error de validación.')
        setErrorGen(msg)
      } else {
        setErrorGen(err.response?.data?.message ?? 'Error al generar bloques.')
      }
    } finally {
      setGenerando(false)
    }
  }

  // ── Desactivar bloque ──────────────────────────────────────
  async function onEliminar(bloque) {
    if (!window.confirm(
      `¿Desactivar el bloque ${bloque.hora_inicio}–${bloque.hora_fin}?\n` +
      `Solo es posible si no está en uso en un horario activo.`
    )) return
    setEliminando(bloque.id_bloque_horario)
    setErrorElim(null)
    try {
      await eliminarBloque(bloque.id_bloque_horario)
      await cargarBloques(idCarreraJornada) // refrescar
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar el bloque.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Crear bloque individual ──────────────────────────────
  async function onCrearIndividual(e) {
    e.preventDefault()
    if (!idCarreraJornada) return
    setCreando(true)
    setErroresInd({})
    setErrorInd(null)
    setOkInd(null)
    try {
      await crearBloque({
        id_carrera_jornada: Number(idCarreraJornada),
        id_dia:             Number(formInd.id_dia),
        hora_inicio:        formInd.hora_inicio,
        hora_fin:           formInd.hora_fin,
        duracion_minutos:   Number(formInd.duracion_minutos),
      })
      setOkInd('Bloque creado correctamente.')
      setFormInd({ id_dia: '', hora_inicio: '', hora_fin: '', duracion_minutos: '90' })
      await cargarBloques(idCarreraJornada) // refrescar vista
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErroresInd(err.response?.data?.errors ?? {})
        setErrorInd(err.response?.data?.message ?? null)
      } else if (status === 403) {
        setErrorInd('No tienes permisos para esta acción.')
      } else {
        setErrorInd(err.response?.data?.message ?? 'Error al crear el bloque.')
      }
    } finally {
      setCreando(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Bloques horarios"
        descripcion="Genera o gestiona los bloques de tiempo disponibles para cada carrera-jornada."
      />

      {errorCat && <ErrorState mensaje={errorCat} />}
      {cargandoCat && <LoadingState texto="Cargando datos…" />}

      {!cargandoCat && !errorCat && (
        <>
          {/* ── Selector de carrera y jornada ──────────────── */}
          <Card style={{ marginBottom: '20px' }}>
            <div style={estilos.selectorGrid}>
              <div style={estilos.campo}>
                <label style={estilos.label}>Carrera</label>
                <select value={idCarrera} onChange={onCarreraChange} style={estilos.select}>
                  <option value="">— Selecciona una carrera —</option>
                  {carreras.map(c => (
                    <option key={c.id_carrera} value={c.id_carrera}>
                      {c.nombre_carrera}{c.codigo_carrera ? ` (${c.codigo_carrera})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={estilos.campo}>
                <label style={estilos.label}>Jornada</label>
                {cargandoJornadas
                  ? <p style={estilos.cargandoTxt}>Cargando jornadas…</p>
                  : <select
                      value={idCarreraJornada}
                      onChange={onJornadaChange}
                      disabled={!idCarrera || jornadasCarrera.length === 0}
                      style={estilos.select}
                    >
                      <option value="">— Selecciona una jornada —</option>
                      {jornadasCarrera.map(j => (
                        <option key={j.pivot?.id_carrera_jornada ?? j.id_jornada}
                                value={j.pivot?.id_carrera_jornada ?? ''}>
                          {j.nombre_jornada}
                        </option>
                      ))}
                    </select>
                }
                {idCarrera && !cargandoJornadas && jornadasCarrera.length === 0 && (
                  <p style={estilos.sinJornadas}>
                    Esta carrera no tiene jornadas asignadas.
                    Asígnalas primero en "Jornadas por carrera".
                  </p>
                )}
              </div>
            </div>
          </Card>

          {idCarreraJornada && (
            <div style={estilos.mainGrid}>

              {/* ── Panel izquierdo: generación automática ─── */}
              <Card>
                <h2 style={estilos.panelTitulo}>Generación automática</h2>
                <p style={estilos.panelDesc}>
                  Crea todos los bloques del rango horario con la duración indicada.
                  Los bloques ya existentes se omitirán automáticamente.
                </p>

                <form onSubmit={onGenerar} noValidate style={estilos.form}>

                  {/* Días */}
                  <div style={estilos.campo}>
                    <label style={estilos.label}>Días <span style={estilos.req}>*</span></label>
                    <div style={estilos.diasGrid}>
                      {dias.map(d => (
                        <label key={d.id_dia} style={{
                          ...estilos.diaLabel,
                          ...(diasSelGen.includes(d.id_dia) ? estilos.diaActivo : {}),
                        }}>
                          <input
                            type="checkbox"
                            checked={diasSelGen.includes(d.id_dia)}
                            onChange={() => toggleDia(d.id_dia)}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                          <span style={estilos.diaNombre}>{d.nombre_dia}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Hora inicio */}
                  <div style={estilos.filaDoble}>
                    <div style={estilos.campo}>
                      <label style={estilos.label}>Hora inicio <span style={estilos.req}>*</span></label>
                      <input
                        type="time"
                        value={formGen.hora_inicio_general}
                        onChange={e => setFormGen(f => ({ ...f, hora_inicio_general: e.target.value }))}
                        style={estilos.input}
                        required
                      />
                    </div>
                    <div style={estilos.campo}>
                      <label style={estilos.label}>Hora fin <span style={estilos.req}>*</span></label>
                      <input
                        type="time"
                        value={formGen.hora_fin_general}
                        onChange={e => setFormGen(f => ({ ...f, hora_fin_general: e.target.value }))}
                        style={estilos.input}
                        required
                      />
                    </div>
                  </div>

                  {/* Duración */}
                  <div style={estilos.campo}>
                    <label style={estilos.label}>
                      Duración por bloque (minutos) <span style={estilos.req}>*</span>
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={180}
                      value={formGen.duracion_minutos}
                      onChange={e => setFormGen(f => ({ ...f, duracion_minutos: e.target.value }))}
                      style={estilos.input}
                      placeholder="90"
                    />
                  </div>

                  {/* Exclusiones */}
                  <div style={estilos.campo}>
                    <label style={estilos.label}>
                      Exclusiones <span style={estilos.opc}>(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formGen.exclusiones}
                      onChange={e => setFormGen(f => ({ ...f, exclusiones: e.target.value }))}
                      style={estilos.input}
                      placeholder="Ej: 13:00-14:00, 15:00-15:30"
                    />
                    <span style={estilos.hint}>Franjas a omitir, separadas por coma.</span>
                  </div>

                  {/* Resultado / error */}
                  {resultadoGen && (
                    <div style={estilos.alertaOk}>
                      ✓ {resultadoGen.message}
                      {resultadoGen.omitidos?.length > 0 && (
                        <span style={estilos.omitidos}>
                          {' '}({resultadoGen.omitidos.length} omitidos por duplicado)
                        </span>
                      )}
                    </div>
                  )}
                  {errorGen && (
                    <div style={estilos.alertaError} role="alert">{errorGen}</div>
                  )}

                  <Button
                    type="submit"
                    variante="primary"
                    cargando={generando}
                    disabled={diasSelGen.length === 0 || generando}
                  >
                    Generar bloques
                  </Button>
                </form>

                {/* ── Creación de bloque individual ──────── */}
                <div style={estilos.separador} />
                <h3 style={estilos.subTitulo}>Crear bloque individual</h3>
                <p style={estilos.panelDesc}>Añade un bloque puntual que no encaja en el rango general.</p>

                <form onSubmit={onCrearIndividual} noValidate style={estilos.form}>
                  {/* Día */}
                  <div style={estilos.campo}>
                    <label style={estilos.label}>Día <span style={estilos.req}>*</span></label>
                    <select
                      value={formInd.id_dia}
                      onChange={e => setFormInd(f => ({ ...f, id_dia: e.target.value }))}
                      style={{
                        ...estilos.input,
                        ...(erroresInd.id_dia ? estilos.inputError : {}),
                      }}
                      disabled={creando}
                    >
                      <option value=''>— Selecciona un día —</option>
                      {dias.map(d => (
                        <option key={d.id_dia} value={d.id_dia}>{d.nombre_dia}</option>
                      ))}
                    </select>
                    {erroresInd.id_dia && <span style={estilos.errorMsg}>{erroresInd.id_dia[0]}</span>}
                  </div>

                  {/* Hora inicio / fin */}
                  <div style={estilos.filaDoble}>
                    <div style={estilos.campo}>
                      <label style={estilos.label}>Hora inicio <span style={estilos.req}>*</span></label>
                      <input
                        type='time'
                        value={formInd.hora_inicio}
                        onChange={e => setFormInd(f => ({ ...f, hora_inicio: e.target.value }))}
                        style={{
                          ...estilos.input,
                          ...(erroresInd.hora_inicio ? estilos.inputError : {}),
                        }}
                        disabled={creando}
                      />
                      {erroresInd.hora_inicio && <span style={estilos.errorMsg}>{erroresInd.hora_inicio[0]}</span>}
                    </div>
                    <div style={estilos.campo}>
                      <label style={estilos.label}>Hora fin <span style={estilos.req}>*</span></label>
                      <input
                        type='time'
                        value={formInd.hora_fin}
                        onChange={e => setFormInd(f => ({ ...f, hora_fin: e.target.value }))}
                        style={{
                          ...estilos.input,
                          ...(erroresInd.hora_fin ? estilos.inputError : {}),
                        }}
                        disabled={creando}
                      />
                      {erroresInd.hora_fin && <span style={estilos.errorMsg}>{erroresInd.hora_fin[0]}</span>}
                    </div>
                  </div>

                  {/* Duración */}
                  <div style={estilos.campo}>
                    <label style={estilos.label}>Duración (minutos) <span style={estilos.req}>*</span></label>
                    <input
                      type='number'
                      min={50}
                      max={180}
                      value={formInd.duracion_minutos}
                      onChange={e => setFormInd(f => ({ ...f, duracion_minutos: e.target.value }))}
                      style={{
                        ...estilos.input,
                        ...(erroresInd.duracion_minutos ? estilos.inputError : {}),
                      }}
                      disabled={creando}
                    />
                    {erroresInd.duracion_minutos && <span style={estilos.errorMsg}>{erroresInd.duracion_minutos[0]}</span>}
                  </div>

                  {/* Feedback */}
                  {okInd && <div style={estilos.alertaOk}>✓ {okInd}</div>}
                  {errorInd && <div style={estilos.alertaError} role='alert'>{errorInd}</div>}

                  <Button
                    type='submit'
                    variante='secondary'
                    cargando={creando}
                    disabled={!formInd.id_dia || !formInd.hora_inicio || !formInd.hora_fin || creando}
                  >
                    Crear bloque
                  </Button>
                </form>
              </Card>

              {/* ── Panel derecho: bloques existentes ─────── */}
              <Card>
                <h2 style={estilos.panelTitulo}>Bloques existentes</h2>
                {infoCarreraJorn && (
                  <p style={estilos.panelDesc}>
                    <strong>{infoCarreraJorn.carrera?.nombre_carrera}</strong>
                    {' — '}{infoCarreraJorn.jornada?.nombre_jornada}
                  </p>
                )}

                {cargandoBloques && <LoadingState texto="Cargando bloques…" alto="100px" />}

                {!cargandoBloques && errorBloques && (
                  <ErrorState mensaje={errorBloques} onReintentar={() => cargarBloques(idCarreraJornada)} />
                )}

                {errorElim && (
                  <div style={{ ...estilos.alertaError, marginBottom: '12px' }} role="alert">
                    {errorElim}
                  </div>
                )}

                {!cargandoBloques && !errorBloques && Object.keys(bloquesPorDia).length === 0 && (
                  <EmptyState
                    icono="🕐"
                    titulo="Sin bloques definidos"
                    descripcion="Genera bloques usando el formulario de la izquierda."
                  />
                )}

                {!cargandoBloques && !errorBloques && Object.keys(bloquesPorDia).length > 0 && (
                  <div style={estilos.bloquesDias}>
                    {dias
                      .filter(d => bloquesPorDia[d.id_dia])
                      .map(d => (
                        <div key={d.id_dia} style={estilos.diaSection}>
                          <div style={estilos.diaSectionTitulo}>
                            {d.nombre_dia}
                            <Badge
                              texto={`${bloquesPorDia[d.id_dia].length} bloques`}
                              variante="info"
                            />
                          </div>
                          <div style={estilos.bloquesLista}>
                            {bloquesPorDia[d.id_dia].map(b => (
                              <div key={b.id_bloque_horario} style={estilos.bloqueChip}>
                                <span style={estilos.bloqueHora}>
                                  {b.hora_inicio?.slice(0,5)}–{b.hora_fin?.slice(0,5)}
                                </span>
                                <span style={estilos.bloqueMin}>{b.duracion_minutos}min</span>
                                <button
                                  onClick={() => onEliminar(b)}
                                  disabled={eliminando === b.id_bloque_horario}
                                  style={estilos.btnElim}
                                  title="Desactivar bloque"
                                >
                                  {eliminando === b.id_bloque_horario ? '…' : '×'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </Card>

            </div>
          )}

          {!idCarreraJornada && (
            <EmptyState
              icono="⏰"
              titulo="Selecciona una carrera y jornada"
              descripcion="Los bloques horarios se definen por carrera-jornada."
            />
          )}
        </>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const estilos = {
  selectorGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap:                 '16px',
    alignItems:          'end',
  },
  mainGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap:                 '20px',
    alignItems:          'start',
  },
  campo:  { display: 'flex', flexDirection: 'column', gap: '5px' },
  filaDoble: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:    { color: 'var(--color-error)' },
  opc:    { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  hint:   { fontSize: '11.5px', color: 'var(--color-text-muted)' },
  select: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
  },
  input: {
    padding: '9px 12px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', outline: 'none', width: '100%',
  },
  cargandoTxt: { fontSize: '13px', color: 'var(--color-text-muted)', margin: '6px 0 0' },
  sinJornadas: { fontSize: '12.5px', color: 'var(--color-warning)', margin: '6px 0 0', lineHeight: 1.5 },

  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  panelTitulo: { fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' },
  panelDesc:   { fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 },

  diasGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  diaLabel: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 10px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', cursor: 'pointer', userSelect: 'none',
    fontSize: '13px', fontWeight: 500, transition: 'all .12s',
  },
  diaActivo: {
    background: 'var(--color-primary-subtle)',
    borderColor: 'var(--color-primary)',
    color: 'var(--color-primary)',
  },
  diaNombre: { textTransform: 'capitalize' },

  alertaOk: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: '#166534', fontWeight: 500,
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500,
  },
  omitidos: { fontWeight: 400, opacity: .8 },

  bloquesDias: { display: 'flex', flexDirection: 'column', gap: '16px' },
  diaSection:  {},
  diaSectionTitulo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '12.5px', fontWeight: 700, textTransform: 'capitalize',
    color: 'var(--color-text-secondary)', letterSpacing: '.04em',
    marginBottom: '8px',
  },
  bloquesLista: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  bloqueChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--color-primary-subtle)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '5px 10px',
    fontSize: '12.5px',
  },
  bloqueHora: { fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' },
  bloqueMin:  { fontSize: '11px', color: 'var(--color-text-muted)' },
  btnElim: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--color-error)', fontWeight: 700, fontSize: '14px',
    lineHeight: 1, padding: '0 2px',
  },
  separador: {
    borderTop:    '1px solid var(--color-border)',
    margin:       '20px 0',
  },
  subTitulo: {
    fontSize:     '13.5px',
    fontWeight:   700,
    color:        'var(--color-text)',
    margin:       '0 0 4px',
  },
  inputError: {
    borderColor:  'var(--color-error)',
    background:   '#fff8f8',
  },
  errorMsg: {
    fontSize:     '12px',
    color:        'var(--color-error)',
    fontWeight:   500,
  },
}
