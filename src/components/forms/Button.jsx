/**
 * Button
 *
 * Botón estándar del sistema con variantes, estado de carga e icono.
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   variante   {'primary'|'secondary'|'danger'|'ghost'}  (default: 'primary')
 *   size       {'sm'|'md'|'lg'}                          (default: 'md')
 *   cargando   {boolean}   Muestra spinner y deshabilita el botón
 *   icono      {ReactNode} Icono a la izquierda del texto (opcional)
 *   disabled   {boolean}
 *   onClick    {function}
 *   type       {'button'|'submit'|'reset'}               (default: 'button')
 *   children   {ReactNode}
 */
export default function Button({
  variante = 'primary',
  size     = 'md',
  cargando = false,
  icono,
  disabled = false,
  onClick,
  type     = 'button',
  children,
  style    = {},
}) {
  const base     = estilos.base
  const variStyles = estilos.variantes[variante] ?? estilos.variantes.primary
  const sizeStyles = estilos.sizes[size]         ?? estilos.sizes.md
  const inactivo   = disabled || cargando

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inactivo}
      style={{
        ...base,
        ...variStyles,
        ...sizeStyles,
        ...(inactivo ? estilos.deshabilitado : {}),
        ...style,
      }}
    >
      {cargando
        ? <span style={estilos.spinner} />
        : icono && <span style={estilos.icono}>{icono}</span>
      }
      {children}
    </button>
  )
}

const estilos = {
  base: {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '6px',
    border:         'none',
    borderRadius:   'var(--radius-md)',
    fontFamily:     'var(--font-sans)',
    fontWeight:     600,
    cursor:         'pointer',
    transition:     'background .15s, opacity .15s, box-shadow .15s',
    whiteSpace:     'nowrap',
    letterSpacing:  '.01em',
  },

  variantes: {
    primary: {
      background: 'var(--color-primary)',
      color:      '#fff',
    },
    secondary: {
      background: 'var(--color-primary-subtle)',
      color:      'var(--color-primary)',
      border:     '1px solid var(--color-border)',
    },
    danger: {
      background: '#fef2f2',
      color:      'var(--color-error)',
      border:     '1px solid #fecaca',
    },
    ghost: {
      background: 'transparent',
      color:      'var(--color-text-secondary)',
      border:     '1px solid var(--color-border)',
    },
  },

  sizes: {
    sm: { fontSize: '12px', padding: '6px 12px',  height: '30px' },
    md: { fontSize: '13.5px', padding: '8px 16px', height: '36px' },
    lg: { fontSize: '14px',  padding: '10px 20px', height: '42px' },
  },

  deshabilitado: {
    opacity: .55,
    cursor:  'not-allowed',
  },

  icono: {
    display:    'flex',
    alignItems: 'center',
    flexShrink: 0,
  },

  spinner: {
    display:         'inline-block',
    width:           '14px',
    height:          '14px',
    border:          '2px solid rgba(255,255,255,.35)',
    borderTopColor:  'currentColor',
    borderRadius:    '50%',
    animation:       'spin .7s linear infinite',
    flexShrink:      0,
  },
}
