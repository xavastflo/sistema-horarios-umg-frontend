import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import SeccionForm  from '../../components/forms/SeccionForm'
import { getSecciones, crearSeccion, eliminarSeccion } from '../../api/secciones'
import { getJornadas } from '../../api/carreraJornadas'
import { getCursos }    from '../../api/cursos'
import { getCarreras }  from '../../api/carreras'
import { getPeriodos }  from '../../api/periodosAcademicos'

/**
 * Secciones — módulo de gestión de secciones académicas.
 *
 * No existe PUT: no hay edición de secciones.
 * Los endpoints de asignación de docente quedan para el Paso 14.
 *
 * Endpoints:
 *   GET    /secciones
 *   POST   /secciones
 *   DELETE /secciones/{id}
 *
 * Catálogos auxiliares:
 *   GET    /cursos?estado=activo
 *   GET    /periodos-academicos
 *
 * Serialización importante (Laravel snake_case):
 *   periodo_academico   (no periodoAcademico)
 *   asignacion_activa   (no asignacionActiva)
 */
export default function Secciones() {
  // ── Datos principales ──────────────────────────────────────
  const [secciones,   setSecciones]   = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)

  // ── Catálogos para el form y filtros (carga al montar) ─────
  const [cursos,       setCursos]       = useState([])
  const [periodos,     setPeriodos]     = useState([])
  const [carreras,     setCarreras]     = useState([])
  const [cargandoCat,  setCargandoCat]  = useState(false)
  const [errorCat,     setErrorCat]     = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [filtroEstado,  setFiltroEstado]  = useState('')
  const [filtroCurso,   setFiltroCurso]   = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('')

  // ── Selector de jornada (filtro maestro superior) ─────────
  const [jornadas,      setJornadas]      = useState([])
  const [idCarreraJornada, setIdCarreraJornada] = useState('')  // '' = todas

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  // ── Cargar secciones ───────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado               = filtroEstado
      if (filtroCurso)   params.id_curso              = filtroCurso
      if (filtroPeriodo) params.id_periodo_academico  = filtroPeriodo
      if (idCarreraJornada) params.id_carrera_jornada = idCarreraJornada
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
  }, [filtroEstado, filtroCurso, filtroPeriodo, idCarreraJornada])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar catálogos al montar ─────────────────────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCat(true)
      setErrorCat(null)
      try {
        const [dataCursos, dataPeriodos, dataJornadas, dataCarreras] = await Promise.all([
          getCursos({ estado: 'activo' }),
          getPeriodos(),
          getJornadas(),
          getCarreras({ estado: 'activo' }),
        ])
        setCursos(dataCursos)
        // Ordenar períodos: vigente primero, luego por año desc
        dataPeriodos.sort((a, b) => {
          if (a.es_vigente && !b.es_vigente) return -1
          if (!a.es_vigente && b.es_vigente) return  1
          return (b.anio ?? 0) - (a.anio ?? 0)
        })
        setPeriodos(dataPeriodos)
        setJornadas(dataJornadas ?? [])
        setCarreras(dataCarreras ?? [])
      } catch {
        setErrorCat('Error al cargar catálogos.')
      } finally {
        setCargandoCat(false)
      }
    }
    cargarCatalogos()
  }, [])

  // ── Formulario helpers ─────────────────────────────────────
  function abrirCrear() {
    setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function cerrarForm() {
    setMostrarForm(false); setErrores422({}); setErrorForm(null)
  }

  // ── Guardar ────────────────────────────────────────────────
  async function onGuardar(datos) {
    setErrores422({}); setErrorForm(null)
    try {
      await crearSeccion(datos)
      cerrarForm()
      await cargar()
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErrores422(err.response?.data?.errors ?? {})
        setErrorForm(err.response?.data?.message ?? null)
      } else if (status === 403) {
        setErrorForm('No tienes permisos para crear secciones.')
      } else {
        setErrorForm(err.response?.data?.message ?? 'Error al crear la sección.')
      }
    }
  }

  // ── Desactivar ─────────────────────────────────────────────
  async function onEliminar(seccion) {
    const nombre = `${seccion.curso?.nombre_curso ?? 'Curso'} — Sección ${seccion.numero_seccion}`
    if (!window.confirm(
      `¿Desactivar "${nombre}"?\n` +
      `Solo es posible si no tiene docente asignado.`
    )) return
    setEliminando(seccion.id_seccion)
    setErrorElim(null)
    try {
      await eliminarSeccion(seccion.id_seccion)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar la sección.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Secciones"
        descripcion="Gestiona las secciones académicas por curso y período."
        accion={
          <Button variante="primary" onClick={abrirCrear} disabled={cargandoCat}>
            + Nueva sección
          </Button>
        }
      />

      {/* Formulario de creación */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={est.formHeader}>
            <h2 style={est.formTitulo}>Nueva sección</h2>
          </div>
          {errorCat  && <div style={est.alertaWarn}>{errorCat}</div>}
          {errorForm && <div style={est.alertaError} role="alert">{errorForm}</div>}
          {cargandoCat
            ? <LoadingState texto="Cargando cursos y períodos…" alto="60px" />
            : <SeccionForm
                carreras={carreras}
              cursos={cursos}
                periodos={periodos}
                onGuardar={onGuardar}
                onCancelar={cerrarForm}
                errores422={errores422}
              />
          }
        </Card>
      )}

      {/* ── Filtro maestro: Carrera → Jornada (cascada) ─────────── */}
      <FiltroCarreraJornada
        carreras={carreras}
        idCarreraJornada={idCarreraJornada}
        onChange={setIdCarreraJornada}
      />

      {/* Filtros */}
      <div style={est.filtros}>
        <select
          value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={est.select}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
          style={est.select}
        >
          <option value="">Todos los cursos</option>
          {cursos.map(c => (
            <option key={c.id_curso} value={c.id_curso}>
              [{c.codigo_curso}] {c.nombre_curso}
            </option>
          ))}
        </select>

        <select
          value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
          style={est.select}
        >
          <option value="">Todos los períodos</option>
          {periodos.map(p => (
            <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
              {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''}{p.es_vigente ? ' ★' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Error eliminación */}
      {errorElim && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">
          {errorElim}
        </div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando secciones…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && secciones.length === 0 && (
          <EmptyState
            icono="📋"
            titulo="Sin secciones registradas"
            descripcion="Crea la primera sección usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear sección</Button>}
          />
        )}
        {!cargando && !error && secciones.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Jornada</th>
                  <th style={est.th}>Curso</th>
                  <th style={est.th}>Sección</th>
                  <th style={est.th}>Período</th>
                  <th style={est.th}>Docente asignado</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map(s => {
                  // snake_case: periodo_academico, asignacion_activa
                  const docente = s.asignacion_activa?.docente
                  const enAccion = eliminando === s.id_seccion
                  return (
                    <tr key={s.id_seccion} style={est.tr}>
                      <td style={est.td}>
                        <div style={est.cursoNombre}>
                          {s.carrera_jornada?.jornada?.nombre_jornada ?? '—'}
                        </div>
                        {s.carrera_jornada?.carrera?.nombre_carrera && (
                          <code style={est.cursoCodigo}>
                            {s.carrera_jornada.carrera.nombre_carrera}
                          </code>
                        )}
                      </td>
                      <td style={est.td}>
                        <div style={est.cursoNombre}>{s.curso?.nombre_curso ?? '—'}</div>
                        {s.curso?.codigo_curso && (
                          <code style={est.cursoCodigo}>{s.curso.codigo_curso}</code>
                        )}
                      </td>
                      <td style={est.td}>
                        <span style={est.numSeccion}>{s.numero_seccion}</span>
                      </td>
                      <td style={est.td}>
                        <div style={est.periodoNombre}>
                          {s.periodo_academico?.nombre_periodo ?? '—'}
                        </div>
                        {s.periodo_academico?.anio && (
                          <div style={est.periodoAnio}>{s.periodo_academico.anio}</div>
                        )}
                      </td>
                      <td style={est.td}>
                        {docente
                          ? <div>
                              <div style={est.docenteNombre}>
                                {docente.usuario?.nombre_completo ?? '—'}
                              </div>
                              {docente.codigo_docente && (
                                <code style={est.cursoCodigo}>{docente.codigo_docente}</code>
                              )}
                            </div>
                          : <span style={est.sinDocente}>Sin asignar</span>
                        }
                      </td>
                      <td style={est.td}>
                        <Badge
                          texto={s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          variante={s.estado === 'activo' ? 'success' : 'neutral'}
                          dot
                        />
                      </td>
                      <td style={{ ...est.td, textAlign: 'right' }}>
                        {s.estado === 'activo' && (
                          <Button
                            variante="danger" size="sm"
                            cargando={enAccion}
                            disabled={enAccion}
                            onClick={() => onEliminar(s)}
                          >
                            Desactivar
                          </Button>
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
          Total: {secciones.length} sección{secciones.length !== 1 ? 'es' : ''}.
          No se pueden desactivar secciones con docente asignado.
          La asignación de docentes se gestiona en el módulo de Asignación.
        </p>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
// ── Subcomponente: filtro maestro Carrera → Jornada ─────────────────────────
// Igual que en SeccionForm: cascada real que envía id_carrera_jornada al padre.
function FiltroCarreraJornada({ carreras, idCarreraJornada, onChange }) {
  const [idCarrera,       setIdCarrera]       = useState('')
  const [jornadasFiltro,  setJornadasFiltro]  = useState([])
  const [cargando,        setCargando]         = useState(false)

  useEffect(() => {
    if (!idCarrera) { setJornadasFiltro([]); onChange(''); return }
    setCargando(true)
    import('../../api/axios').then(({ default: api }) =>
      api.get(`/carreras/${idCarrera}`)
        .then(r => setJornadasFiltro(r.data.jornadas_activas ?? []))
        .catch(() => setJornadasFiltro([]))
        .finally(() => setCargando(false))
    )
  }, [idCarrera]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
      <select
        value={idCarrera}
        onChange={e => { setIdCarrera(e.target.value); onChange('') }}
        style={est.select}
      >
        <option value="">Todas las carreras</option>
        {carreras.map(c => (
          <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
        ))}
      </select>
      <select
        value={idCarreraJornada}
        onChange={e => onChange(e.target.value)}
        disabled={!idCarrera || cargando}
        style={est.select}
      >
        <option value="">
          {!idCarrera ? 'Selecciona primero una carrera' : cargando ? 'Cargando…' : 'Todas las jornadas'}
        </option>
        {jornadasFiltro.map(j => (
          <option key={j.id_carrera_jornada} value={j.id_carrera_jornada}>
            {j.nombre_jornada}
          </option>
        ))}
      </select>
    </div>
  )
}

const est = {
  jornadaTabs: {
    display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap',
  },
  jornadaTab: {
    padding: '7px 16px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-sans)', transition: 'all .12s',
  },
  jornadaTabActivo: {
    background: 'var(--color-primary)', color: '#fff',
    border: '1.5px solid var(--color-primary)', fontWeight: 700,
  },
  formHeader:  { marginBottom: '16px' },
  formTitulo:  { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '14px',
  },
  alertaWarn: {
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: '#92400e', marginBottom: '12px',
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
  nota: { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
