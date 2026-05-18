/**
 * Badge
 *
 * Etiqueta de estado para indicar valores discretos (activo, inactivo,
 * estado de horario, rol, etc.).
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   texto     {string}  Texto de la etiqueta
 *   variante  {'success'|'warning'|'error'|'info'|'neutral'|'primary'}
 *             (default: 'neutral')
 *   dot       {boolean} Muestra un punto de color antes del texto
 */
export default function Badge({ texto, variante = 'neutral', dot = false }) {
  const v = estilos.variantes[variante] ?? estilos.variantes.neutral
  return (
    <span style={{ ...estilos.base, background: v.bg, color: v.color }}>
      {dot && <span style={{ ...estilos.dot, background: v.color }} />}
      {texto}
    </span>
  )
}

/** Mapeador de conveniencia para estados del horario del backend */
export function badgeEstadoHorario(estado) {
  const mapa = {
    borrador:  { texto: 'Borrador',  variante: 'neutral'  },
    generado:  { texto: 'Generado',  variante: 'info'     },
    aprobado:  { texto: 'Aprobado',  variante: 'success'  },
    bloqueado: { texto: 'Bloqueado', variante: 'warning'  },
    publicado: { texto: 'Publicado', variante: 'primary'  },
  }
  const meta = mapa[estado] ?? { texto: estado, variante: 'neutral' }
  return <Badge texto={meta.texto} variante={meta.variante} dot />
}

/** Mapeador para estado activo/inactivo */
export function badgeEstado(estado) {
  return (
    <Badge
      texto={estado === 'activo' ? 'Activo' : 'Inactivo'}
      variante={estado === 'activo' ? 'success' : 'neutral'}
      dot
    />
  )
}

const estilos = {
  base: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '5px',
    padding:       '3px 10px',
    borderRadius:  '99px',
    fontSize:      '11.5px',
    fontWeight:    600,
    letterSpacing: '.02em',
    whiteSpace:    'nowrap',
  },
  dot: {
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  variantes: {
    success: { bg: '#dcfce7', color: '#166534' },
    warning: { bg: '#fef9c3', color: '#854d0e' },
    error:   { bg: '#fee2e2', color: '#991b1b' },
    info:    { bg: '#dbeafe', color: '#1e40af' },
    neutral: { bg: 'var(--color-border)',       color: 'var(--color-text-secondary)' },
    primary: { bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)' },
  },
}
