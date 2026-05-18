import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * CarreraForm
 *
 * Formulario reutilizable para crear y editar carreras.
 * Puramente presentacional en cuanto a UI.
 *
 * Props:
 *   inicial      {object}   Valores iniciales (para edición)
 *   facultades   {array}    Lista de facultades activas para el select
 *   onGuardar    {function} (datos) => Promise
 *   onCancelar   {function}
 *   errores422   {object}   Mapa campo → [mensajes] del backend
 */
export default function CarreraForm({
  inicial     = {},
  facultades  = [],
  onGuardar,
  onCancelar,
  errores422  = {},
}) {
  const [form, setForm] = useState({
    id_facultad:    inicial.id_facultad    ?? '',
    nombre_carrera: inicial.nombre_carrera ?? '',
    codigo_carrera: inicial.codigo_carrera ?? '',
  })
  const [guardando, setGuardando] = useState(false)

  // Sincronizar si cambia la carrera en edición
  useEffect(() => {
    setForm({
      id_facultad:    inicial.id_facultad    ?? '',
      nombre_carrera: inicial.nombre_carrera ?? '',
      codigo_carrera: inicial.codigo_carrera ?? '',
    })
  }, [inicial.id_carrera]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      id_facultad:    Number(form.id_facultad),
      nombre_carrera: form.nombre_carrera.trim(),
      codigo_carrera: form.codigo_carrera.trim().toUpperCase(),
    }
    await onGuardar(payload)
    setGuardando(false)
  }

  const campo = (id, label, requerido, extra = null) => (
    <div style={estilos.campo}>
      <label style={estilos.label} htmlFor={id}>
        {label}
        {requerido
          ? <span style={estilos.req}> *</span>
          : <span style={estilos.opc}> (opcional)</span>}
      </label>
      {extra}
      {errores422[id] && (
        <span style={estilos.errorMsg}>{errores422[id][0]}</span>
      )}
    </div>
  )

  return (
    <form onSubmit={onSubmit} noValidate style={estilos.form}>

      {/* Facultad */}
      {campo('id_facultad', 'Facultad', true,
        <select
          id="id_facultad"
          name="id_facultad"
          value={form.id_facultad}
          onChange={onChange}
          disabled={guardando}
          style={{
            ...estilos.input,
            ...(errores422.id_facultad ? estilos.inputError : {}),
          }}
        >
          <option value="">— Selecciona una facultad —</option>
          {facultades.map(f => (
            <option key={f.id_facultad} value={f.id_facultad}>
              {f.nombre_facultad}
              {f.codigo_facultad ? ` (${f.codigo_facultad})` : ''}
            </option>
          ))}
        </select>
      )}

      {/* Nombre */}
      {campo('nombre_carrera', 'Nombre de la carrera', true,
        <input
          id="nombre_carrera"
          name="nombre_carrera"
          type="text"
          maxLength={120}
          value={form.nombre_carrera}
          onChange={onChange}
          placeholder="Ej: Ingeniería en Sistemas"
          disabled={guardando}
          style={{
            ...estilos.input,
            ...(errores422.nombre_carrera ? estilos.inputError : {}),
          }}
        />
      )}

      {/* Código */}
      {campo('codigo_carrera', 'Código', true,
        <input
          id="codigo_carrera"
          name="codigo_carrera"
          type="text"
          maxLength={20}
          value={form.codigo_carrera}
          onChange={onChange}
          placeholder="Ej: INGSIST (A-Z, 0-9, guiones)"
          disabled={guardando}
          style={{
            ...estilos.input,
            fontFamily:  'var(--font-mono)',
            letterSpacing: '.04em',
            ...(errores422.codigo_carrera ? estilos.inputError : {}),
          }}
        />
      )}

      {/* Acciones */}
      <div style={estilos.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {inicial.id_carrera ? 'Guardar cambios' : 'Crear carrera'}
        </Button>
      </div>
    </form>
  )
}

const estilos = {
  form:     { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:      { color: 'var(--color-error)' },
  opc:      { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  input: {
    padding:      '9px 12px',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '14px',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    outline:      'none',
    width:        '100%',
    fontFamily:   'var(--font-sans)',
    transition:   'border-color .15s',
  },
  inputError: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg:   { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  acciones: {
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            '8px',
    paddingTop:     '4px',
    borderTop:      '1px solid var(--color-border)',
    marginTop:      '4px',
  },
}
