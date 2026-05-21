import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import Badge        from '../../components/ui/Badge'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import CentroForm   from '../../components/forms/CentroForm'
import { getCentros, crearCentro, actualizarCentro, eliminarCentro } from '../../api/centros'

export default function CentrosEducativos() {
  const [centros,    setCentros]    = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)
  const [buscar,     setBuscar]     = useState('')
  const [filtroEst,  setFiltroEst]  = useState('')

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [errores422,  setErrores422]  = useState({})
  const [errorForm,   setErrorForm]   = useState(null)

  const [eliminando,  setEliminando]  = useState(null)
  const [errorElim,   setErrorElim]   = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const params = {}
      if (filtroEst) params.estado = filtroEst
      // buscar: filtrado local — el backend no soporta ese param
      setCentros(await getCentros(params))
    } catch (err) {
      setError(err.response?.status === 403
        ? 'No tienes permisos para ver las sedes.'
        : (err.response?.data?.message ?? 'Error al cargar sedes.'))
    } finally { setCargando(false) }
  }, [filtroEst])

  useEffect(() => { cargar() }, [cargar])

  // Filtrado local por búsqueda — sin llamada extra al backend
  const centrosVisibles = buscar.trim()
    ? centros.filter(c => {
        const q = buscar.trim().toLowerCase()
        return c.nombre?.toLowerCase().includes(q)
            || c.codigo_sede?.toLowerCase().includes(q)
      })
    : centros

  function abrirCrear() {
    setEditando(null); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function abrirEditar(c) {
    setEditando(c); setErrores422({}); setErrorForm(null); setMostrarForm(true)
  }
  function cerrarForm() {
    setMostrarForm(false); setEditando(null); setErrores422({}); setErrorForm(null)
  }

  async function onGuardar(datos) {
    setErrores422({}); setErrorForm(null)
    try {
      if (editando) {
        await actualizarCentro(editando.id_centro_educativo, datos)
      } else {
        await crearCentro(datos)
      }
      cerrarForm()
      await cargar()
    } catch (err) {
      const st = err.response?.status
      if (st === 422) {
        setErrores422(err.response?.data?.errors ?? {})
        setErrorForm(err.response?.data?.message ?? null)
      } else if (st === 403) {
        setErrorForm('No tienes permisos para esta acción.')
      } else {
        setErrorForm(err.response?.data?.message ?? 'Error al guardar la sede.')
      }
    }
  }

  async function onEliminar(centro) {
    if (!window.confirm(`¿Desactivar la sede "${centro.nombre}"?`)) return
    setEliminando(centro.id_centro_educativo); setErrorElim(null)
    try {
      await eliminarCentro(centro.id_centro_educativo)
      await cargar()
    } catch (err) {
      setErrorElim(err.response?.data?.message ?? 'No se pudo desactivar la sede.')
    } finally { setEliminando(null) }
  }

  return (
    <div className="fade-in">
      <PageHeader
        titulo="Centros Educativos"
        descripcion="Gestiona las sedes de la institución. Las facultades se asignan a una sede."
        accion={<Button variante="primary" onClick={abrirCrear}>+ Nueva sede</Button>}
      />

      {mostrarForm && (
        <Card style={{ marginBottom: '20px' }}>
          <h2 style={est.formTitulo}>
            {editando ? `Editar: ${editando.nombre}` : 'Nueva sede'}
          </h2>
          {errorForm && <div style={est.alertaError} role="alert">{errorForm}</div>}
          <CentroForm
            inicial={editando ?? {}}
            onGuardar={onGuardar}
            onCancelar={cerrarForm}
            errores422={errores422}
          />
        </Card>
      )}

      <div style={est.filtros}>
        <input type="text" placeholder="Buscar por nombre o código…"
          value={buscar} onChange={e => setBuscar(e.target.value)}
          style={est.inputBuscar} />
        <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)} style={est.select}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {errorElim && (
        <div style={{ ...est.alertaError, marginBottom: '12px' }} role="alert">{errorElim}</div>
      )}

      <Card padding="0">
        {cargando  && <LoadingState texto="Cargando sedes…" />}
        {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}
        {!cargando && !error && centrosVisibles.length === 0 && (
          <EmptyState icono="🏛️" titulo="Sin sedes registradas"
            descripcion="Crea la primera sede usando el botón de arriba."
            accion={<Button variante="secondary" onClick={abrirCrear}>+ Crear sede</Button>} />
        )}
        {!cargando && !error && centrosVisibles.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={est.tabla}>
              <thead>
                <tr>
                  <th style={est.th}>Sede</th>
                  <th style={est.th}>Código</th>
                  <th style={est.th}>Dirección</th>
                  <th style={est.th}>Facultades</th>
                  <th style={est.th}>Estado</th>
                  <th style={{ ...est.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {centrosVisibles.map(c => {
                  const enAccion = eliminando === c.id_centro_educativo
                  return (
                    <tr key={c.id_centro_educativo} style={est.tr}>
                      <td style={est.td}>
                        <div style={est.nombre}>{c.nombre}</div>
                      </td>
                      <td style={est.td}>
                        {c.codigo_sede
                          ? <code style={est.codigo}>{c.codigo_sede}</code>
                          : <span style={est.sinDato}>—</span>}
                      </td>
                      <td style={est.td}>
                        <span style={est.dir}>{c.direccion ?? <span style={est.sinDato}>—</span>}</span>
                      </td>
                      <td style={est.td}>
                        <span style={est.conteo}>
                          {c.facultades_activas_count ?? 0}
                          <span style={est.totalSub}> / {c.facultades_count ?? 0}</span>
                        </span>
                      </td>
                      <td style={est.td}>
                        <Badge
                          texto={c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          variante={c.estado === 'activo' ? 'success' : 'neutral'}
                          dot />
                      </td>
                      <td style={{ ...est.td, textAlign: 'right' }}>
                        <div style={est.acciones}>
                          <Button variante="ghost" size="sm"
                            onClick={() => abrirEditar(c)} disabled={enAccion}>
                            Editar
                          </Button>
                          {c.estado === 'activo' && (
                            <Button variante="danger" size="sm"
                              cargando={enAccion} disabled={enAccion}
                              onClick={() => onEliminar(c)}>
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

      {!cargando && !error && centros.length > 0 && (
        <p style={est.nota}>Facultades: activas / total. No se pueden desactivar sedes con facultades activas.</p>
      )}
    </div>
  )
}

const est = {
  formTitulo:  { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '14px',
  },
  filtros:     { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
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
  tr:       { borderBottom: '1px solid var(--color-border)' },
  td:       { padding: '12px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  nombre:   { fontWeight: 600 },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  dir:      { fontSize: '12.5px', color: 'var(--color-text-secondary)' },
  sinDato:  { color: 'var(--color-text-muted)' },
  conteo:   { fontWeight: 600 },
  totalSub: { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '13px' },
  acciones: { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
  nota:     { marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' },
}
