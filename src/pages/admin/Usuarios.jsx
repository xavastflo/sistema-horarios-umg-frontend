import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import UsuarioForm  from '../../components/forms/UsuarioForm'
import {
  getRoles,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  asignarRol,
  quitarRol,
} from '../../api/usuarios'

/**
 * Usuarios — gestión de usuarios del sistema.
 * Solo accesible para administrador.
 *
 * Serialización importante:
 *   roles_activos (snake_case) — relación rolesActivos() de Eloquent
 *
 * Objetivo práctico: crear usuarios con rol docente para usarlos
 * en el módulo Docentes.
 */

const ESTADO_BADGE = {
  activo:   { texto: 'Activo',    variante: 'success' },
  inactivo: { texto: 'Inactivo',  variante: 'neutral' },
  bloqueado:{ texto: 'Bloqueado', variante: 'error'   },
}

const ROL_VARIANTE = {
  administrador: 'error',
  coordinador:   'warning',
  docente:       'info',
  estudiante:    'neutral',
}

export default function Usuarios() {
  // ── Datos ──────────────────────────────────────────────────
  const [usuarios,    setUsuarios]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)

  // ── Catálogo de roles ──────────────────────────────────────
  const [roles,       setRoles]       = useState([])

  // ── Filtros ────────────────────────────────────────────────
  const [buscar,      setBuscar]      = useState('')
  const [filtroEstado,setFiltroEstado]= useState('')
  const [filtroRol,   setFiltroRol]   = useState('')

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  // ── Gestión de roles (inline) ──────────────────────────────
  const [usuarioRol,  setUsuarioRol]  = useState(null)  // id_usuario con panel de roles abierto
  const [rolSelec,    setRolSelec]    = useState('')
  const [asignandoRol,setAsignandoRol]= useState(false)
  const [quitandoRol, setQuitandoRol] = useState(null)  // id_rol en proceso
  const [errorRol,    setErrorRol]    = useState(null)

  // ── Cargar usuarios ────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado  = filtroEstado
      if (filtroRol)     params.id_rol  = filtroRol
      if (buscar.trim()) params.buscar  = buscar.trim()
      setUsuarios(await getUsuarios(params))
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver los usuarios.'
          : (err.response?.data?.message ?? 'Error al cargar usuarios.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroRol, buscar])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar catálogo de roles al montar ─────────────────────
  useEffect(() => {
    getRoles().then(setRoles).catch(() => {})
  }, [])

  // ── Formulario helpers ─────────────────────────────────────
  function abrirCrear() {
    setEditando(null); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function abrirEditar(u) {
    setEditando(u); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function cerrarForm() {
    setMostrarForm(false); setEditando(null); setErrores422({}); setErrorForm(null)
  }

  // ── Guardar ────────────────────────────────────────────────
  async function onGuardar(datos) {
    setErrores422({}); setErrorForm(null)
    try {
      if (editando) {
        await actualizarUsuario(editando.id_usuario, datos)
      } else {
        await crearUsuario(datos)
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
        setErrorForm(err.response?.data?.message ?? 'Error al guardar el usuario.')
      }
    }
  }

  // ── Desactivar ─────────────────────────────────────────────
  async function onEliminar(usuario) {
    if (!window.confirm(`¿Desactivar al usuario "${usuario.nombre_usuario}"?`)) return
    setEliminando(usuario.id_usuario)
    setErrorElim(null)
    try {
      await eliminarUsuario(usuario.id_usuario)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar el usuario.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Gestión de roles inline ────────────────────────────────
  function togglePanelRol(idUsuario) {
    setUsuarioRol(prev => prev === idUsuario ? null : idUsuario)
    setRolSelec('')
    setErrorRol(null)
  }

  async function onAsignarRol(idUsuario) {
    if (!rolSelec) return
    setAsignandoRol(true)
    setErrorRol(null)
    try {
      await asignarRol(idUsuario, Number(rolSelec))
      await cargar()
      setRolSelec('')
    } catch (err) {
      setErrorRol(err.response?.data?.message ?? 'Error al asignar el rol.')
    } finally {
      setAsignandoRol(false)
    }
  }

  async function onQuitarRol(idUsuario, idRol) {
    setQuitandoRol(idRol)
    setErrorRol(null)
    try {
      await quitarRol(idUsuario, idRol)
      await cargar()
    } catch (err) {
      setErrorRol(err.response?.data?.message ?? 'Error al quitar el rol.')
    } finally {
      setQuitandoRol(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Usuarios"
        descripcion="Gestiona los usuarios del sistema y sus roles."
        accion={<Button variante="primary" onClick={abrirCrear}>+ Nuevo usuario</Button>}
      />

      {/* Formulario */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={est.formHeader}>
            <h2 style={est.formTitulo}>
              {editando ? `Editar: ${editando.nombre_usuario}` : 'Nuevo usuario'}
            </h2>
          </div>
          {errorForm && <div style={est.alertaError} role="alert">{errorForm}</div>}
          <UsuarioForm
            inicial={editando ?? {}}
            onGuardar={onGuardar}
            onCancelar={cerrarForm}
            errores422={errores422}
          />
        </Card>
      )}

      {/* Filtros */}
      <div style={est.filtros}>
        <input
          type="text" placeholder="Buscar por nombre, usuario o correo…"
          value={buscar} onChange={e => setBuscar(e.target.value)}
          style={est.inputBuscar}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} style={est.select}>
          <option value="">Todos los roles</option>
          {roles.map(r => (
            <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
          ))}
        </select>
      </div>

      {/* Error eliminación */}
      {errorElim && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">{errorElim}</div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando usuarios…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && usuarios.length === 0 && (
          <EmptyState
            icono="👤"
            titulo="Sin usuarios registrados"
            descripcion="Crea el primer usuario usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear usuario</Button>}
          />
        )}
        {!cargando && !error && usuarios.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Usuario</th>
                  <th style={est.th}>Correo</th>
                  <th style={est.th}>Roles</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  // snake_case: roles_activos (serialización Eloquent de rolesActivos())
                  const rolesActivos = u.roles_activos ?? []
                  const badgeMeta = ESTADO_BADGE[u.estado] ?? { texto: u.estado, variante: 'neutral' }
                  const enAccion = eliminando === u.id_usuario
                  const panelAbierto = usuarioRol === u.id_usuario

                  return (
                    <>
                      <tr key={u.id_usuario} style={est.tr}>
                        <td style={est.td}>
                          <div style={est.nombreCompleto}>
                            {u.nombres} {u.apellidos}
                          </div>
                          <code style={est.codigoUsuario}>{u.nombre_usuario}</code>
                        </td>
                        <td style={est.td}>
                          <span style={est.correo}>{u.correo_electronico}</span>
                          {u.telefono && <div style={est.telefono}>{u.telefono}</div>}
                        </td>
                        <td style={est.td}>
                          {rolesActivos.length === 0
                            ? <span style={est.sinRol}>Sin roles</span>
                            : <div style={est.roles}>
                                {rolesActivos.map(r => (
                                  <Badge
                                    key={r.id_rol}
                                    texto={r.nombre_rol}
                                    variante={ROL_VARIANTE[r.nombre_rol] ?? 'neutral'}
                                  />
                                ))}
                              </div>
                          }
                        </td>
                        <td style={est.td}>
                          <Badge texto={badgeMeta.texto} variante={badgeMeta.variante} dot />
                        </td>
                        <td style={{ ...est.td, textAlign: 'right' }}>
                          <div style={est.acciones}>
                            <Button
                              variante={panelAbierto ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => togglePanelRol(u.id_usuario)}
                              disabled={enAccion}
                            >
                              Roles
                            </Button>
                            <Button
                              variante="ghost" size="sm"
                              onClick={() => abrirEditar(u)}
                              disabled={enAccion}
                            >
                              Editar
                            </Button>
                            {u.estado === 'activo' && (
                              <Button
                                variante="danger" size="sm"
                                cargando={enAccion}
                                onClick={() => onEliminar(u)}
                              >
                                Desactivar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Panel inline de roles */}
                      {panelAbierto && (
                        <tr key={`rol-${u.id_usuario}`}>
                          <td colSpan={5} style={est.panelRolWrapper}>
                            <div style={est.panelRol}>
                              <p style={est.panelRolTitulo}>Gestión de roles — {u.nombre_usuario}</p>

                              {/* Roles actuales con botón quitar */}
                              <div style={est.rolesActuales}>
                                {rolesActivos.length === 0
                                  ? <span style={est.sinRol}>Sin roles asignados</span>
                                  : rolesActivos.map(r => (
                                      <div key={r.id_rol} style={est.rolChip}>
                                        <Badge
                                          texto={r.nombre_rol}
                                          variante={ROL_VARIANTE[r.nombre_rol] ?? 'neutral'}
                                        />
                                        <button
                                          style={est.btnQuitarRol}
                                          disabled={quitandoRol === r.id_rol}
                                          onClick={() => onQuitarRol(u.id_usuario, r.id_rol)}
                                          title="Quitar rol"
                                        >
                                          {quitandoRol === r.id_rol ? '…' : '×'}
                                        </button>
                                      </div>
                                    ))
                                }
                              </div>

                              {/* Asignar nuevo rol */}
                              <div style={est.asignarRolRow}>
                                <select
                                  value={rolSelec}
                                  onChange={e => { setRolSelec(e.target.value); setErrorRol(null) }}
                                  disabled={asignandoRol}
                                  style={est.selectRol}
                                >
                                  <option value="">— Selecciona un rol —</option>
                                  {roles
                                    .filter(r => !rolesActivos.some(ra => ra.id_rol === r.id_rol))
                                    .map(r => (
                                      <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                                    ))
                                  }
                                </select>
                                <Button
                                  variante="secondary" size="sm"
                                  cargando={asignandoRol}
                                  disabled={!rolSelec || asignandoRol}
                                  onClick={() => onAsignarRol(u.id_usuario)}
                                >
                                  Asignar
                                </Button>
                              </div>

                              {errorRol && (
                                <p style={est.errorRol}>{errorRol}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!cargando && !error && usuarios.length > 0 && (
        <p style={est.nota}>
          Total: {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}.
          Para crear un docente, asigna el rol "docente" al usuario y luego ve al módulo Docentes.
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
  tr:            { borderBottom: '1px solid var(--color-border)' },
  td:            { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombreCompleto:{ fontWeight: 600, marginBottom: '2px' },
  codigoUsuario: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 6px', borderRadius: 'var(--radius-sm)',
    fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  correo:    { fontSize: '13px' },
  telefono:  { fontSize: '12px', color: 'var(--color-text-muted)' },
  roles:     { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  sinRol:    { fontSize: '12.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' },
  acciones:  { display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' },

  // Panel de roles inline
  panelRolWrapper: { padding: '0', background: 'var(--color-bg)' },
  panelRol: {
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px',
    borderLeft: '3px solid var(--color-primary)',
  },
  panelRolTitulo: { fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
  rolesActuales:  { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  rolChip:  { display: 'flex', alignItems: 'center', gap: '4px' },
  btnQuitarRol: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--color-error)', fontWeight: 700, fontSize: '14px',
    lineHeight: 1, padding: '0 2px',
  },
  asignarRolRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  selectRol: {
    padding: '7px 10px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', outline: 'none',
  },
  errorRol: { fontSize: '12.5px', color: 'var(--color-error)', fontWeight: 500, margin: 0 },
  nota:  { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
