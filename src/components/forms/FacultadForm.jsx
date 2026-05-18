import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * FacultadForm
 *
 * Formulario reutilizable para crear y editar facultades.
 * Puramente presentacional en cuanto a UI — la lógica de submit
 * la maneja el padre (Facultades.jsx).
 *
 * Props:
 *   inicial    {object}   Valores iniciales (para edición)
 *   onGuardar  {function} (datos) => Promise — llamado al enviar
 *   onCancelar {function} Cierra el formulario
 *   errores422 {object}   Mapa campo → [mensajes] del backend
 */
export default function FacultadForm({ inicial = {}, onGuardar, onCancelar, errores422 = {} }) {
  const [form, setForm] = useState({
    nombre_facultad: inicial.nombre_facultad ?? '',
    codigo_facultad: inicial.codigo_facultad ?? '',
    descripcion:     inicial.descripcion     ?? '',
  })
  const [guardando, setGuardando] = useState(false)

  // Sincronizar si cambian los valores iniciales (abrir edición distinta)
  useEffect(() => {
    setForm({
      nombre_facultad: inicial.nombre_facultad ?? '',
      codigo_facultad: inicial.codigo_facultad ?? '',
      descripcion:     inicial.descripcion     ?? '',
    })
  }, [inicial.id_facultad]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    // Limpiar campos vacíos opcionales para no enviar strings vacíos
    const payload = {
      nombre_facultad: form.nombre_facultad.trim(),
      ...(form.codigo_facultad.trim() && { codigo_facultad: form.codigo_facultad.trim().toUpperCase() }),
      ...(form.descripcion.trim()     && { descripcion:     form.descripcion.trim() }),
    }
    await onGuardar(payload)
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={estilos.form}>

      {/* Nombre */}
      <div style={estilos.campo}>
        <label style={estilos.label} htmlFor="nombre_facultad">
          Nombre de la facultad <span style={estilos.requerido}>*</span>
        </label>
        <input
          id="nombre_facultad"
          name="nombre_facultad"
          type="text"
          maxLength={100}
          value={form.nombre_facultad}
          onChange={onChange}
          placeholder="Ej: Facultad de Ingeniería"
          disabled={guardando}
          style={{
            ...estilos.input,
            ...(errores422.nombre_facultad ? estilos.inputError : {}),
          }}
        />
        {errores422.nombre_facultad && (
          <span style={estilos.errorMsg}>{errores422.nombre_facultad[0]}</span>
        )}
      </div>

      {/* Código */}
      <div style={estilos.campo}>
        <label style={estilos.label} htmlFor="codigo_facultad">
          Código <span style={estilos.opcional}>(opcional)</span>
        </label>
        <input
          id="codigo_facultad"
          name="codigo_facultad"
          type="text"
          maxLength={20}
          value={form.codigo_facultad}
          onChange={onChange}
          placeholder="Ej: FING (A-Z, 0-9, guiones)"
          disabled={guardando}
          style={{
            ...estilos.input,
            ...(errores422.codigo_facultad ? estilos.inputError : {}),
          }}
        />
        {errores422.codigo_facultad && (
          <span style={estilos.errorMsg}>{errores422.codigo_facultad[0]}</span>
        )}
      </div>

      {/* Descripción */}
      <div style={estilos.campo}>
        <label style={estilos.label} htmlFor="descripcion">
          Descripción <span style={estilos.opcional}>(opcional)</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          maxLength={200}
          rows={3}
          value={form.descripcion}
          onChange={onChange}
          placeholder="Descripción breve de la facultad"
          disabled={guardando}
          style={{
            ...estilos.input,
            resize: 'vertical',
            minHeight: '72px',
            ...(errores422.descripcion ? estilos.inputError : {}),
          }}
        />
        {errores422.descripcion && (
          <span style={estilos.errorMsg}>{errores422.descripcion[0]}</span>
        )}
      </div>

      {/* Acciones */}
      <div style={estilos.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {inicial.id_facultad ? 'Guardar cambios' : 'Crear facultad'}
        </Button>
      </div>
    </form>
  )
}

const estilos = {
  form:  { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: {
    fontSize:   '13px',
    fontWeight: 600,
    color:      'var(--color-text-secondary)',
  },
  requerido: { color: 'var(--color-error)' },
  opcional:  { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
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
  inputError: {
    borderColor:  'var(--color-error)',
    background:   '#fff8f8',
  },
  errorMsg: {
    fontSize:   '12px',
    color:      'var(--color-error)',
    fontWeight: 500,
  },
  acciones: {
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            '8px',
    paddingTop:     '4px',
    borderTop:      '1px solid var(--color-border)',
    marginTop:      '4px',
  },
}
