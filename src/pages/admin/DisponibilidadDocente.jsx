import { useState, useEffect, useCallback } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import Button       from '../../components/ui/Button'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import { useAuth }  from '../../context/AuthContext'
import { getDocentes, getPerfilDocente }  from '../../api/docentes'
import {
  getDisponibilidad,
  desmarcarBloque,
} from '../../api/disponibilidadDocente'

/**
 * DisponibilidadDocente — Paso 12 (corregido)
 *
 * REGLA: registro activo = docente NO disponible en ese bloque.
 *
 * Permisos confirmados (routes/api.php):
 *   GET  /docentes/{id}/disponibilidad → línea 125: rol:administrador,coordinador
 *                                      → línea 217: rol:docente
 *   Está registrada en DOS grupos. Admin/coord consultan cualquier docente.
 *   El docente consulta su propia disponibilidad.
 *
 *   DELETE /docentes/{id}/disponibilidad/{disp} → línea 220: solo rol:docente
 *   GET  /perfil/docente → línea 207: solo rol:docente
 *
 *   GET  /carreras → líneas 111-112: rol:administrador,coordinador ÚNICAMENTE
 *   GET  /carrera-jornadas/{id}/bloques → línea 162: rol:administrador,coordinador
 *   → El docente recibiría 403 en esos endpoints. No se consumen aquí.
 *
 * Comportamiento por rol:
 *   admin/coord: seleccionan docente y ven sus restricciones (solo consulta)
 *   docente: ve SUS restricciones y puede eliminarlas.
 *   El docente no puede agregar restricciones desde el frontend —
 *   requeriría acceso a carreras/bloques que el backend no expone al rol docente.
 */
export default function DisponibilidadDocente() {
  const { perfilActivo } = useAuth()
  const esDocente = perfilActivo === 'docente'

  const [idDocente,   setIdDocente]   = useState(null)
  const [infoDocente, setInfoDocente] = useState(null)
  const [docentes,    setDocentes]    = useState([])
  const [cargandoCat, setCargandoCat] = useState(false)
  const [errorCat,    setErrorCat]    = useState(null)
  const [restricciones, setRestricciones] = useState([])
  const [cargandoRestr, setCargandoRestr] = useState(false)
  const [errorRestr,    setErrorRestr]    = useState(null)
  const [desmarcando, setDesmarcando] = useState(null)
  const [errorAccion, setErrorAccion] = useState(null)
  const [okAccion,    setOkAccion]    = useState(null)

  useEffect(() => {
    async function init() {
      if (esDocente) {
        try {
          const data = await getPerfilDocente()
          setIdDocente(data.id_docente)
          setInfoDocente(data)
        } catch (err) {
          setErrorCat(err.response?.data?.message ?? 'No se pudo cargar tu perfil docente.')
        }
      } else {
        setCargandoCat(true)
        try {
          setDocentes(await getDocentes({ estado: 'activo' }))
        } catch (err) {
          setErrorCat(err.response?.data?.message ?? 'Error al cargar docentes.')
        } finally {
          setCargandoCat(false)
        }
      }
    }
    init()
  }, [esDocente])

  const cargarDisponibilidad = useCallback(async () => {
    if (!idDocente) { setRestricciones([]); return }
    setCargandoRestr(true)
    setErrorRestr(null)
    try {
      const data = await getDisponibilidad(idDocente)
      setRestricciones(data.bloques_no_disponibles ?? [])
    } catch (err) {
      setErrorRestr(err.response?.data?.message ?? 'Error al cargar restricciones.')
    } finally {
      setCargandoRestr(false)
    }
  }, [idDocente])

  useEffect(() => { cargarDisponibilidad() }, [cargarDisponibilidad])

  async function onDesmarcar(idDisponibilidad) {
    setDesmarcando(idDisponibilidad)
    setErrorAccion(null)
    setOkAccion(null)
    try {
      await desmarcarBloque(idDocente, idDisponibilidad)
      setOkAccion('Restricción eliminada. El docente ahora está disponible en ese bloque.')
      await cargarDisponibilidad()
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'No se pudo eliminar la restricción.')
    } finally {
      setDesmarcando(null)
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        titulo="Disponibilidad docente"
        descripcion={esDocente
          ? 'Consulta y elimina los bloques en los que estás marcado como no disponible.'
          : 'Consulta las restricciones de disponibilidad de los docentes.'}
      />

      <div style={est.nota}>
        <span style={est.notaIcono}>⚠️</span>
        <span>
          <strong>Registro activo = docente NO disponible.</strong>
          {' '}Un bloque sin registro significa disponibilidad completa.
        </span>
      </div>

      {esDocente && (
        <div style={est.aviso}>
          <span>ℹ️</span>
          <span>
            Para <strong>agregar</strong> una restricción de no disponibilidad, contacta
            al coordinador o administrador del sistema. Desde aquí puedes ver y
            <strong> eliminar</strong> las restricciones ya registradas.
          </span>
        </div>
      )}

      {errorCat    && <ErrorState mensaje={errorCat} />}
      {cargandoCat && <LoadingState texto="Cargando docentes…" />}

      {!cargandoCat && !errorCat && (
        <>
          {!esDocente && (
            <Card style={{ marginBottom: '20px' }}>
              <div style={est.campo}>
                <label style={est.label}>Docente</label>
                <select
                  value={idDocente ?? ''}
                  onChange={e => {
                    const val = Number(e.target.value) || null
                    setIdDocente(val)
                    setInfoDocente(docentes.find(d => d.id_docente === val) ?? null)
                    setOkAccion(null); setErrorAccion(null)
                  }}
                  style={est.select}
                >
                  <option value="">— Selecciona un docente —</option>
                  {docentes.map(d => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.usuario?.nombre_completo ?? d.codigo_docente ?? `#${d.id_docente}`}
                      {d.codigo_docente ? ` [${d.codigo_docente}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {infoDocente && (
                <p style={est.docenteInfo}>
                  Prioridad: <strong>{infoDocente.etiqueta_prioridad ?? infoDocente.prioridad}</strong>
                </p>
              )}
            </Card>
          )}

          {esDocente && infoDocente && (
            <Card style={{ marginBottom: '20px' }}>
              <p style={est.label}>Tu perfil docente</p>
              <p style={est.docenteNombre}>
                {infoDocente.usuario?.nombre_completo ?? `Docente #${infoDocente.id_docente}`}
              </p>
              {infoDocente.codigo_docente && (
                <code style={est.codigo}>{infoDocente.codigo_docente}</code>
              )}
            </Card>
          )}

          {okAccion    && <div style={est.alertaOk}    role="status">{okAccion}</div>}
          {errorAccion && <div style={est.alertaError} role="alert">{errorAccion}</div>}

          <Card padding="0">
            <div style={est.panelHeader}>
              <h2 style={est.panelTitulo}>Restricciones activas</h2>
            </div>

            {cargandoRestr && <LoadingState texto="Cargando restricciones…" />}
            {!cargandoRestr && errorRestr && (
              <ErrorState mensaje={errorRestr} onReintentar={cargarDisponibilidad} />
            )}
            {!cargandoRestr && !errorRestr && !idDocente && (
              <EmptyState icono="👨‍🏫" titulo="Selecciona un docente"
                descripcion="Las restricciones aparecerán aquí." />
            )}
            {!cargandoRestr && !errorRestr && idDocente && restricciones.length === 0 && (
              <EmptyState icono="✅" titulo="Sin restricciones registradas"
                descripcion="El docente está disponible en todos los bloques." />
            )}
            {!cargandoRestr && !errorRestr && restricciones.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={est.tabla}>
                  <thead>
                    <tr>
                      <th style={est.th}>Día</th>
                      <th style={est.th}>Horario</th>
                      <th style={est.th}>Jornada</th>
                      <th style={est.th}>Observación</th>
                      {esDocente && <th style={{ ...est.th, textAlign: 'right' }}>Acción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {restricciones.map(r => (
                      <tr key={r.id_disponibilidad_docente} style={est.tr}>
                        <td style={est.td}>
                          <span style={est.dia}>
                            {r.bloque_horario?.dia?.nombre_dia ?? '—'}
                          </span>
                        </td>
                        <td style={est.td}>
                          <code style={est.horario}>
                            {r.bloque_horario?.hora_inicio?.slice(0,5)}–{r.bloque_horario?.hora_fin?.slice(0,5)}
                          </code>
                        </td>
                        <td style={est.td}>
                          <span style={est.jornada}>
                            {r.bloque_horario?.carrera_jornada?.jornada?.nombre_jornada ?? '—'}
                          </span>
                        </td>
                        <td style={est.td}>
                          {r.observacion
                            ? <span style={est.obs}>{r.observacion}</span>
                            : <span style={est.sinDato}>—</span>}
                        </td>
                        {esDocente && (
                          <td style={{ ...est.td, textAlign: 'right' }}>
                            <Button
                              variante="ghost" size="sm"
                              cargando={desmarcando === r.id_disponibilidad_docente}
                              disabled={desmarcando === r.id_disponibilidad_docente}
                              onClick={() => onDesmarcar(r.id_disponibilidad_docente)}
                            >
                              Eliminar restricción
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

const est = {
  nota: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13px', color: '#92400e', marginBottom: '14px', lineHeight: 1.5,
  },
  notaIcono: { fontSize: '16px', flexShrink: 0 },
  aviso: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13px', color: 'var(--color-text-secondary)',
    marginBottom: '20px', lineHeight: 1.55,
  },
  campo:  { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  select: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
  },
  docenteInfo:   { fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '8px' },
  docenteNombre: { fontSize: '14px', fontWeight: 600, marginBottom: '4px' },
  codigo: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '1px 7px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
  },
  panelTitulo: { fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: 0 },
  alertaOk: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: '#166534', fontWeight: 500, marginBottom: '14px',
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '14px',
  },
  tabla:   { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 16px', background: 'var(--color-bg)',
    fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '.06em',
    textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
  },
  tr:      { borderBottom: '1px solid var(--color-border)' },
  td:      { padding: '11px 16px', fontSize: '13.5px', color: 'var(--color-text)', verticalAlign: 'middle' },
  dia:     { textTransform: 'capitalize', fontWeight: 500 },
  horario: {
    background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
    padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
  },
  jornada: { fontSize: '13px', textTransform: 'capitalize' },
  obs:     { fontSize: '12.5px', color: 'var(--color-text-secondary)', fontStyle: 'italic' },
  sinDato: { color: 'var(--color-text-muted)' },
}
