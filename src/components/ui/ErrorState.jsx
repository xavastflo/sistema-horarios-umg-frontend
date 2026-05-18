/**
 * ErrorState
 *
 * Muestra un error de forma amigable. Acepta un callback de reintento opcional.
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   mensaje       {string}    Descripción del error (default: 'Ocurrió un error inesperado.')
 *   onReintentar  {function}  Callback para el botón "Reintentar" (opcional)
 *   alto          {string}    Altura mínima del área (default: '200px')
 */
export default function ErrorState({
  mensaje      = 'Ocurrió un error inesperado.',
  onReintentar,
  alto         = '200px',
}) {
  return (
    <div style={{ ...estilos.wrapper, minHeight: alto }}>
      <div style={estilos.icono}>⚠️</div>
      <p style={estilos.titulo}>Algo salió mal</p>
      <p style={estilos.mensaje}>{mensaje}</p>
      {onReintentar && (
        <button onClick={onReintentar} style={estilos.btn}>
          Reintentar
        </button>
      )}
    </div>
  )
}

const estilos = {
  wrapper: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    padding:        '40px 24px',
    textAlign:      'center',
  },
  icono: {
    fontSize:     '32px',
    lineHeight:   1,
    marginBottom: '4px',
  },
  titulo: {
    fontSize:   '15px',
    fontWeight: 600,
    color:      'var(--color-text)',
    margin:     0,
  },
  mensaje: {
    fontSize:  '13.5px',
    color:     'var(--color-text-muted)',
    lineHeight: 1.6,
    maxWidth:  '340px',
    margin:    '2px 0 12px',
  },
  btn: {
    padding:      '7px 16px',
    background:   'var(--color-primary-subtle)',
    color:        'var(--color-primary)',
    border:       '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '13px',
    fontWeight:   600,
    cursor:       'pointer',
  },
}
