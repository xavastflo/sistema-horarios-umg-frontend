import { useState, useEffect } from 'react'
import PageHeader    from '../../components/ui/PageHeader'
import Card          from '../../components/ui/Card'
import Button        from '../../components/ui/Button'
import LoadingState  from '../../components/ui/LoadingState'
import ErrorState    from '../../components/ui/ErrorState'
import { useAuth }   from '../../context/AuthContext'
import { getCarreras }  from '../../api/carreras'
import { getPeriodos }  from '../../api/periodosAcademicos'
import { getDocentes }  from '../../api/docentes'
import { getHorarios }  from '../../api/horarios'
import {
  descargarHorarioCarrera,
  descargarHorarioDocente,
  descargarSeccionesNoAsignadas,
  descargarResumenAsignaciones,
} from '../../api/reportes'

/**
 * Reportes — pantalla de generación y descarga de reportes.
 *
 * 4 reportes disponibles según el backend (Sprint 4 Paso 3):
 *   1. Horario por carrera/período  → PDF o Excel
 *   2. Horario por docente          → PDF o Excel
 *   3. Secciones no asignadas       → PDF o Excel
 *   4. Resumen de asignaciones      → PDF o Excel
 *
 * Acceso:
 *   admin    → todos los reportes, sin restricción de carrera
 *   coord    → reportes 1,3,4 solo de sus carreras; reporte 2 de sus docentes
 *   docente  → solo su propio horario (reporte 2, id_docente forzado por backend)
 */

export default function Reportes() {
  const { perfilActivo } = useAuth()
  const esAdmin   = perfilActivo === 'administrador'
  const esCoord   = perfilActivo === 'coordinador'
  const esDocente = perfilActivo === 'docente'

  // ── Catálogos ──────────────────────────────────────────────
  const [carreras,   setCarreras]   = useState([])
  const [periodos,   setPeriodos]   = useState([])
  const [docentes,   setDocentes]   = useState([])
  const [horarios,   setHorarios]   = useState([])
  const [cargandoCat,setCargandoCat]= useState(true)
  const [errorCat,   setErrorCat]   = useState(null)

  // ── Selecciones de filtro ──────────────────────────────────
  const [selCarrera, setSelCarrera] = useState('')
  const [selPeriodo, setSelPeriodo] = useState('')
  const [selDocente, setSelDocente] = useState('')
  const [selHorario, setSelHorario] = useState('')

  // ── Estado de descarga por botón ───────────────────────────
  // key: 'rep1-pdf' | 'rep1-excel' | 'rep2-pdf' | etc.
  const [descargando, setDescargando] = useState(null)
  const [errorDesc,   setErrorDesc]   = useState(null)
  const [okDesc,      setOkDesc]      = useState(null)

  // ── Cargar catálogos al montar ─────────────────────────────
  useEffect(() => {
    async function cargar() {
      setCargandoCat(true)
      setErrorCat(null)
      try {
        const promesas = [getPeriodos()]
        if (!esDocente) {
          promesas.push(getCarreras({ estado: 'activo' }))
          promesas.push(getHorarios({}))
        }
        if (esAdmin || esCoord) {
          promesas.push(getDocentes({ estado: 'activo' }))
        }
        const resultados = await Promise.all(promesas)

        setPeriodos(resultados[0])
        if (!esDocente) {
          setCarreras(resultados[1])
          const hors = resultados[2]
          setHorarios(hors.horarios ?? [])
          if (esAdmin || esCoord) setDocentes(resultados[3])
        }
      } catch (err) {
        setErrorCat(err.response?.data?.message ?? 'Error al cargar los datos de filtros.')
      } finally {
        setCargandoCat(false)
      }
    }
    cargar()
  }, [esAdmin, esCoord, esDocente])

  // Filtrar horarios según carrera seleccionada
  const horariosFiltrados = selCarrera
    ? horarios.filter(h => h.carrera?.id_carrera === Number(selCarrera))
    : horarios

  // ── Disparar descarga ──────────────────────────────────────
  async function descargar(key, fn) {
    setDescargando(key)
    setErrorDesc(null)
    setOkDesc(null)
    try {
      await fn()
      setOkDesc('Descarga iniciada correctamente.')
    } catch (err) {
      // Los errores de blob necesitan parseo especial
      let msg = 'Error al generar el reporte.'
      if (err.response?.data instanceof Blob) {
        try {
          const texto = await err.response.data.text()
          const json  = JSON.parse(texto)
          msg = json.message ?? msg
        } catch { /* usar msg genérico */ }
      } else {
        msg = err.response?.data?.message ?? msg
      }
      setErrorDesc(msg)
    } finally {
      setDescargando(null)
    }
  }

  // ── Render helpers ─────────────────────────────────────────
  function BotonesFormato({ repKey, onPdf, onExcel, disabled }) {
    return (
      <div style={est.botonesFormato}>
        <Button
          variante="danger"
          size="sm"
          cargando={descargando === `${repKey}-pdf`}
          disabled={disabled || descargando !== null}
          onClick={() => descargar(`${repKey}-pdf`, onPdf)}
        >
          ↓ PDF
        </Button>
        <Button
          variante="secondary"
          size="sm"
          cargando={descargando === `${repKey}-excel`}
          disabled={disabled || descargando !== null}
          onClick={() => descargar(`${repKey}-excel`, onExcel)}
        >
          ↓ Excel
        </Button>
      </div>
    )
  }

  function SeccionReporte({ titulo, desc, children, advertencia }) {
    return (
      <div style={est.seccion}>
        <div style={est.seccionHeader}>
          <div>
            <h3 style={est.seccionTitulo}>{titulo}</h3>
            <p style={est.seccionDesc}>{desc}</p>
            {advertencia && <p style={est.advertencia}>{advertencia}</p>}
          </div>
        </div>
        <div style={est.seccionBody}>{children}</div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Reportes"
        descripcion="Genera y descarga reportes en PDF o Excel."
      />

      {cargandoCat && <LoadingState texto="Cargando datos de filtros…" />}
      {errorCat    && <ErrorState  mensaje={errorCat} />}

      {!cargandoCat && !errorCat && (
        <div style={est.columnas}>

          {/* ── Filtros compartidos ────────────────────────────── */}
          <Card style={{ marginBottom: '0' }}>
            <h2 style={est.filtrosTitulo}>Filtros</h2>

            {/* Período */}
            <div style={est.campo}>
              <label style={est.label}>Período académico</label>
              <select value={selPeriodo} onChange={e => setSelPeriodo(e.target.value)} style={est.select}>
                <option value="">Todos los períodos</option>
                {periodos.map(p => (
                  <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
                    {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''}{p.es_vigente ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Carrera (no docente) */}
            {!esDocente && (
              <div style={est.campo}>
                <label style={est.label}>Carrera</label>
                <select value={selCarrera} onChange={e => { setSelCarrera(e.target.value); setSelHorario('') }} style={est.select}>
                  <option value="">Todas las carreras</option>
                  {carreras.map(c => (
                    <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Horario (filtrado por carrera) */}
            {!esDocente && (
              <div style={est.campo}>
                <label style={est.label}>Horario específico <span style={est.opc}>(opcional en algunos reportes)</span></label>
                <select value={selHorario} onChange={e => setSelHorario(e.target.value)} style={est.select}>
                  <option value="">— Sin filtrar por horario —</option>
                  {horariosFiltrados.map(h => (
                    <option key={h.id_horario} value={h.id_horario}>
                      #{h.id_horario} — {h.carrera?.nombre_carrera ?? '?'} — {h.estado_horario?.nombre_estado ?? h.estado ?? '?'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Docente (admin/coord) */}
            {(esAdmin || esCoord) && (
              <div style={est.campo}>
                <label style={est.label}>Docente</label>
                <select value={selDocente} onChange={e => setSelDocente(e.target.value)} style={est.select}>
                  <option value="">— Selecciona docente —</option>
                  {docentes.map(d => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.usuario?.nombre_completo ?? d.codigo_docente ?? `#${d.id_docente}`}
                      {d.codigo_docente ? ` [${d.codigo_docente}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Feedback global */}
            {okDesc    && <div style={est.alertaOk}    role="status">✓ {okDesc}</div>}
            {errorDesc && <div style={est.alertaError} role="alert">{errorDesc}</div>}
          </Card>

          {/* ── Panel de reportes ──────────────────────────────── */}
          <div style={est.reportes}>

            {/* Reporte 1: Horario carrera */}
            {!esDocente && (
              <Card>
                <SeccionReporte
                  titulo="Horario por carrera"
                  desc="Grilla completa del horario: cursos, docentes, bloques y jornada."
                  advertencia={!selHorario ? '⚠ Selecciona un horario específico para este reporte.' : null}
                >
                  <BotonesFormato
                    repKey="rep1"
                    disabled={!selHorario}
                    onPdf={()   => descargarHorarioCarrera({ id_horario: Number(selHorario), formato: 'pdf' })}
                    onExcel={()  => descargarHorarioCarrera({ id_horario: Number(selHorario), formato: 'excel' })}
                  />
                </SeccionReporte>
              </Card>
            )}

            {/* Reporte 2: Horario docente */}
            <Card>
              <SeccionReporte
                titulo={esDocente ? 'Mi horario' : 'Horario por docente'}
                desc={esDocente
                  ? 'Tus asignaciones de clases con bloques y jornadas.'
                  : 'Asignaciones y bloques horarios del docente seleccionado.'}
                advertencia={!esDocente && !selDocente ? '⚠ Selecciona un docente.' : null}
              >
                <BotonesFormato
                  repKey="rep2"
                  disabled={!esDocente && !selDocente}
                  onPdf={()   => descargarHorarioDocente({
                    id_docente:            esDocente ? undefined : Number(selDocente),
                    id_periodo_academico:  selPeriodo  ? Number(selPeriodo)  : undefined,
                    id_carrera:            selCarrera  ? Number(selCarrera)  : undefined,
                    formato: 'pdf',
                  })}
                  onExcel={()  => descargarHorarioDocente({
                    id_docente:            esDocente ? undefined : Number(selDocente),
                    id_periodo_academico:  selPeriodo  ? Number(selPeriodo)  : undefined,
                    id_carrera:            selCarrera  ? Number(selCarrera)  : undefined,
                    formato: 'excel',
                  })}
                />
              </SeccionReporte>
            </Card>

            {/* Reporte 3: Secciones no asignadas */}
            {!esDocente && (
              <Card>
                <SeccionReporte
                  titulo="Secciones no asignadas"
                  desc="Secciones sin docente y secciones con docente sin bloque en el horario."
                  advertencia={(!selCarrera || !selPeriodo || !selHorario)
                    ? '⚠ Requiere carrera, período y horario.' : null}
                >
                  <BotonesFormato
                    repKey="rep3"
                    disabled={!selCarrera || !selPeriodo || !selHorario}
                    onPdf={()   => descargarSeccionesNoAsignadas({
                      id_carrera:           Number(selCarrera),
                      id_periodo_academico: Number(selPeriodo),
                      id_horario:           Number(selHorario),
                      formato: 'pdf',
                    })}
                    onExcel={()  => descargarSeccionesNoAsignadas({
                      id_carrera:           Number(selCarrera),
                      id_periodo_academico: Number(selPeriodo),
                      id_horario:           Number(selHorario),
                      formato: 'excel',
                    })}
                  />
                </SeccionReporte>
              </Card>
            )}

            {/* Reporte 4: Resumen asignaciones */}
            {!esDocente && (
              <Card>
                <SeccionReporte
                  titulo="Resumen de asignaciones"
                  desc="Carga académica por docente: secciones asignadas y bloques en horario."
                  advertencia={(!selCarrera || !selPeriodo)
                    ? '⚠ Requiere carrera y período.' : null}
                >
                  <BotonesFormato
                    repKey="rep4"
                    disabled={!selCarrera || !selPeriodo}
                    onPdf={()   => descargarResumenAsignaciones({
                      id_carrera:           Number(selCarrera),
                      id_periodo_academico: Number(selPeriodo),
                      id_horario:           selHorario ? Number(selHorario) : undefined,
                      formato: 'pdf',
                    })}
                    onExcel={()  => descargarResumenAsignaciones({
                      id_carrera:           Number(selCarrera),
                      id_periodo_academico: Number(selPeriodo),
                      id_horario:           selHorario ? Number(selHorario) : undefined,
                      formato: 'excel',
                    })}
                  />
                </SeccionReporte>
              </Card>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
  columnas: {
    display:             'grid',
    gridTemplateColumns: '280px 1fr',
    gap:                 '20px',
    alignItems:          'start',
  },
  filtrosTitulo: { fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' },
  campo:  { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
  label:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  opc:    { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '11px' },
  select: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '13.5px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
  },
  alertaOk: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '9px 12px',
    fontSize: '13px', color: '#166534', fontWeight: 500, marginTop: '8px',
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '9px 12px',
    fontSize: '13px', color: 'var(--color-error)', fontWeight: 500, marginTop: '8px',
  },
  reportes:    { display: 'flex', flexDirection: 'column', gap: '16px' },
  seccion:     {},
  seccionHeader:{ marginBottom: '12px' },
  seccionTitulo:{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' },
  seccionDesc:  { fontSize: '12.5px', color: 'var(--color-text-muted)', margin: '0 0 4px' },
  advertencia:  { fontSize: '12px', color: '#92400e', background: '#fffbeb',
                  padding: '4px 8px', borderRadius: 'var(--radius-sm)', margin: '4px 0 0' },
  seccionBody:  {},
  botonesFormato: { display: 'flex', gap: '8px' },
}
