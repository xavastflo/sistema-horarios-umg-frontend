import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import CarreraForm  from '../../components/forms/CarreraForm'
import {
  getCarreras,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera,
  asignarCoordinador,
  desasignarCoordinador,
} from '../../api/carreras'
import { getFacultades } from '../../api/facultades'
import { getUsuarios } from '../../api/usuarios'

export default function Carreras() {
  const [carreras,   setCarreras]   = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)

  const [facultades,      setFacultades]      = useState([])
  const [cargandoFacs,    setCargandoFacs]    = useState(false)
  const [errorFacultades, setErrorFacultades] = useState(null)

  const [buscar,       setBuscar]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFac,    setFiltroFac]    = useState('')

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  // ── Estados para el Modal de Coordinador ─────────────────────
  const [modalCoord, setModalCoord] = useState(null) // Guardará el objeto de la carrera
  const [coordinadores, setCoordinadores] = useState([])
  const [idUsuarioCoord, setIdUsuarioCoord] = useState('')
  const [cargandoCoords, setCargandoCoords] = useState(false)
  const [errorModalCoord, setErrorModalCoord] = useState(null)
  const [guardandoCoord, setGuardandoCoord] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado      = filtroEstado
      if (filtroFac)     params.id_facultad = filtroFac
      if (buscar.trim()) params.buscar      = buscar.trim()
      const data = await getCarreras(params)
      setCarreras(data)
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver las carreras.'
          : (err.response?.data?.message ?? 'Error al cargar carreras.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroFac, buscar])

  useEffect(() => { cargar() }, [cargar])

  const cargarFacultades = useCallback(async () => {
    if (facultades.length > 0) return
    setCargandoFacs(true)
    setErrorFacultades(null)
    try {
      const data = await getFacultades({ estado: 'activo' })
      setFacultades(data)
    } catch {
      setErrorFacultades('No se pudieron cargar las facultades. Recarga la página.')
    } finally {
      setCargandoFacs(false)
    }
  }, [facultades.length])

  useEffect(() => { cargarFacultades() }, [cargarFacultades])

  async function abrirCrear() {
    setEditando(null)
    setErrores422({})
    setErrorForm(null)
    setMostrarForm(true)
    await cargarFacultades()
  }

  async function abrirEditar(carrera) {
    setEditando(carrera)
    setErrores422({})
    setErrorForm(null)
    setMostrarForm(true)
    await cargarFacultades()
  }

  function cerrarForm() {
    setMostrarForm(false)
    setEditando(null)
    setErrores422({})
    setErrorForm(null)
  }

  // ── Handlers de Coordinador ──────────────────────────────────
  async function abrirModalCoordinador(carrera) {
    setModalCoord(carrera)
    setIdUsuarioCoord(carrera.id_usuario_coordinador ?? '')
    setErrorModalCoord(null)
    setCargandoCoords(true)
    try {
      const todos = await getUsuarios({ estado: 'activo' })
      const lista = (Array.isArray(todos) ? todos : (todos.data ?? [])).filter(u => 
        (u.roles_activos ?? []).some(r => r.nombre_rol === 'coordinador')
      )
      setCoordinadores(lista)
    } catch {
      setErrorModalCoord('No se pudieron cargar los coordinadores activos.')
    } finally {
      setCargandoCoords(false)
    }
  }

  function cerrarModalCoordinador() {
    setModalCoord(null)
    setCoordinadores([])
    setIdUsuarioCoord('')
    setErrorModalCoord(null)
  }

  async function deGuardarCoordinador(e) {
    e.preventDefault()
    if (!idUsuarioCoord) {
      setErrorModalCoord('Por favor, selecciona un coordinador.')
      return
    }
    setGuardandoCoord(true)
    setErrorModalCoord(null)
    try {
      await asignarCoordinador(modalCoord.id_carrera, Number(idUsuarioCoord))
      cerrarModalCoordinador()
      await cargar()
    } catch (err) {
      setErrorModalCoord(err.response?.data?.message ?? 'Error al asignar el coordinador.')
    } finally {
      setGuardandoCoord(false)
    }
  }

  async function onQuitarCoordinador(carrera) {
    if (!window.confirm(`¿Remover al coordinador de la carrera "${carrera.nombre_carrera}"?`)) return
    setErrorElim(null)
    try {
      await desasignarCoordinador(carrera.id_carrera)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desasignar al coordinador.')
    }
  }

  async function onGuardar(datos) {
    setErrores422({})
    setErrorForm(null)
    try {
      if (editando) {
        await actualizarCarrera(editando.id_carrera, datos)
      } else {
        await crearCarrera(datos)
      }
      cerrarForm()
      await cargar()
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErrores422(err.response?.data?.errors ?? {})
        const msg = err.response?.data?.message
        if (msg && !err.response?.data?.errors) setErrorForm(msg)
      } else if (status === 403) {
        setErrorForm('No tienes permisos para realizar esta acción.')
      } else {
        setErrorForm(err.response?.data?.message ?? 'Error al guardar la carrera.')
      }
    }
  }

  async function onEliminar(carrera) {
    if (!window.confirm(`¿Desactivar la carrera "${carrera.nombre_carrera}"?`)) return
    setEliminando(carrera.id_carrera)
    setErrorElim(null)
    try {
      await eliminarCarrera(carrera.id_carrera)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar la carrera.')
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        titulo="Carreras"
        descripcion="Gestiona las carreras académicas de la institución."
        accion={
          <Button variante="primary" onClick={abrirCrear}>
            + Nueva carrera
          </Button>
        }
      />

      {/* Formulario Crear/Editar */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={estilos.formHeader}>
            <h2 style={estilos.formTitulo}>
              {editando ? `Editar: ${editando.nombre_carrera}` : 'Nueva carrera'}
            </h2>
          </div>

          {errorFacultades && (
            <div style={estilos.alertaWarn}>{errorFacultades}</div>
          )}
          {cargandoFacs && <LoadingState texto="Cargando facultades…" alto="60px" />}

          {errorForm && (
            <div style={estilos.alertaError} role="alert">{errorForm}</div>
          )}

          {!cargandoFacs && (
            <CarreraForm
              inicial={editando ?? {}}
              facultades={facultades}
              onGuardar={onGuardar}
              onCancelar={cerrarForm}
              errores422={errores422}
            />
          )}
        </Card>
      )}

      {/* Modal Independiente de Asignación de Coordinador */}
      {modalCoord && (
        <div style={estilos.modalOverlay}>
          <Card style={estilos.modalContenedor}>
            <div style={estilos.formHeader}>
              <h2 style={estilos.formTitulo}>Asignar Coordinador: {modalCoord.nombre_carrera}</h2>
            </div>
            
            {errorModalCoord && (
              <div style={estilos.alertaError} role="alert">{errorModalCoord}</div>
            )}

            {cargandoCoords ? (
              <LoadingState texto="Buscando coordinadores activos…" alto="80px" />
            ) : (
              <form onSubmit={deGuardarCoordinador} style={estilos.modalForm}>
                <div style={estilos.campoModal}>
                  <label style={estilos.labelModal}>Seleccione un usuario con rol de coordinador:</label>
                  <select
                    value={idUsuarioCoord}
                    onChange={e => setIdUsuarioCoord(e.target.value)}
                    disabled={guardandoCoord}
                    style={estilos.selectModal}
                  >
                    <option value="">— Seleccionar Coordinador —</option>
                    {coordinadores.map(u => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.nombres} {u.apellidos} ({u.nombre_usuario})
                      </option>
                    ))}
                  </select>
                  {coordinadores.length === 0 && (
                    <span style={estilos.infoAviso}>No se encontraron usuarios activos con rol de coordinador.</span>
                  )}
                </div>

                <div style={estilos.accionesModal}>
                  <Button variante="ghost" type="button" onClick={cerrarModalCoordinador} disabled={guardandoCoord}>
                    Cancelar
                  </Button>
                  <Button variante="primary" type="submit" cargando={guardandoCoord}>
                    Guardar Coordinador
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div style={estilos.filtros}>
        <input
          type="text"
          placeholder="Buscar por nombre o código…"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          style={estilos.inputBuscar}
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={estilos.select}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select
          value={filtroFac}
          onChange={e => setFiltroFac(e.target.value)}
          style={estilos.select}
        >
          <option value="">Todas las facultades</option>
          {facultades.map(f => (
            <option key={f.id_facultad} value={f.id_facultad}>{f.nombre_facultad}</option>
          ))}
        </select>
      </div>

      {errorElim && (
        <div style={{ ...estilos.alertaError, marginBottom: '12px' }} role="alert">
          {errorElim}
        </div>
      )}

      {/* Tabla */}
      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando carreras…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && carreras.length === 0 && (
          <EmptyState
            icono="🎓"
            titulo="Sin carreras registradas"
            descripcion="Crea la primera carrera usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear carrera</Button>}
          />
        )}
        {!cargando && !error && carreras.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={estilos.tabla}>
              <thead>
                <tr>
                  <th style={estilos.th}>Carrera</th>
                  <th style={estilos.th}>Código</th>
                  <th style={estilos.th}>Facultad</th>
                  <th style={estilos.th}>Coordinador</th>
                  <th style={estilos.th}>Jornadas</th>
                  <th style={estilos.th}>Estado</th>
                  <th style={{ ...estilos.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carreras.map(c => (
                  <tr key={c.id_carrera} style={estilos.tr}>
                    <td style={estilos.td}>
                      <div style={estilos.nombreCarrera}>{c.nombre_carrera}</div>
                    </td>
                    <td style={estilos.td}>
                      <code style={estilos.codigo}>{c.codigo_carrera}</code>
                    </td>
                    <td style={estilos.td}>
                      <span style={estilos.facultadNombre}>
                        {c.facultad?.nombre_facultad ?? '—'}
                      </span>
                      {c.facultad?.codigo_facultad && (
                        <span style={estilos.facultadCodigo}>
                          {' '}({c.facultad.codigo_facultad})
                        </span>
                      )}
                    </td>
                    <td style={estilos.td}>
                      {c.coordinador
                        ? <span style={estilos.coordinador}>
                            {c.coordinador.nombres} {c.coordinador.apellidos}
                          </span>
                        : <span style={estilos.sinDato}>Sin asignar</span>
                      }
                    </td>
                    <td style={estilos.td}>
                      {(c.jornadas_activas?.length ?? 0) > 0
                        ? <div style={estilos.jornadas}>
                            {c.jornadas_activas.map(j => (
                              <Badge
                                key={j.id_jornada}
                                texto={j.nombre_jornada}
                                variante="info"
                              />
                            ))}
                          </div>
                        : <span style={estilos.sinDato}>—</span>
                      }
                    </td>
                    <td style={estilos.td}>
                      <Badge
                        texto={c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        variante={c.estado === 'activo' ? 'success' : 'neutral'}
                        dot
                      />
                    </td>
                    <td style={{ ...estilos.td, textAlign: 'right' }}>
                      <div style={estilos.acciones}>
                        <Button
                          variante="ghost"
                          size="sm"
                          onClick={() => abrirEditar(c)}
                          disabled={eliminando === c.id_carrera}
                        >
                          Editar
                        </Button>
                        
                        {/* Botones Dinámicos para la gestión del coordinador */}
                        {c.estado === 'activo' && (
                          c.coordinador ? (
                            <>
                              <Button
                                variante="ghost"
                                size="sm"
                                onClick={() => abrirModalCoordinador(c)}
                              >
                                Cambiar coord.
                              </Button>
                              <Button
                                variante="ghost"
                                size="sm"
                                onClick={() => onQuitarCoordinador(c)}
                                style={{ color: '#b91c1c' }}
                              >
                                Quitar coord.
                              </Button>
                            </>
                          ) : (
                            <Button
                              variante="ghost"
                              size="sm"
                              onClick={() => abrirModalCoordinador(c)}
                            >
                              Asignar coord.
                            </Button>
                          )
                        )}

                        {c.estado === 'activo' && (
                          <Button
                            variante="danger"
                            size="sm"
                            cargando={eliminando === c.id_carrera}
                            onClick={() => onEliminar(c)}
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

const estilos = {
  formHeader: { marginBottom: '16px' },
  formTitulo: { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
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
  tabla:        { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '11px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr:           { borderBottom: '1px solid var(--color-border)' },
  td:           { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombreCarrera:{ fontWeight: 600 },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  facultadNombre: { fontWeight: 500 },
  facultadCodigo: { color: 'var(--color-text-muted)', fontSize: '12px' },
  coordinador:  { fontSize: '13px' },
  sinDato:      { color: 'var(--color-text-muted)', fontSize: '12.5px' },
  jornadas:     { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  acciones:     { display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' },
  
  // Estilos añadidos de forma limpia para el Modal
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    backdropFilter: 'blur(2px)'
  },
  modalContenedor: {
    width: '100%', maxWidth: '460px', padding: '20px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  campoModal: { display: 'flex', flexDirection: 'column', gap: '6px' },
  labelModal: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  selectModal: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', outline: 'none', width: '100%'
  },
  infoAviso: { fontSize: '12px', color: '#b45309', fontWeight: 500, marginTop: '2px' },
  accionesModal: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '4px'
  }
}