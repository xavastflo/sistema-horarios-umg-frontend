import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import { useAuth }  from '../../context/AuthContext'
import { getDocentes, getPerfilDocente } from '../../api/docentes'
import { getJornadas } from '../../api/carreraJornadas'
import api from '../../api/axios'

/**
 * DisponibilidadDocente
 *
 * CORRECCIONES:
 *   1. DÍAS DINÁMICOS: eliminado DIAS_ORDEN hardcodeado. Los días se derivan
 *      del response del backend — si Sábado no tiene bloques, no aparece.
 *
 *   2. BLOQUES POR JORNADA DEL DOCENTE: al seleccionar un docente, se consulta
 *      GET /docentes/{id}/disponibilidad/bloques que retorna solo los bloques
 *      de las jornadas donde el docente tiene asignaciones activas.
 *      Fallback: todos los bloques si el docente no tiene asignaciones aún.
 *
 * REGLA: restricción = atributo del DOCENTE, no de la carrera.
 *        Una celda roja aplica para todas las carreras de esa franja.
 */

/** Orden preferido de días — solo se renderizan los que devuelva el backend */
const ORDEN_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/**
 * Normaliza nombre_dia del backend (minúsculas sin tilde) al formato de ORDEN_DIAS.
 * 'lunes' → 'Lunes', 'miercoles' → 'Miércoles', 'sabado' → 'Sábado'
 */
const MAPA_DIAS = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
}
function normalizarDia(nombre) {
  if (!nombre) return nombre
  // Quitar tildes y pasar a minúsculas para el lookup
  const clave = nombre.toLowerCase()
    .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
    .replace(/ó/g,'o').replace(/ú/g,'u')
  return MAPA_DIAS[clave] ?? nombre
}

export default function DisponibilidadDocente() {
  const { perfilActivo } = useAuth()
  const esDocente = perfilActivo === 'docente'

  // ── Catálogos ──────────────────────────────────────────────
  const [docentes,     setDocentes]     = useState([])
  const [cargandoCat,  setCargandoCat]  = useState(false)
  const [errorCat,     setErrorCat]     = useState(null)

  // ── Docente activo ─────────────────────────────────────────
  const [idDocente,    setIdDocente]    = useState(null)
  const [infoDocente,  setInfoDocente]  = useState(null)

  // ── Bloques del docente (por jornada) ──────────────────────
  const [bloques,      setBloques]      = useState([])
  const [cargandoBlq,  setCargandoBlq]  = useState(false)
  const [errorBlq,     setErrorBlq]     = useState(null)

  // ── Restricciones persistidas en BD ───────────────────────
  // Set de keys "dia|hora_inicio|hora_fin"
  const [restringidas, setRestringidas] = useState(new Set())
  const [cargandoRestr,setCargandoRestr]= useState(false)
  const [errorRestr,   setErrorRestr]   = useState(null)

  // ── Cambios pendientes ─────────────────────────────────────
  // Map: key → 'restringir' | 'liberar'
  const [pendientes,   setPendientes]   = useState(new Map())

  // ── Guardar ────────────────────────────────────────────────
  const [guardando,    setGuardando]    = useState(false)
  const [errorAccion,  setErrorAccion]  = useState(null)
  const [okAccion,     setOkAccion]     = useState(null)

  // ── Selector de jornada (filtro maestro de la cuadrícula) ──
  const [jornadas,     setJornadas]     = useState([])
  const [idJornada,    setIdJornada]    = useState('')  // '' = todas

  // ── 0. Cargar catálogo de jornadas ────────────────────────
  useEffect(() => {
    getJornadas().then(setJornadas).catch(() => {})
  }, [])

  // ── 1. Inicializar según rol ───────────────────────────────
  useEffect(() => {
    async function init() {
      if (esDocente) {
        try {
          const data = await getPerfilDocente()
          setIdDocente(data.id_docente)
          setInfoDocente(data)
        } catch (err) {
          setErrorCat(err.response?.data?.message ?? 'No se pudo cargar tu perfil docente.')
        }
      } else {
        setCargandoCat(true)
        try {
          setDocentes(await getDocentes({ estado: 'activo' }))
        } catch (err) {
          setErrorCat(err.response?.data?.message ?? 'Error al cargar docentes.')
        } finally {
          setCargandoCat(false)
        }
      }
    }
    init()
  }, [esDocente])

  // ── 2. Cargar bloques FILTRADOS por jornada del docente ────
  // Se ejecuta cada vez que cambia idDocente.
  // Endpoint: GET /docentes/{id}/disponibilidad/bloques
  //   → retorna solo los bloques de las jornadas con asignaciones activas.
  //   → fallback: todos los bloques si el docente no tiene asignaciones.
  const cargarBloques = useCallback(async () => {
    if (!idDocente) { setBloques([]); return }
    setCargandoBlq(true)
    setErrorBlq(null)
    try {
      const params = {}
      if (idJornada) params.id_jornada = idJornada
      const { data } = await api.get(`/docentes/${idDocente}/disponibilidad/bloques`, { params })
      // Normalizar nombre_dia: BD guarda 'lunes','sabado' → ORDEN_DIAS espera 'Lunes','Sábado'
      setBloques((data.bloques ?? []).map(b => ({
        ...b,
        nombre_dia: normalizarDia(b.nombre_dia),
      })))
    } catch (err) {
      const st = err.response?.status
      setErrorBlq(
        st === 403 ? 'Sin permisos para cargar los bloques de este docente.' :
        st === 401 ? 'Sesión expirada. Vuelve a iniciar sesión.' :
        err.response?.data?.message ?? 'No se pudieron cargar los bloques horarios.'
      )
    } finally {
      setCargandoBlq(false)
    }
  }, [idDocente, idJornada])

  useEffect(() => { cargarBloques() }, [cargarBloques])

  // ── 3. Cargar restricciones del docente en BD ──────────────
  const cargarDisponibilidad = useCallback(async () => {
    if (!idDocente) { setRestringidas(new Set()); setPendientes(new Map()); return }
    setCargandoRestr(true)
    setErrorRestr(null)
    setPendientes(new Map())
    try {
      const { data } = await api.get(`/docentes/${idDocente}/disponibilidad`)
      const set = new Set()
      ;(data.bloques_no_disponibles ?? []).forEach(r => {
        const b  = r.bloque_horario
        const hi = b?.hora_inicio?.slice(0, 5)
        const hf = b?.hora_fin?.slice(0, 5)
        const dia = normalizarDia(b?.dia?.nombre_dia)
        if (dia && hi && hf) set.add(`${dia}|${hi}|${hf}`)
      })
      setRestringidas(set)
    } catch (err) {
      setErrorRestr(err.response?.data?.message ?? 'Error al cargar restricciones actuales.')
    } finally {
      setCargandoRestr(false)
    }
  }, [idDocente])

  useEffect(() => { cargarDisponibilidad() }, [cargarDisponibilidad])

  // ── Derivar días y franjas del response ────────────────────
  // DÍAS: solo los que tienen bloques, ordenados según ORDEN_DIAS
  const diasPresentes = ORDEN_DIAS.filter(d =>
    bloques.some(b => b.nombre_dia === d)
  )

  // FRANJAS: únicas por hora_inicio + hora_fin, deduplicadas
  const franjasUnicas = [...new Map(
    bloques.map(b => {
      const hi = b.hora_inicio?.slice(0, 5) ?? ''
      const hf = b.hora_fin?.slice(0, 5) ?? ''
      return [`${hi}|${hf}`, { hi, hf, label: `${hi}–${hf}` }]
    })
  ).values()].sort((a, b) => a.hi.localeCompare(b.hi))

  // ── Helpers de clave y estado ──────────────────────────────
  const makeKey  = (dia, hi, hf) => `${dia}|${hi}|${hf}`
  const tieneBloque = (dia, hi, hf) =>
    bloques.some(b => b.nombre_dia === dia &&
      b.hora_inicio?.slice(0,5) === hi &&
      b.hora_fin?.slice(0,5)    === hf)

  const estadoCelda = (dia, hi, hf) => {
    const k = makeKey(dia, hi, hf)
    const p = pendientes.get(k)
    if (p === 'restringir') return 'pendiente_restringir'
    if (p === 'liberar')    return 'pendiente_liberar'
    if (restringidas.has(k)) return 'no_disponible'
    return 'disponible'
  }

  // ── Clic en celda ──────────────────────────────────────────
  const handleCeldaClick = (dia, hi, hf) => {
    const k = makeKey(dia, hi, hf)
    const yaRestringida = restringidas.has(k)
    const next = new Map(pendientes)
    if (next.has(k)) {
      next.delete(k)                                  // revertir
    } else {
      next.set(k, yaRestringida ? 'liberar' : 'restringir')
    }
    setPendientes(next)
    setOkAccion(null)
    setErrorAccion(null)
  }

  // ── Guardar en lote ────────────────────────────────────────
  const onGuardarCambios = async () => {
    if (!pendientes.size) return
    setGuardando(true)
    setErrorAccion(null)
    setOkAccion(null)
    let fallos = 0

    for (const [key, accion] of pendientes.entries()) {
      const [nombre_dia, hora_inicio, hora_fin] = key.split('|')
      try {
        await api.post(`/docentes/${idDocente}/disponibilidad/toggle`, {
          nombre_dia,
          hora_inicio,
          hora_fin,
          accion,               // explícito: 'restringir' | 'liberar'
        })
      } catch { fallos++ }
    }

    if (fallos > 0) {
      setErrorAccion(`Completado con advertencias: ${fallos} cambio(s) no pudieron procesarse.`)
    } else {
      setOkAccion('Disponibilidad actualizada exitosamente en lote.')
    }

    await cargarDisponibilidad()
    setGuardando(false)
  }

  // ── Estilos de celda según estado ─────────────────────────
  const estiloYTexto = estado => {
    if (estado === 'pendiente_restringir') return { estilo: est.celdaPendienteRestringir, texto: 'Bloquear (○)' }
    if (estado === 'pendiente_liberar')    return { estilo: est.celdaPendienteLiberar,    texto: 'Liberar (↩)' }
    if (estado === 'no_disponible')        return { estilo: est.celdaNoDisponible,         texto: 'No Disponible (✕)' }
    return { estilo: est.celdaDisponible, texto: 'Disponible (✓)' }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Disponibilidad docente"
        descripcion="Define las restricciones de franjas horarias del docente. Aplica para todas las carreras asociadas."
      />

      <div style={est.nota}>
        <span style={est.notaIcono}>⚠️</span>
        <span>
          <strong>Cuadrícula personalizada por docente:</strong> Solo se muestran los días y
          franjas de las jornadas donde el docente tiene asignaciones activas.
        </span>
      </div>

      {/* ── Selector de Jornada — filtra la cuadrícula ────────── */}
      {jornadas.length > 0 && (
        <div style={est.jornadaTabs}>
          <button
            style={{ ...est.jornadaTab, ...(idJornada === '' ? est.jornadaTabActivo : {}) }}
            onClick={() => { setIdJornada(''); setPendientes(new Map()) }}
          >
            Todas las jornadas
          </button>
          {jornadas.map(j => (
            <button
              key={j.id_jornada}
              style={{
                ...est.jornadaTab,
                ...(String(idJornada) === String(j.id_jornada) ? est.jornadaTabActivo : {}),
              }}
              onClick={() => { setIdJornada(j.id_jornada); setPendientes(new Map()) }}
            >
              {j.nombre_jornada}
            </button>
          ))}
        </div>
      )}

      {errorCat    && <ErrorState mensaje={errorCat} />}
      {cargandoCat && <LoadingState texto="Cargando docentes…" />}

      {!cargandoCat && !errorCat && (
        <>
          {/* Selector de docente (admin/coord) */}
          {!esDocente && (
            <Card style={{ marginBottom: '20px' }}>
              <div style={est.campo}>
                <label style={est.label}>Docente</label>
                <select
                  value={idDocente ?? ''}
                  onChange={e => {
                    const val = Number(e.target.value) || null
                    setIdDocente(val)
                    setInfoDocente(docentes.find(d => d.id_docente === val) ?? null)
                    setOkAccion(null)
                    setErrorAccion(null)
                  }}
                  style={est.select}
                >
                  <option value="">— Selecciona un docente —</option>
                  {docentes.map(d => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.usuario?.nombre_completo ?? d.codigo_docente ?? `#${d.id_docente}`}
                      {d.codigo_docente ? ` [${d.codigo_docente}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {infoDocente && (
                <p style={est.docenteInfo}>
                  Prioridad: <strong>{infoDocente.etiqueta_prioridad ?? infoDocente.prioridad}</strong>
                </p>
              )}
            </Card>
          )}

          {/* Info del docente autenticado */}
          {esDocente && infoDocente && (
            <Card style={{ marginBottom: '20px' }}>
              <p style={est.label}>Tu perfil docente activo</p>
              <p style={est.docenteNombre}>
                {infoDocente.usuario?.nombre_completo ?? `Docente #${infoDocente.id_docente}`}
              </p>
              {infoDocente.codigo_docente && (
                <code style={est.codigo}>{infoDocente.codigo_docente}</code>
              )}
            </Card>
          )}

          {okAccion    && <div style={est.alertaOk}    role="status">{okAccion}</div>}
          {errorAccion && <div style={est.alertaError} role="alert">{errorAccion}</div>}

          <Card padding="0">
            <div style={est.panelHeader}>
              <h2 style={est.panelTitulo}>Matriz Semanal de Disponibilidad</h2>
            </div>

            {errorBlq  && <ErrorState mensaje={errorBlq} />}
            {errorRestr && <ErrorState mensaje={errorRestr} onReintentar={cargarDisponibilidad} />}

            {!errorBlq && !errorRestr && (cargandoBlq || cargandoRestr) && (
              <LoadingState texto="Sincronizando la matriz con la base de datos…" />
            )}

            {!errorBlq && !errorRestr && !cargandoBlq && !cargandoRestr && !idDocente && (
              <EmptyState icono="👨‍🏫" titulo="Selecciona un docente"
                descripcion="Por favor, selecciona un docente para cargar su matriz de horarios." />
            )}

            {!errorBlq && !errorRestr && !cargandoBlq && !cargandoRestr && idDocente && franjasUnicas.length === 0 && (
              <EmptyState icono="🗓️" titulo="Sin franjas disponibles"
                descripcion="Este docente no tiene asignaciones activas en el sistema. Asígnale cursos primero." />
            )}

            {!errorBlq && !errorRestr && !cargandoBlq && !cargandoRestr && idDocente && franjasUnicas.length > 0 && (
              <div style={{ overflowX: 'auto', padding: '16px' }}>
                <table style={est.tabla}>
                  <thead>
                    <tr>
                      <th style={est.th}>Horario / Franja</th>
                      {/* DÍAS DINÁMICOS: solo los que tenga el docente */}
                      {diasPresentes.map(d => <th key={d} style={est.th}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {franjasUnicas.map(({ hi, hf, label }) => (
                      <tr key={label} style={est.tr}>
                        <td style={{ ...est.td, fontWeight: 'bold', background: '#f9fafb', borderRight: '1px solid var(--color-border)' }}>
                          {label}
                        </td>
                        {diasPresentes.map(dia => {
                          // Celda vacía si este día no tiene bloque en esta franja
                          if (!tieneBloque(dia, hi, hf)) {
                            return <td key={dia} style={{ ...est.td, background: 'var(--color-bg)', opacity: .35 }} />
                          }
                          const estado = estadoCelda(dia, hi, hf)
                          const { estilo, texto } = estiloYTexto(estado)
                          return (
                            <td key={dia} style={{ ...est.td, padding: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleCeldaClick(dia, hi, hf)}
                                disabled={guardando}
                                style={estilo}
                                title={texto}
                              >
                                {texto}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Barra flotante de cambios pendientes */}
          {pendientes.size > 0 && (
            <div style={est.barraFlotante}>
              <span style={{ fontSize: '13.5px', fontWeight: 500 }}>
                📝 Tienes <strong>{pendientes.size} cambio(s)</strong> locales pendientes de guardar.
              </span>
              <Button
                variante="primary"
                cargando={guardando}
                disabled={guardando}
                onClick={onGuardarCambios}
              >
                Guardar Disponibilidad
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const est = {
  nota: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13px', color: '#92400e', marginBottom: '14px', lineHeight: 1.5,
  },
  notaIcono: { fontSize: '16px', flexShrink: 0 },
  jornadaTabs: {
    display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap',
  },
  jornadaTab: {
    padding: '7px 18px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-sans)', transition: 'all .12s',
  },
  jornadaTabActivo: {
    background: 'var(--color-primary)', color: '#fff',
    border: '1.5px solid var(--color-primary)', fontWeight: 700,
  },
  campo:  { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  select: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
  },
  docenteInfo:   { fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '8px' },
  docenteNombre: { fontSize: '14px', fontWeight: 600, marginBottom: '4px' },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
  },
  panelTitulo: { fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
  alertaOk: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: '#166534', fontWeight: 500, marginBottom: '14px',
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '14px',
  },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'center', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '8px', fontSize: '13.5px', color: 'var(--color-text)', textAlign: 'center', verticalAlign: 'middle' },
  celdaDisponible: {
    width: '100%', padding: '10px 6px', background: '#dcfce7', color: '#14532d',
    border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)',
    fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '12px',
  },
  celdaNoDisponible: {
    width: '100%', padding: '10px 6px', background: '#fee2e2', color: '#7f1d1d',
    border: '1px solid #fecaca', borderRadius: 'var(--radius-md)',
    fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '12px',
  },
  celdaPendienteRestringir: {
    width: '100%', padding: '10px 6px', background: '#fef9c3', color: '#713f12',
    border: '1.5px dashed #f59e0b', borderRadius: 'var(--radius-md)',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '12px',
  },
  celdaPendienteLiberar: {
    width: '100%', padding: '10px 6px', background: '#e0f2fe', color: '#0369a1',
    border: '1.5px dashed #38bdf8', borderRadius: 'var(--radius-md)',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '12px',
  },
  barraFlotante: {
    position: 'fixed', top: '20px', right: '24px',
    width: 'auto', maxWidth: '420px',
    background: '#0f172a', color: '#fff',
    padding: '12px 18px', borderRadius: 'var(--radius-xl)', display: 'flex',
    alignItems: 'center', gap: '16px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.35)', zIndex: 50,
  },
}
