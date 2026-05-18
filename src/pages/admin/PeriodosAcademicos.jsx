import { useState, useEffect, useCallback } from 'react'
import PageHeader           from '../../components/ui/PageHeader'
import Card                 from '../../components/ui/Card'
import Button               from '../../components/ui/Button'
import Badge                from '../../components/ui/Badge'
import EmptyState           from '../../components/ui/EmptyState'
import LoadingState         from '../../components/ui/LoadingState'
import ErrorState           from '../../components/ui/ErrorState'
import PeriodoAcademicoForm from '../../components/forms/PeriodoAcademicoForm'
import {
  getPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  eliminarPeriodo,
  marcarVigente,
} from '../../api/periodosAcademicos'

/** Mapa de estilos para el badge de estado */
const ESTADO_BADGE = {
  planificacion: { texto: 'Planificación', variante: 'neutral'  },
  activo:        { texto: 'Activo',        variante: 'success'  },
  cerrado:       { texto: 'Cerrado',       variante: 'warning'  },
  finalizado:    { texto: 'Finalizado',    variante: 'info'     },
}

export default function PeriodosAcademicos() {
  // ── Datos ──────────────────────────────────────────────────
  const [periodos,   setPeriodos]   = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [filtroEstado,   setFiltroEstado]   = useState('')
  const [filtroAnio,     setFiltroAnio]     = useState('')
  const [filtroVigente,  setFiltroVigente]  = useState('')

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Acciones de fila ───────────────────────────────────────
  const [marcandoVigente, setMarcandoVigente] = useState(null)
  const [eliminando,      setEliminando]      = useState(null)
  const [errorAccion,     setErrorAccion]     = useState(null)

  // ── Cargar ─────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado      = filtroEstado
      if (filtroAnio)    params.anio        = filtroAnio
      if (filtroVigente) params.es_vigente  = true
      setPeriodos(await getPeriodos(params))
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver los períodos académicos.'
          : (err.response?.data?.message ?? 'Error al cargar períodos.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroAnio, filtroVigente])

  useEffect(() => { cargar() }, [cargar])

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
        await actualizarPeriodo(editando.id_periodo_academico, datos)
      } else {
        await crearPeriodo(datos)
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
        setErrorForm(err.response?.data?.message ?? 'Error al guardar el período.')
      }
    }
  }

  // ── Marcar vigente ─────────────────────────────────────────
  async function onMarcarVigente(periodo) {
    if (periodo.es_vigente) return   // ya es vigente
    setMarcandoVigente(periodo.id_periodo_academico)
    setErrorAccion(null)
    try {
      await marcarVigente(periodo.id_periodo_academico)
      await cargar()
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'Error al marcar como vigente.')
    } finally {
      setMarcandoVigente(null)
    }
  }

  // ── Eliminar (cerrar) ──────────────────────────────────────
  async function onEliminar(periodo) {
    if (!window.confirm(
      `¿Cerrar el período "${periodo.nombre_periodo}"?\n` +
      `Solo es posible si está en estado Planificación y sin secciones registradas.`
    )) return
    setEliminando(periodo.id_periodo_academico)
    setErrorAccion(null)
    try {
      await eliminarPeriodo(periodo.id_periodo_academico)
      await cargar()
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'No se pudo cerrar el período.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Períodos académicos"
        descripcion="Gestiona los períodos académicos de la institución."
        accion={
          <Button variante="primary" onClick={abrirCrear}>
            + Nuevo período
          </Button>
        }
      />

      {/* Formulario */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={est.formHeader}>
            <h2 style={est.formTitulo}>
              {editando ? `Editar: ${editando.nombre_periodo}` : 'Nuevo período académico'}
            </h2>
          </div>
          {errorForm && <div style={est.alertaError} role="alert">{errorForm}</div>}
          <PeriodoAcademicoForm
            inicial={editando ?? {}}
            onGuardar={onGuardar}
            onCancelar={cerrarForm}
            errores422={errores422}
          />
        </Card>
      )}

      {/* Filtros */}
      <div style={est.filtros}>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="planificacion">Planificación</option>
          <option value="activo">Activo</option>
          <option value="cerrado">Cerrado</option>
          <option value="finalizado">Finalizado</option>
        </select>
        <input
          type="number" placeholder="Filtrar por año…"
          min={2000} max={2100}
          value={filtroAnio}
          onChange={e => setFiltroAnio(e.target.value)}
          style={{ ...est.select, width: '150px' }}
        />
        <label style={est.checkFiltro}>
          <input
            type="checkbox" checked={filtroVigente === '1'}
            onChange={e => setFiltroVigente(e.target.checked ? '1' : '')}
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Solo vigente
        </label>
      </div>

      {/* Error de acción */}
      {errorAccion && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">
          {errorAccion}
        </div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando períodos académicos…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && periodos.length === 0 && (
          <EmptyState
            icono="📅"
            titulo="Sin períodos académicos"
            descripcion="Crea el primer período usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear período</Button>}
          />
        )}
        {!cargando && !error && periodos.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Período</th>
                  <th style={est.th}>Año / N.°</th>
                  <th style={est.th}>Fechas</th>
                  <th style={est.th}>Límite edición</th>
                  <th style={est.th}>Estado</th>
                  <th style={est.th}>Vigente</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodos.map(p => {
                  const badgeMeta = ESTADO_BADGE[p.estado] ?? { texto: p.estado, variante: 'neutral' }
                  const enAccion  = marcandoVigente === p.id_periodo_academico
                                  || eliminando      === p.id_periodo_academico
                  return (
                    <tr key={p.id_periodo_academico} style={est.tr}>
                      <td style={est.td}>
                        <div style={est.nombrePeriodo}>{p.nombre_periodo}</div>
                      </td>
                      <td style={est.td}>
                        <code style={est.anio}>{p.anio}</code>
                        <span style={est.numPeriodo}> — P{p.numero_periodo}</span>
                      </td>
                      <td style={est.td}>
                        <div style={est.fecha}>{p.fecha_inicio}</div>
                        <div style={est.fechaHasta}>hasta {p.fecha_fin}</div>
                      </td>
                      <td style={est.td}>
                        {p.fecha_limite_edicion_horarios
                          ? <span style={est.fechaLimite}>{p.fecha_limite_edicion_horarios}</span>
                          : <span style={est.sinDato}>—</span>
                        }
                      </td>
                      <td style={est.td}>
                        <Badge texto={badgeMeta.texto} variante={badgeMeta.variante} dot />
                      </td>
                      <td style={est.td}>
                        {p.es_vigente
                          ? <Badge texto="Vigente" variante="success" dot />
                          : <span style={est.sinDato}>—</span>
                        }
                      </td>
                      <td style={{ ...est.td, textAlign: 'right' }}>
                        <div style={est.acciones}>
                          <Button
                            variante="ghost" size="sm"
                            onClick={() => abrirEditar(p)}
                            disabled={enAccion}
                          >
                            Editar
                          </Button>
                          {!p.es_vigente && (
                            <Button
                              variante="secondary" size="sm"
                              cargando={marcandoVigente === p.id_periodo_academico}
                              disabled={enAccion}
                              onClick={() => onMarcarVigente(p)}
                            >
                              Marcar vigente
                            </Button>
                          )}
                          {p.estado === 'planificacion' && (
                            <Button
                              variante="danger" size="sm"
                              cargando={eliminando === p.id_periodo_academico}
                              disabled={enAccion}
                              onClick={() => onEliminar(p)}
                            >
                              Cerrar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!cargando && !error && periodos.length > 0 && (
        <p style={est.nota}>
          "Cerrar" solo está disponible para períodos en estado Planificación sin secciones.
          "Marcar vigente" desmarca automáticamente el período vigente anterior.
        </p>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
  formHeader: { marginBottom: '16px' },
  formTitulo: { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '14px',
  },
  filtros: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  select: {
    padding: '8px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13.5px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', outline: 'none',
  },
  checkFiltro: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer',
  },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '11px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombrePeriodo: { fontWeight: 600 },
  anio: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 6px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
  },
  numPeriodo:  { color: 'var(--color-text-muted)', fontSize: '13px' },
  fecha:       { fontWeight: 500, fontSize: '13px' },
  fechaHasta:  { fontSize: '12px', color: 'var(--color-text-muted)' },
  fechaLimite: { fontSize: '12.5px', color: 'var(--color-warning)', fontWeight: 500 },
  sinDato:     { color: 'var(--color-text-muted)' },
  acciones:    { display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' },
  nota:        { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
