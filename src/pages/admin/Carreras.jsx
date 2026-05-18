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
} from '../../api/carreras'
import { getFacultades } from '../../api/facultades'

/**
 * Carreras — módulo CRUD para administrador.
 * Consume: GET, POST, PUT, DELETE /api/carreras
 * Consume: GET /api/facultades (para el select del formulario)
 */
export default function Carreras() {
  // ── Datos principales ──────────────────────────────────────
  const [carreras,   setCarreras]   = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)

  // ── Facultades para el select ──────────────────────────────
  const [facultades,      setFacultades]      = useState([])
  const [cargandoFacs,    setCargandoFacs]    = useState(false)
  const [errorFacultades, setErrorFacultades] = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [buscar,       setBuscar]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFac,    setFiltroFac]    = useState('')

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  // ── Cargar carreras ────────────────────────────────────────
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

  // ── Cargar facultades activas ────────────────────────────
  // Se carga al montar el componente para poblar tanto el filtro
  // por facultad como el select del formulario de crear/editar.
  const cargarFacultades = useCallback(async () => {
    if (facultades.length > 0) return // ya cargadas — evita doble fetch
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

  // Cargar facultades al entrar a la pantalla (no solo al abrir el form)
  useEffect(() => { cargarFacultades() }, [cargarFacultades])

  // ── Abrir/cerrar formulario ────────────────────────────────
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

  // ── Guardar ────────────────────────────────────────────────
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
      await cargar() // refrescar con relaciones y filtros actuales
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

  // ── Desactivar ─────────────────────────────────────────────
  async function onEliminar(carrera) {
    if (!window.confirm(`¿Desactivar la carrera "${carrera.nombre_carrera}"?`)) return
    setEliminando(carrera.id_carrera)
    setErrorElim(null)
    try {
      await eliminarCarrera(carrera.id_carrera)
      await cargar() // refrescar para respetar filtro estado activo/inactivo
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar la carrera.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
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

      {/* Formulario */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={estilos.formHeader}>
            <h2 style={estilos.formTitulo}>
              {editando ? `Editar: ${editando.nombre_carrera}` : 'Nueva carrera'}
            </h2>
          </div>

          {/* Error al cargar facultades */}
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

/* ── Estilos ─────────────────────────────────────────────────────── */
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
  acciones:     { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
}
