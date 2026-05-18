import { useState, useEffect, useCallback } from 'react'
import PageHeader    from '../../components/ui/PageHeader'
import Card          from '../../components/ui/Card'
import Button        from '../../components/ui/Button'
import Badge         from '../../components/ui/Badge'
import EmptyState    from '../../components/ui/EmptyState'
import LoadingState  from '../../components/ui/LoadingState'
import ErrorState    from '../../components/ui/ErrorState'
import {
  getNotificaciones,
  leerTodas,
  leerNotificacion,
  eliminarNotificacion,
} from '../../api/notificaciones'

/**
 * Notificaciones — bandeja de entrada del usuario autenticado.
 *
 * Sin restricción de rol: el backend filtra por token.
 *
 * Tipos de notificación y su presentación:
 *   cambio_horario    → azul   — cambio en detalles del horario
 *   bloqueo_horario   → naranja — horario bloqueado
 *   aprobacion_horario→ verde  — horario aprobado
 *   general           → neutro — información general
 */

const TIPO_META = {
  cambio_horario:     { icono: '🔄', variante: 'info',    etiqueta: 'Cambio' },
  bloqueo_horario:    { icono: '🔒', variante: 'warning', etiqueta: 'Bloqueo' },
  aprobacion_horario: { icono: '✅', variante: 'success', etiqueta: 'Aprobación' },
  general:            { icono: '📢', variante: 'neutral', etiqueta: 'General' },
}

/** Tiempo transcurrido en formato legible */
function tiempoTranscurrido(fechaStr) {
  if (!fechaStr) return '—'
  const ahora   = Date.now()
  const fecha   = new Date(fechaStr).getTime()
  const diff    = Math.max(0, ahora - fecha)
  const mins    = Math.floor(diff / 60_000)
  const horas   = Math.floor(diff / 3_600_000)
  const dias    = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'Hace un momento'
  if (mins < 60)  return `Hace ${mins} minuto${mins !== 1 ? 's' : ''}`
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`
  if (dias < 30)  return `Hace ${dias} día${dias !== 1 ? 's' : ''}`
  return new Date(fechaStr).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas,       setNoLeidas]       = useState(0)
  const [total,          setTotal]          = useState(0)
  const [cargando,       setCargando]       = useState(true)
  const [error,          setError]          = useState(null)

  // ── Acciones ───────────────────────────────────────────────
  const [marcandoTodas,  setMarcandoTodas]  = useState(false)
  const [marcandoId,     setMarcandoId]     = useState(null)   // id en proceso de leer
  const [eliminandoId,   setEliminandoId]   = useState(null)
  const [errorAccion,    setErrorAccion]    = useState(null)

  // ── Filtro local ───────────────────────────────────────────
  const [soloNoLeidas, setSoloNoLeidas] = useState(false)

  // ── Cargar notificaciones ──────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await getNotificaciones()
      setNotificaciones(data.notificaciones ?? [])
      setNoLeidas(data.no_leidas ?? 0)
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar las notificaciones.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Marcar todas como leídas ───────────────────────────────
  async function onLeerTodas() {
    if (noLeidas === 0) return
    setMarcandoTodas(true)
    setErrorAccion(null)
    try {
      await leerTodas()
      await cargar()
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'Error al marcar las notificaciones.')
    } finally {
      setMarcandoTodas(false)
    }
  }

  // ── Marcar una como leída (al hacer clic en la tarjeta) ────
  async function onLeer(id, yaLeida) {
    if (yaLeida || marcandoId === id) return
    setMarcandoId(id)
    try {
      await leerNotificacion(id)
      // Actualizar solo esa notificación localmente (optimista)
      setNotificaciones(prev =>
        prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
      )
      setNoLeidas(prev => Math.max(0, prev - 1))
    } catch { /* fallo silencioso — la próxima carga lo corrige */ }
    finally  { setMarcandoId(null) }
  }

  // ── Eliminar notificación ──────────────────────────────────
  async function onEliminar(id, e) {
    e.stopPropagation() // no activar onLeer al eliminar
    setEliminandoId(id)
    setErrorAccion(null)
    try {
      await eliminarNotificacion(id)
      setNotificaciones(prev => {
        const eliminada = prev.find(n => n.id_notificacion === id)
        if (eliminada && !eliminada.leida) setNoLeidas(p => Math.max(0, p - 1))
        return prev.filter(n => n.id_notificacion !== id)
      })
      setTotal(prev => Math.max(0, prev - 1))
    } catch (err) {
      setErrorAccion(err.response?.data?.message ?? 'No se pudo eliminar la notificación.')
    } finally {
      setEliminandoId(null)
    }
  }

  // ── Lista filtrada ─────────────────────────────────────────
  const lista = soloNoLeidas
    ? notificaciones.filter(n => !n.leida)
    : notificaciones

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <PageHeader
        titulo="Notificaciones"
        descripcion={
          noLeidas > 0
            ? `Tienes ${noLeidas} notificación${noLeidas !== 1 ? 'es' : ''} sin leer.`
            : 'Estás al día con todas tus notificaciones.'
        }
        accion={
          <div style={est.accionesHeader}>
            <label style={est.filtroCheck}>
              <input
                type="checkbox"
                checked={soloNoLeidas}
                onChange={e => setSoloNoLeidas(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Solo no leídas
            </label>
            <Button
              variante="secondary"
              size="sm"
              cargando={marcandoTodas}
              disabled={noLeidas === 0 || marcandoTodas}
              onClick={onLeerTodas}
            >
              ✓ Marcar todas como leídas
            </Button>
          </div>
        }
      />

      {/* Error de acción */}
      {errorAccion && (
        <div style={est.alertaError} role="alert">{errorAccion}</div>
      )}

      {cargando  && <LoadingState texto="Cargando notificaciones…" />}
      {!cargando && error && <ErrorState mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && lista.length === 0 && (
        <EmptyState
          icono="🔔"
          titulo={soloNoLeidas ? 'Sin notificaciones pendientes' : 'Bandeja vacía'}
          descripcion={
            soloNoLeidas
              ? 'No tienes notificaciones sin leer. ¡Estás al día!'
              : 'No hay notificaciones registradas para tu cuenta.'
          }
          accion={
            soloNoLeidas && notificaciones.length > 0
              ? <Button variante="ghost" size="sm" onClick={() => setSoloNoLeidas(false)}>
                  Ver todas ({total})
                </Button>
              : null
          }
        />
      )}

      {!cargando && !error && lista.length > 0 && (
        <div style={est.lista}>
          {lista.map(n => {
            const meta   = TIPO_META[n.tipo_notificacion] ?? TIPO_META.general
            const noLeida = !n.leida
            const enAccion = eliminandoId === n.id_notificacion
            return (
              <div
                key={n.id_notificacion}
                style={{
                  ...est.tarjeta,
                  ...(noLeida ? est.tarjetaNoLeida : {}),
                  ...(enAccion ? { opacity: .55 } : {}),
                }}
                onClick={() => onLeer(n.id_notificacion, n.leida)}
                role={noLeida ? 'button' : undefined}
                tabIndex={noLeida ? 0 : undefined}
                title={noLeida ? 'Clic para marcar como leída' : undefined}
              >
                {/* Indicador de no leída */}
                <div style={est.indicadorWrapper}>
                  {noLeida && <span style={est.punto} title="No leída" />}
                </div>

                {/* Icono y contenido */}
                <div style={est.contenido}>
                  <div style={est.cabecera}>
                    <span style={est.icono} aria-hidden>{meta.icono}</span>
                    <div style={est.tituloBadge}>
                      <span style={{
                        ...est.titulo,
                        fontWeight: noLeida ? 700 : 500,
                      }}>
                        {n.titulo}
                      </span>
                      <Badge texto={meta.etiqueta} variante={meta.variante} />
                    </div>
                    <span style={est.tiempo} title={n.fecha_envio}>
                      {tiempoTranscurrido(n.fecha_envio)}
                    </span>
                  </div>

                  <p style={{
                    ...est.mensaje,
                    color: noLeida ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  }}>
                    {n.mensaje}
                  </p>

                  {n.leida && n.fecha_lectura && (
                    <span style={est.fechaLectura}>
                      Leída {tiempoTranscurrido(n.fecha_lectura)}
                    </span>
                  )}
                </div>

                {/* Botón eliminar */}
                <button
                  style={est.btnEliminar}
                  onClick={e => onEliminar(n.id_notificacion, e)}
                  disabled={enAccion}
                  title="Eliminar notificación"
                  aria-label="Eliminar"
                >
                  {enAccion ? '…' : '×'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!cargando && !error && total > 0 && (
        <p style={est.pie}>
          {total} notificación{total !== 1 ? 'es' : ''} en total
          {noLeidas > 0 && ` · ${noLeidas} sin leer`}
        </p>
      )}
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const est = {
  accionesHeader: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  filtroCheck: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer',
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '16px',
  },

  lista: { display: 'flex', flexDirection: 'column', gap: '8px' },

  tarjeta: {
    display:       'grid',
    gridTemplateColumns: '16px 1fr auto',
    gap:           '12px',
    alignItems:    'start',
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-lg)',
    padding:       '14px 16px',
    cursor:        'default',
    transition:    'background .12s, border-color .12s',
    boxShadow:     'var(--shadow-sm)',
  },
  tarjetaNoLeida: {
    background:   'var(--color-primary-subtle)',
    borderColor:  'var(--color-primary)',
    cursor:       'pointer',
  },

  indicadorWrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingTop: '4px',
  },
  punto: {
    display:      'block',
    width:        '9px',
    height:       '9px',
    borderRadius: '50%',
    background:   'var(--color-primary)',
    flexShrink:   0,
  },

  contenido: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  cabecera: {
    display:     'flex',
    alignItems:  'center',
    gap:         '8px',
    flexWrap:    'wrap',
  },
  icono:       { fontSize: '16px', lineHeight: 1, flexShrink: 0 },
  tituloBadge: { display: 'flex', alignItems: 'center', gap: '6px', flex: 1, flexWrap: 'wrap', minWidth: 0 },
  titulo: {
    fontSize:    '13.5px',
    color:       'var(--color-text)',
    lineHeight:  1.3,
    marginRight: '2px',
  },
  tiempo: {
    fontSize:    '11.5px',
    color:       'var(--color-text-muted)',
    whiteSpace:  'nowrap',
    marginLeft:  'auto',
    flexShrink:  0,
  },
  mensaje: {
    fontSize:   '13px',
    lineHeight: 1.55,
    margin:     0,
  },
  fechaLectura: {
    fontSize:  '11.5px',
    color:     'var(--color-text-muted)',
    fontStyle: 'italic',
  },

  btnEliminar: {
    background:  'transparent',
    border:      'none',
    cursor:      'pointer',
    color:       'var(--color-text-muted)',
    fontSize:    '18px',
    lineHeight:  1,
    padding:     '0 2px',
    flexShrink:  0,
    transition:  'color .12s',
  },

  pie: {
    marginTop:  '12px',
    fontSize:   '12px',
    color:      'var(--color-text-muted)',
    textAlign:  'right',
  },
}
