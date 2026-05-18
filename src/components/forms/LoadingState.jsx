/**
 * LoadingState
 *
 * Indicador de carga para usarse mientras un módulo espera datos del backend.
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   texto   {string}   Mensaje de carga (default: 'Cargando…')
 *   alto    {string}   Altura mínima del área de carga (default: '200px')
 */
export default function LoadingState({ texto = 'Cargando…', alto = '200px' }) {
  return (
    <div style={{ ...estilos.wrapper, minHeight: alto }}>
      <div style={estilos.spinner} />
      <p style={estilos.texto}>{texto}</p>
    </div>
  )
}

const estilos = {
  wrapper: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '14px',
    padding:        '40px 24px',
  },
  spinner: {
    width:           '28px',
    height:          '28px',
    border:          '3px solid var(--color-border)',
    borderTopColor:  'var(--color-primary)',
    borderRadius:    '50%',
    animation:       'spin .7s linear infinite',
  },
  texto: {
    fontSize:  '13.5px',
    color:     'var(--color-text-muted)',
    margin:    0,
  },
}
