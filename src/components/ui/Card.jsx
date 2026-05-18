/**
 * Card
 *
 * Contenedor de superficie estándar.
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   children     {ReactNode}  Contenido de la tarjeta
 *   padding      {string}     '16px' | '24px' | '0' etc. (default: '24px')
 *   sinBorde     {boolean}    Quita el borde lateral (para tablas full-bleed)
 *   style        {object}     Estilos extra (override)
 */
export default function Card({ children, padding = '24px', sinBorde = false, style = {} }) {
  return (
    <div
      style={{
        background:   'var(--color-surface)',
        border:       sinBorde ? 'none' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow:    'var(--shadow-sm)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
