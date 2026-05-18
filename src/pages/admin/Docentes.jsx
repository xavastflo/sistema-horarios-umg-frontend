import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import DocenteForm  from '../../components/forms/DocenteForm'
import { useAuth }  from '../../context/AuthContext'
import {
  getDocentes,
  crearDocente,
  actualizarDocente,
  eliminarDocente,
  cambiarPrioridad,
  getUsuariosDocentes,
} from '../../api/docentes'

/** Badge por prioridad */
const PRIORIDAD_META = {
  1: { texto: 'Alta',  variante: 'error'   },
  2: { texto: 'Media', variante: 'warning' },
  3: { texto: 'Baja',  variante: 'neutral' },
}

export default function Docentes() {
  const { perfilActivo } = useAuth()
  const esAdmin = perfilActivo === 'administrador'

  // ── Datos ──────────────────────────────────────────────────
  const [docentes,    setDocentes]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)

  // ── Usuarios para el select del form (solo admin) ──────────
  const [usuarios,       setUsuarios]       = useState([])
  const [cargandoUsers,  setCargandoUsers]  = useState(false)
  const [errorUsers,     setErrorUsers]     = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [buscar,       setBuscar]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPrior,  setFiltroPrior]  = useState('')

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Acciones de fila ───────────────────────────────────────
  const [cambiandoPrior, setCambiandoPrior] = useState(null)
  const [eliminando,     setEliminando]     = useState(null)
  const [errorAccion,    setErrorAccion]    = useState(null)

  // ── Cargar docentes ────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado    = filtroEstado
      if (filtroPrior)   params.prioridad = filtroPrior
      if (buscar.trim()) params.buscar    = buscar.trim()
      setDocentes(await getDocentes(params))
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver los docentes.'
          : (err.response?.data?.message ?? 'Error al cargar docentes.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroPrior, buscar])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar usuarios con rol docente (solo admin, una vez) ──
  async function cargarUsuarios() {
    if (!esAdmin || usuarios.length > 0) return
    setCargandoUsers(true)
    setErrorUsers(null)
    try {
      const data = await getUsuariosDocentes()
      setUsuarios(data)
    } catch {
      setErrorUsers('No se pudieron cargar los usuarios. Verifica permisos.')
    } finally {
      setCargandoUsers(false)
    }
  }

  // ── Formulario helpers ─────────────────────────────────────
  async function abrirCrear() {
    setEditando(null); setErrores422({}); setErrorForm(null)
    setMostrarForm(true)
    await cargarUsuarios()
  }
  function abrirEditar(d) {
    setEditando(d); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function cerrarForm() {
    setMostrarForm(false); setEditando(null); setErrores422({}); setErrorForm(null)
  }

  // ── Guardar ────────────────────────────────────────────────
  async function onGuardar(datos) {
    setErrores422({}); setErrorForm(null)
    try {
      if (editando) {
        await actualizarDocente(editando.id_docente, datos)
      } else {
        await crearDocente(datos)
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
        setErrorForm(err.response?.data?.message ?? 'Error al guardar el docente.')
      }
    }
  }

  // ── Cambio rápido de prioridad (PATCH) ─────────────────────
  async function onCambiarPrioridad(docente, nuevaPrior) {
    if (docente.prioridad === nuevaPrior) return
    setCambiandoPrior(docente.id_docente)
    setErrorAccion(null)
    try {
      await cambiarPrioridad(docente.id_docente, nuevaPrior)
      await cargar()
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'Error al cambiar la prioridad.')
    } finally {
      setCambiandoPrior(null)
    }
  }

  // ── Desactivar ─────────────────────────────────────────────
  async function onEliminar(docente) {
    if (!window.confirm(
      `¿Desactivar al docente "${docente.usuario?.nombre_completo ?? docente.codigo_docente}"?`
    )) return
    setEliminando(docente.id_docente)
    setErrorAccion(null)
    try {
      await eliminarDocente(docente.id_docente)
      await cargar()
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'No se pudo desactivar el docente.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Docentes"
        descripcion="Gestiona los perfiles docentes de la institución."
        accion={
          esAdmin
            ? <Button variante="primary" onClick={abrirCrear}>+ Nuevo docente</Button>
            : null
        }
      />

      {/* Formulario */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={est.formHeader}>
            <h2 style={est.formTitulo}>
              {editando
                ? `Editar: ${editando.usuario?.nombre_completo ?? editando.codigo_docente}`
                : 'Nuevo perfil docente'}
            </h2>
          </div>
          {errorUsers  && <div style={est.alertaWarn}>{errorUsers}</div>}
          {cargandoUsers && <LoadingState texto="Cargando usuarios…" alto="50px" />}
          {errorForm   && <div style={est.alertaError} role="alert">{errorForm}</div>}
          {!cargandoUsers && (
            <DocenteForm
              inicial={editando ?? {}}
              usuariosDisp={usuarios}
              onGuardar={onGuardar}
              onCancelar={cerrarForm}
              errores422={errores422}
              esAdmin={esAdmin}
            />
          )}
        </Card>
      )}

      {/* Filtros */}
      <div style={est.filtros}>
        <input
          type="text" placeholder="Buscar por nombre o código…"
          value={buscar} onChange={e => setBuscar(e.target.value)}
          style={est.inputBuscar}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select value={filtroPrior} onChange={e => setFiltroPrior(e.target.value)} style={est.select}>
          <option value="">Todas las prioridades</option>
          <option value="1">1 — Alta</option>
          <option value="2">2 — Media</option>
          <option value="3">3 — Baja</option>
        </select>
      </div>

      {/* Error de acción */}
      {errorAccion && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">
          {errorAccion}
        </div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando docentes…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && docentes.length === 0 && (
          <EmptyState
            icono="👨‍🏫"
            titulo="Sin docentes registrados"
            descripcion={esAdmin
              ? 'Crea el primer perfil docente usando el botón de arriba.'
              : 'No hay docentes registrados en el sistema.'}
            accion={esAdmin
              ? <Button variante="secondary" onClick={abrirCrear}>+ Crear docente</Button>
              : null}
          />
        )}
        {!cargando && !error && docentes.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Docente</th>
                  <th style={est.th}>Código</th>
                  <th style={est.th}>Prioridad</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docentes.map(d => {
                  const meta = PRIORIDAD_META[d.prioridad] ?? { texto: `P${d.prioridad}`, variante: 'neutral' }
                  const enAccion = cambiandoPrior === d.id_docente || eliminando === d.id_docente
                  return (
                    <tr key={d.id_docente} style={est.tr}>
                      <td style={est.td}>
                        <div style={est.nombre}>
                          {d.usuario?.nombre_completo ?? '—'}
                        </div>
                        <div style={est.usuario}>{d.usuario?.nombre_usuario}</div>
                      </td>
                      <td style={est.td}>
                        {d.codigo_docente
                          ? <code style={est.codigo}>{d.codigo_docente}</code>
                          : <span style={est.sinDato}>—</span>
                        }
                      </td>
                      <td style={est.td}>
                        <Badge texto={meta.texto} variante={meta.variante} dot />
                      </td>
                      <td style={est.td}>
                        <Badge
                          texto={d.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          variante={d.estado === 'activo' ? 'success' : 'neutral'}
                          dot
                        />
                      </td>
                      <td style={{ ...est.td, textAlign: 'right' }}>
                        <div style={est.acciones}>
                          {/* Cambio rápido de prioridad — select inline */}
                          {d.estado === 'activo' && (
                            <select
                              value={d.prioridad}
                              onChange={e => onCambiarPrioridad(d, Number(e.target.value))}
                              disabled={enAccion}
                              style={est.selectPrioridad}
                              title="Cambiar prioridad"
                            >
                              <option value={1}>Alta</option>
                              <option value={2}>Media</option>
                              <option value={3}>Baja</option>
                            </select>
                          )}
                          <Button
                            variante="ghost" size="sm"
                            onClick={() => abrirEditar(d)}
                            disabled={enAccion}
                          >
                            Editar
                          </Button>
                          {d.estado === 'activo' && (
                            <Button
                              variante="danger" size="sm"
                              cargando={eliminando === d.id_docente}
                              disabled={enAccion}
                              onClick={() => onEliminar(d)}
                            >
                              Desactivar
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

      {!cargando && !error && docentes.length > 0 && (
        <p style={est.nota}>
          Ordenados por prioridad (Alta → Baja). Prioridad define el orden en la asignación automática.
        </p>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
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
  inputBuscar: {
    flex: '1 1 200px', padding: '8px 12px', minWidth: '160px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '13.5px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', outline: 'none',
  },
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
  tr:      { borderBottom: '1px solid var(--color-border)' },
  td:      { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombre:  { fontWeight: 600, marginBottom: '2px' },
  usuario: { fontSize: '12px', color: 'var(--color-text-muted)' },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  sinDato: { color: 'var(--color-text-muted)' },
  acciones: { display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' },
  selectPrioridad: {
    padding: '5px 8px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', outline: 'none',
  },
  nota: { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
