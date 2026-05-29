import { useEffect, useMemo, useState } from 'react'
import PageHeader   from '../../components/ui/PageHeader'
import Card         from '../../components/ui/Card'
import EmptyState   from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState   from '../../components/ui/ErrorState'
import Badge        from '../../components/ui/Badge'
import { getMiHorarioDocente } from '../../api/docentes'

const ESTADO_BADGE = {
  borrador:   { texto: 'Borrador',   variante: 'neutral' },
  generado:   { texto: 'Generado',   variante: 'info' },
  aprobado:   { texto: 'Aprobado',   variante: 'success' },
  bloqueado:  { texto: 'Bloqueado',  variante: 'warning' },
  publicado:  { texto: 'Publicado',  variante: 'primary' },
}

export default function MiHorario() {
  const [clases, setClases] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  async function cargar() {
    setCargando(true)
    setError(null)

    try {
      const data = await getMiHorarioDocente()
      setClases(data.clases ?? [])
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'No se encontró tu perfil docente.'
          : (err.response?.data?.message ?? 'Error al cargar tu horario.')
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const clasesPorPeriodo = useMemo(() => {
    return clases.reduce((acc, clase) => {
      const periodo = `${clase.nombre_periodo ?? 'Período'} ${clase.anio ?? ''}`.trim()
      if (!acc[periodo]) acc[periodo] = []
      acc[periodo].push(clase)
      return acc
    }, {})
  }, [clases])

  function agruparPorDia(lista) {
    return lista.reduce((acc, clase) => {
      const dia = clase.nombre_dia ?? 'Sin día'
      if (!acc[dia]) acc[dia] = []
      acc[dia].push(clase)
      return acc
    }, {})
  }

  return (
    <div className="fade-in">
      <PageHeader
        titulo="Mi horario"
        descripcion="Consulta tus clases asignadas por período, día y bloque horario."
      />

      <Card padding="0">
        {cargando && <LoadingState texto="Cargando tu horario…" />}

        {!cargando && error && (
          <ErrorState mensaje={error} onReintentar={cargar} />
        )}

        {!cargando && !error && clases.length === 0 && (
          <EmptyState
            icono="🕐"
            titulo="Sin clases asignadas"
            descripcion="Aún no tienes clases activas en un horario generado o publicado."
          />
        )}

        {!cargando && !error && clases.length > 0 && (
          <div style={est.contenedor}>
            {Object.entries(clasesPorPeriodo).map(([periodo, listaPeriodo]) => (
              <div key={periodo} style={est.periodoBloque}>
                <div style={est.periodoHeader}>
                  <div>
                    <h2 style={est.periodoTitulo}>{periodo}</h2>
                    <p style={est.periodoSubtitulo}>
                      {listaPeriodo[0]?.nombre_carrera ?? 'Carrera'} · {listaPeriodo.length} clase{listaPeriodo.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <Badge
                    texto={ESTADO_BADGE[listaPeriodo[0]?.estado_horario]?.texto ?? listaPeriodo[0]?.estado_horario ?? 'Estado'}
                    variante={ESTADO_BADGE[listaPeriodo[0]?.estado_horario]?.variante ?? 'neutral'}
                    dot
                  />
                </div>

                {Object.entries(agruparPorDia(listaPeriodo)).map(([dia, clasesDia]) => (
                  <div key={dia} style={est.diaBloque}>
                    <div style={est.diaLabel}>{dia}</div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={est.tabla}>
                        <thead>
                          <tr>
                            <th style={est.th}>Horario</th>
                            <th style={est.th}>Curso</th>
                            <th style={est.th}>Sección</th>
                            <th style={est.th}>Jornada</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clasesDia.map(clase => (
                            <tr key={clase.id_detalle_horario} style={est.tr}>
                              <td style={est.td}>
                                <code style={est.horaChip}>
                                  {clase.hora_inicio?.slice(0, 5)}–{clase.hora_fin?.slice(0, 5)}
                                </code>
                              </td>
                              <td style={est.td}>
                                <div style={est.cursoNombre}>{clase.nombre_curso}</div>
                                <code style={est.cursoCodigo}>{clase.codigo_curso}</code>
                              </td>
                              <td style={est.td}>
                                <span style={est.seccionBadge}>{clase.numero_seccion}</span>
                              </td>
                              <td style={est.td}>
                                {formatearJornada(clase.nombre_jornada)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function formatearJornada(valor) {
  if (!valor) return '—'
  return String(valor)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase())
}

const est = {
  contenedor: {
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '26px',
  },
  periodoBloque: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  periodoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '12px',
  },
  periodoTitulo: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: '0 0 4px',
  },
  periodoSubtitulo: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    margin: 0,
  },
  diaBloque: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--color-surface)',
  },
  diaLabel: {
    padding: '10px 14px',
    background: 'var(--color-bg)',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-text-secondary)',
    textTransform: 'capitalize',
    borderBottom: '1px solid var(--color-border)',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 14px',
    background: 'var(--color-bg)',
    fontSize: '11.5px',
    fontWeight: 700,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13.5px',
    color: 'var(--color-text)',
    verticalAlign: 'middle',
  },
  horaChip: {
    background: 'var(--color-primary-subtle)',
    color: 'var(--color-primary)',
    padding: '3px 7px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  cursoNombre: {
    fontWeight: 600,
    marginBottom: '3px',
  },
  cursoCodigo: {
    background: 'var(--color-primary-subtle)',
    color: 'var(--color-primary)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
  },
  seccionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    background: 'var(--color-primary-subtle)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 700,
  },
}