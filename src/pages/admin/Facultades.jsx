import { useState, useEffect, useCallback } from 'react'
import PageHeader  from '../../components/ui/PageHeader'
import Card        from '../../components/ui/Card'
import Button      from '../../components/ui/Button'
import Badge       from '../../components/ui/Badge'
import EmptyState  from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState  from '../../components/ui/ErrorState'
import FacultadForm from '../../components/forms/FacultadForm'
import {
  getFacultades,
  crearFacultad,
  actualizarFacultad,
  eliminarFacultad,
} from '../../api/facultades'

/**
 * Facultades — módulo CRUD para administrador.
 * Consume: GET, POST, PUT, DELETE /api/facultades
 */
export default function Facultades() {
  // ── Estado de datos ────────────────────────────────────────
  const [facultades, setFacultades] = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)

  // ── Estado de UI ───────────────────────────────────────────
  const [buscar,     setBuscar]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('') // '' | 'activo' | 'inactivo'

  // ── Estado de formulario ───────────────────────────────────
  const [mostrarForm,  setMostrarForm]  = useState(false)
  const [editando,     setEditando]     = useState(null)  // objeto facultad o null
  const [errores422,   setErrores422]   = useState({})
  const [errorForm,    setErrorForm]    = useState(null)

  // ── Estado de eliminación ──────────────────────────────────
  const [eliminando,   setEliminando]   = useState(null)  // id en proceso
  const [errorElim,    setErrorElim]    = useState(null)

  // ── Cargar facultades ──────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado) params.estado = filtroEstado
      if (buscar.trim()) params.buscar = buscar.trim()
      const data = await getFacultades(params)
      setFacultades(data)
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        setError('No tienes permisos para ver las facultades.')
      } else {
        setError(err.response?.data?.message ?? 'Error al cargar facultades.')
      }
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, buscar])

  useEffect(() => { cargar() }, [cargar])

  // ── Abrir/cerrar formulario ────────────────────────────────
  function abrirCrear() {
    setEditando(null)
    setErrores422({})
    setErrorForm(null)
    setMostrarForm(true)
  }

  function abrirEditar(facultad) {
    setEditando(facultad)
    setErrores422({})
    setErrorForm(null)
    setMostrarForm(true)
  }

  function cerrarForm() {
    setMostrarForm(false)
    setEditando(null)
    setErrores422({})
    setErrorForm(null)
  }

  // ── Guardar (crear o editar) ───────────────────────────────
  async function onGuardar(datos) {
    setErrores422({})
    setErrorForm(null)
    try {
      if (editando) {
        await actualizarFacultad(editando.id_facultad, datos)
      } else {
        await crearFacultad(datos)
      }
      cerrarForm()
      // Refrescar desde GET /facultades para obtener carreras_count
      // y respetar los filtros activos (estado, buscar).
      await cargar()
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErrores422(err.response?.data?.errors ?? {})
        // Error general del 422 (no por campo)
        const msg = err.response?.data?.message
        if (msg && !err.response?.data?.errors) setErrorForm(msg)
      } else if (status === 403) {
        setErrorForm('No tienes permisos para realizar esta acción.')
      } else {
        setErrorForm(err.response?.data?.message ?? 'Error al guardar la facultad.')
      }
    }
  }

  // ── Eliminar ───────────────────────────────────────────────
  async function onEliminar(facultad) {
    if (! window.confirm(
      `¿Desactivar la facultad "${facultad.nombre_facultad}"?\n` +
      `Esta acción solo es posible si no tiene carreras activas.`
    )) return

    setEliminando(facultad.id_facultad)
    setErrorElim(null)
    try {
      await eliminarFacultad(facultad.id_facultad)
      // Refrescar lista completa para respetar filtro estado activo/inactivo
      await cargar()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'No se pudo desactivar la facultad.'
      setErrorElim(msg)
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Facultades"
        descripcion="Gestiona las facultades de la institución."
        accion={
          <Button variante="primary" onClick={abrirCrear}>
            + Nueva facultad
          </Button>
        }
      />

      {/* Formulario de crear/editar */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={estilos.formHeader}>
            <h2 style={estilos.formTitulo}>
              {editando ? `Editar: ${editando.nombre_facultad}` : 'Nueva facultad'}
            </h2>
          </div>
          {errorForm && (
            <div style={estilos.alertaError} role="alert">{errorForm}</div>
          )}
          <FacultadForm
            inicial={editando ?? {}}
            onGuardar={onGuardar}
            onCancelar={cerrarForm}
            errores422={errores422}
          />
        </Card>
      )}

      {/* Barra de filtros */}
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
      </div>

      {/* Error de eliminación */}
      {errorElim && (
        <div style={{ ...estilos.alertaError, marginBottom: '12px' }} role="alert">
          {errorElim}
        </div>
      )}

      {/* Tabla / estados */}
      <Card padding="0">
        {cargando && <LoadingState texto="Cargando facultades…" />}

        {!cargando && error && (
          <ErrorState mensaje={error} onReintentar={cargar} />
        )}

        {!cargando && !error && facultades.length === 0 && (
          <EmptyState
            icono="🏛️"
            titulo="Sin facultades registradas"
            descripcion="Crea la primera facultad usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear facultad</Button>}
          />
        )}

        {!cargando && !error && facultades.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={estilos.tabla}>
              <thead>
                <tr>
                  <th style={estilos.th}>Facultad</th>
                  <th style={estilos.th}>Código</th>
                  <th style={estilos.th}>Carreras</th>
                  <th style={estilos.th}>Estado</th>
                  <th style={{ ...estilos.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facultades.map(f => (
                  <tr key={f.id_facultad} style={estilos.tr}>
                    <td style={estilos.td}>
                      <div style={estilos.nombreFacultad}>{f.nombre_facultad}</div>
                      {f.centro_educativo && (
                        <div style={estilos.descripcionFacultad}>
                          🏛 {f.centro_educativo.nombre}
                        </div>
                      )}
                      {f.descripcion && (
                        <div style={estilos.descripcionFacultad}>{f.descripcion}</div>
                      )}
                    </td>
                    <td style={estilos.td}>
                      {f.codigo_facultad
                        ? <code style={estilos.codigo}>{f.codigo_facultad}</code>
                        : <span style={estilos.sinDato}>—</span>
                      }
                    </td>
                    <td style={estilos.td}>
                      <span style={estilos.conteoCarreras}>
                        {f.carreras_activas_count ?? 0}
                        <span style={estilos.totalCarreras}> / {f.carreras_count ?? 0}</span>
                      </span>
                    </td>
                    <td style={estilos.td}>
                      <Badge
                        texto={f.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        variante={f.estado === 'activo' ? 'success' : 'neutral'}
                        dot
                      />
                    </td>
                    <td style={{ ...estilos.td, textAlign: 'right' }}>
                      <div style={estilos.acciones}>
                        <Button
                          variante="ghost"
                          size="sm"
                          onClick={() => abrirEditar(f)}
                          disabled={eliminando === f.id_facultad}
                        >
                          Editar
                        </Button>
                        {f.estado === 'activo' && (
                          <Button
                            variante="danger"
                            size="sm"
                            cargando={eliminando === f.id_facultad}
                            onClick={() => onEliminar(f)}
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

      {/* Nota informativa */}
      {!cargando && !error && facultades.length > 0 && (
        <p style={estilos.nota}>
          Carreras: activas / total. Solo se pueden desactivar facultades sin carreras activas.
        </p>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const estilos = {
  formHeader: { marginBottom: '16px' },
  formTitulo: {
    fontSize:   '15px',
    fontWeight: 700,
    color:      'var(--color-text)',
    margin:     0,
  },
  alertaError: {
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    padding:      '10px 14px',
    fontSize:     '13.5px',
    color:        'var(--color-error)',
    fontWeight:   500,
    marginBottom: '14px',
  },

  filtros: {
    display:      'flex',
    gap:          '10px',
    marginBottom: '16px',
    flexWrap:     'wrap',
  },
  inputBuscar: {
    flex:         '1 1 220px',
    padding:      '8px 12px',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '13.5px',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    fontFamily:   'var(--font-sans)',
    outline:      'none',
    minWidth:     '180px',
  },
  select: {
    padding:      '8px 12px',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '13.5px',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    fontFamily:   'var(--font-sans)',
    cursor:       'pointer',
    outline:      'none',
  },

  tabla: {
    width:          '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding:        '11px 16px',
    background:     'var(--color-bg)',
    fontSize:       '11.5px',
    fontWeight:     700,
    color:          'var(--color-text-secondary)',
    textTransform:  'uppercase',
    letterSpacing:  '.06em',
    textAlign:      'left',
    borderBottom:   '1px solid var(--color-border)',
    whiteSpace:     'nowrap',
  },
  tr: {
    borderBottom:   '1px solid var(--color-border)',
  },
  td: {
    padding:     '12px 16px',
    fontSize:    '13.5px',
    color:       'var(--color-text)',
    verticalAlign: 'middle',
  },

  nombreFacultad: { fontWeight: 600, marginBottom: '2px' },
  descripcionFacultad: {
    fontSize: '12px',
    color:    'var(--color-text-muted)',
    lineHeight: 1.4,
  },
  codigo: {
    background:   'var(--color-primary-subtle)',
    color:        'var(--color-primary)',
    padding:      '2px 7px',
    borderRadius: 'var(--radius-sm)',
    fontSize:     '12px',
    fontFamily:   'var(--font-mono)',
    fontWeight:   600,
  },
  sinDato: { color: 'var(--color-text-muted)' },

  conteoCarreras: { fontWeight: 600, fontSize: '14px' },
  totalCarreras:  { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '13px' },

  acciones: { display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' },

  nota: {
    marginTop: '10px',
    fontSize:  '12px',
    color:     'var(--color-text-muted)',
    textAlign: 'right',
  },
}
