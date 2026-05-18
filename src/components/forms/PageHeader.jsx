/**
 * PageHeader
 *
 * Encabezado estándar para módulos y páginas.
 * Puramente presentacional — sin fetch, sin efectos, sin API.
 *
 * Props:
 *   titulo       {string}     Nombre del módulo o página  (requerido)
 *   descripcion  {string}     Subtítulo o descripción breve (opcional)
 *   accion       {ReactNode}  Slot derecho — botones de acción (opcional)
 */
export default function PageHeader({ titulo, descripcion, accion }) {
  return (
    <div style={estilos.wrapper}>
      <div style={estilos.texto}>
        <h1 style={estilos.titulo}>{titulo}</h1>
        {descripcion && <p style={estilos.descripcion}>{descripcion}</p>}
      </div>
      {accion && <div style={estilos.accion}>{accion}</div>}
    </div>
  )
}

const estilos = {
  wrapper: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            '16px',
    marginBottom:   '24px',
    flexWrap:       'wrap',
  },
  texto: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  titulo: {
    fontSize:      '20px',
    fontWeight:    700,
    color:         'var(--color-text)',
    letterSpacing: '-.02em',
    lineHeight:    1.2,
    margin:        0,
  },
  descripcion: {
    fontSize:   '13.5px',
    color:      'var(--color-text-secondary)',
    lineHeight: 1.5,
    margin:     0,
  },
  accion: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    flexShrink: 0,
  },
}
