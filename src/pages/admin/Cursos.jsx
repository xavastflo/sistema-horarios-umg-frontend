import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import CursoForm    from '../../components/forms/CursoForm'
import {
  getCursos,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} from '../../api/cursos'

/**
 * Cursos — catálogo global de cursos.
 * Sin relación directa con carrera ni período.
 *
 * Endpoints:
 *   GET    /cursos
 *   POST   /cursos
 *   PUT    /cursos/{id}
 *   DELETE /cursos/{id}  (rechaza si tiene secciones activas)
 */
export default function Cursos() {
  // ── Datos ──────────────────────────────────────────────────
  const [cursos,     setCursos]     = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)

  // ── Filtros ────────────────────────────────────────────────
  const [buscar,       setBuscar]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // ── Formulario ─────────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  // ── Eliminación ────────────────────────────────────────────
  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  // ── Cargar cursos ──────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroEstado)  params.estado  = filtroEstado
      if (buscar.trim()) params.buscar  = buscar.trim()
      setCursos(await getCursos(params))
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'No tienes permisos para ver los cursos.'
          : (err.response?.data?.message ?? 'Error al cargar cursos.')
      )
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, buscar])

  useEffect(() => { cargar() }, [cargar])

  // ── Formulario helpers ─────────────────────────────────────
  function abrirCrear() {
    setEditando(null); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function abrirEditar(c) {
    setEditando(c); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function cerrarForm() {
    setMostrarForm(false); setEditando(null); setErrores422({}); setErrorForm(null)
  }

  // ── Guardar ────────────────────────────────────────────────
  async function onGuardar(datos) {
    setErrores422({}); setErrorForm(null)
    try {
      if (editando) {
        await actualizarCurso(editando.id_curso, datos)
      } else {
        await crearCurso(datos)
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
        setErrorForm(err.response?.data?.message ?? 'Error al guardar el curso.')
      }
    }
  }

  // ── Desactivar ─────────────────────────────────────────────
  async function onEliminar(curso) {
    if (!window.confirm(
      `¿Desactivar el curso "${curso.nombre_curso}"?\n` +
      `No es posible si tiene secciones activas.`
    )) return
    setEliminando(curso.id_curso)
    setErrorElim(null)
    try {
      await eliminarCurso(curso.id_curso)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar el curso.')
    } finally {
      setEliminando(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Cursos"
        descripcion="Catálogo global de cursos académicos de la institución."
        accion={
          <Button variante="primary" onClick={abrirCrear}>
            + Nuevo curso
          </Button>
        }
      />

      {/* Formulario */}
      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={est.formHeader}>
            <h2 style={est.formTitulo}>
              {editando ? `Editar: ${editando.nombre_curso}` : 'Nuevo curso'}
            </h2>
          </div>
          {errorForm && <div style={est.alertaError} role="alert">{errorForm}</div>}
          <CursoForm
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
          type="text" placeholder="Buscar por nombre o código…"
          value={buscar} onChange={e => setBuscar(e.target.value)}
          style={est.inputBuscar}
        />
        <select
          value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={est.select}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
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
        {cargando  && <LoadingState texto="Cargando cursos…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && cursos.length === 0 && (
          <EmptyState
            icono="📚"
            titulo="Sin cursos registrados"
            descripcion="Crea el primer curso usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear curso</Button>}
          />
        )}
        {!cargando && !error && cursos.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Nombre del curso</th>
                  <th style={est.th}>Código</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map(c => (
                  <tr key={c.id_curso} style={est.tr}>
                    <td style={est.td}>
                      <div style={est.nombre}>{c.nombre_curso}</div>
                    </td>
                    <td style={est.td}>
                      <code style={est.codigo}>{c.codigo_curso}</code>
                    </td>
                    <td style={est.td}>
                      <Badge
                        texto={c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        variante={c.estado === 'activo' ? 'success' : 'neutral'}
                        dot
                      />
                    </td>
                    <td style={{ ...est.td, textAlign: 'right' }}>
                      <div style={est.acciones}>
                        <Button
                          variante="ghost" size="sm"
                          onClick={() => abrirEditar(c)}
                          disabled={eliminando === c.id_curso}
                        >
                          Editar
                        </Button>
                        {c.estado === 'activo' && (
                          <Button
                            variante="danger" size="sm"
                            cargando={eliminando === c.id_curso}
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

      {!cargando && !error && cursos.length > 0 && (
        <p style={est.nota}>
          Total: {cursos.length} curso{cursos.length !== 1 ? 's' : ''}.
          No se pueden desactivar cursos con secciones activas.
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
    flex: '1 1 220px', padding: '8px 12px', minWidth: '160px',
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
  nombre:  { fontWeight: 600 },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  acciones: { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
  nota:     { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
