/**
 * EmptyState
 *
 * Muestra un mensaje amigable cuando una lista o tabla no tiene datos.
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   icono        {string}    Emoji o carácter como icono visual (default: '📭')
 *   titulo       {string}    Línea principal del mensaje
 *   descripcion  {string}    Texto de apoyo (opcional)
 *   accion       {ReactNode} Botón o enlace de acción (opcional)
 */
export default function EmptyState({
  icono       = '📭',
  titulo      = 'Sin resultados',
  descripcion,
  accion,
}) {
  return (
    <div style={estilos.wrapper}>
      <div style={estilos.icono}>{icono}</div>
      <p style={estilos.titulo}>{titulo}</p>
      {descripcion && <p style={estilos.descripcion}>{descripcion}</p>}
      {accion && <div style={estilos.accion}>{accion}</div>}
    </div>
  )
}

const estilos = {
  wrapper: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '48px 24px',
    textAlign:      'center',
  },
  icono: {
    fontSize:     '36px',
    lineHeight:   1,
    marginBottom: '14px',
  },
  titulo: {
    fontSize:     '15px',
    fontWeight:   600,
    color:        'var(--color-text)',
    margin:       '0 0 6px',
  },
  descripcion: {
    fontSize:     '13.5px',
    color:        'var(--color-text-muted)',
    lineHeight:   1.6,
    maxWidth:     '340px',
    margin:       '0 0 20px',
  },
  accion: {
    marginTop: '4px',
  },
}
