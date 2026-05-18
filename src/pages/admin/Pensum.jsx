import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import PensumForm   from '../../components/forms/PensumForm'
import {
  getPensums,
  crearPensum,
  actualizarPensum,
  eliminarPensum,
} from '../../api/pensum'
import { getCarreras }  from '../../api/carreras'
import { getPeriodos }  from '../../api/periodosAcademicos'

/**
 * Pensum — módulo CRUD de pensums.
 *
 * Endpoints:
 *   GET    /pensums
 *   POST   /pensums
 *   PUT    /pensums/{id}
 *   DELETE /pensums/{id}
 *
 * Catálogos auxiliares (carga al montar):
 *   GET    /carreras?estado=activo
 *   GET    /periodos-academicos?estado=activo
 */
export default function Pensum() {
  // ── Datos principales ──────────────────────────────────────
  const [pensums,    setPensums]    = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)

  // ── Catálogos para los selects del form ────────────────────
  const [carreras,      setCarreras]      = useState([])
  const [periodos,      setPeriodos]      = useState([])
  const [cargandoCat,   setCargandoCat]   = useState(false)
  const [errorCatalog,  setErrorCatalog]  = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [filtroEstado,  setFiltroEstado]  = useState('')
  const [filtroCarrera, setFiltroCarrera] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('')

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  // ── Cargar pensums ─────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado               = filtroEstado
      if (filtroCarrera) params.id_carrera            = filtroCarrera
      if (filtroPeriodo) params.id_periodo_academico  = filtroPeriodo
      setPensums(await getPensums(params))
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver los pensums.'
          : (err.response?.data?.message ?? 'Error al cargar pensums.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroCarrera, filtroPeriodo])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar catálogos al montar (una sola vez) ──────────────
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCat(true)
      setErrorCatalog(null)
      try {
        const [dataCarreras, dataPeriodos] = await Promise.all([
          getCarreras({ estado: 'activo' }),
          getPeriodos(),  // sin filtro de estado: períodos en planificacion también deben aparecer
        ])
        setCarreras(dataCarreras)
        setPeriodos(dataPeriodos)
      } catch {
        setErrorCatalog('Error al cargar carreras o períodos. Recarga la página.')
      } finally {
        setCargandoCat(false)
      }
    }
    cargarCatalogos()
  }, [])

  // ── Formulario helpers ─────────────────────────────────────
  function abrirCrear() {
    setEditando(null); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function abrirEditar(p) {
    setEditando(p); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function cerrarForm() {
    setMostrarForm(false); setEditando(null); setErrores422({}); setErrorForm(null)
  }

  // ── Guardar ────────────────────────────────────────────────
  async function onGuardar(datos) {
    setErrores422({}); setErrorForm(null)
    try {
      if (editando) {
        await actualizarPensum(editando.id_pensum, datos)
      } else {
        await crearPensum(datos)
      }
      cerrarForm()
      await cargar()
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErrores422(err.response?.data?.errors ?? {})
        setErrorForm(err.response?.data?.message ?? null)
      } else if (status === 403) {
        setErrorForm('No tienes permisos para esta acción.')
      } else {
        setErrorForm(err.response?.data?.message ?? 'Error al guardar el pensum.')
      }
    }
  }

  // ── Desactivar ─────────────────────────────────────────────
  async function onEliminar(pensum) {
    if (!window.confirm(`¿Desactivar el pensum "${pensum.nombre_pensum}"?`)) return
    setEliminando(pensum.id_pensum)
    setErrorElim(null)
    try {
      await eliminarPensum(pensum.id_pensum)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar el pensum.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Pensums"
        descripcion="Gestiona los pensums académicos por carrera y período."
        accion={
          <Button variante="primary" onClick={abrirCrear} disabled={cargandoCat}>
            + Nuevo pensum
          </Button>
        }
      />

      {/* Formulario */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={est.formHeader}>
            <h2 style={est.formTitulo}>
              {editando ? `Editar: ${editando.nombre_pensum}` : 'Nuevo pensum'}
            </h2>
          </div>
          {errorCatalog && <div style={est.alertaWarn}>{errorCatalog}</div>}
          {cargandoCat  && <LoadingState texto="Cargando carreras y períodos…" alto="60px" />}
          {errorForm    && <div style={est.alertaError} role="alert">{errorForm}</div>}
          {!cargandoCat && (
            <PensumForm
              inicial={editando ?? {}}
              carreras={carreras}
              periodos={periodos}
              onGuardar={onGuardar}
              onCancelar={cerrarForm}
              errores422={errores422}
            />
          )}
        </Card>
      )}

      {/* Filtros */}
      <div style={est.filtros}>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select value={filtroCarrera} onChange={e => setFiltroCarrera(e.target.value)} style={est.select}>
          <option value="">Todas las carreras</option>
          {carreras.map(c => (
            <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
          ))}
        </select>
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={est.select}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => (
            <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
              {p.nombre_periodo}{p.anio ? ` (${p.anio})` : ''} — {p.estado ?? ''}{p.es_vigente ? ' ★' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Error eliminación */}
      {errorElim && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">{errorElim}</div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando pensums…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && pensums.length === 0 && (
          <EmptyState
            icono="📖"
            titulo="Sin pensums registrados"
            descripcion="Crea el primer pensum usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear pensum</Button>}
          />
        )}
        {!cargando && !error && pensums.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Pensum</th>
                  <th style={est.th}>Código</th>
                  <th style={est.th}>Carrera</th>
                  <th style={est.th}>Período</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pensums.map(p => (
                  <tr key={p.id_pensum} style={est.tr}>
                    <td style={est.td}>
                      <div style={est.nombre}>{p.nombre_pensum}</div>
                      {p.descripcion && <div style={est.desc}>{p.descripcion}</div>}
                    </td>
                    <td style={est.td}>
                      <code style={est.codigo}>{p.codigo_pensum}</code>
                    </td>
                    <td style={est.td}>
                      {p.carrera?.nombre_carrera ?? '—'}
                    </td>
                    <td style={est.td}>
                      <div style={est.periodo}>{p.periodo_academico?.nombre_periodo ?? '—'}</div>
                      {p.periodo_academico && (
                        <div style={est.anio}>{p.periodo_academico.anio}</div>
                      )}
                    </td>
                    <td style={est.td}>
                      <Badge
                        texto={p.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        variante={p.estado === 'activo' ? 'success' : 'neutral'}
                        dot
                      />
                    </td>
                    <td style={{ ...est.td, textAlign: 'right' }}>
                      <div style={est.acciones}>
                        <Button
                          variante="ghost" size="sm"
                          onClick={() => abrirEditar(p)}
                          disabled={eliminando === p.id_pensum}
                        >
                          Editar
                        </Button>
                        {p.estado === 'activo' && (
                          <Button
                            variante="danger" size="sm"
                            cargando={eliminando === p.id_pensum}
                            onClick={() => onEliminar(p)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
  formHeader:   { marginBottom: '16px' },
  formTitulo:   { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
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
  filtros:  { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  select: {
    padding: '8px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13.5px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', outline: 'none',
  },
  tabla:    { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '11px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr:       { borderBottom: '1px solid var(--color-border)' },
  td:       { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombre:   { fontWeight: 600, marginBottom: '2px' },
  desc:     { fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  periodo:  { fontWeight: 500 },
  anio:     { fontSize: '12px', color: 'var(--color-text-muted)' },
  acciones: { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
}
