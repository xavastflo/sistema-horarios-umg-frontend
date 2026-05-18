import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * UsuarioForm
 *
 * Formulario de crear y editar usuarios.
 *
 * En creación: todos los campos son obligatorios incluido password.
 * En edición: password no existe en PUT. Estado es editable.
 *   pregunta/respuesta_seguridad opcionales en edición.
 *
 * Props:
 *   inicial    {object}   Valores iniciales para edición
 *   onGuardar  {function} (datos) => Promise
 *   onCancelar {function}
 *   errores422 {object}   Mapa campo → [mensajes]
 */
export default function UsuarioForm({ inicial = {}, onGuardar, onCancelar, errores422 = {} }) {
  const esEdicion = Boolean(inicial.id_usuario)

  const [form, setForm] = useState({
    nombres:              inicial.nombres              ?? '',
    apellidos:            inicial.apellidos            ?? '',
    nombre_usuario:       inicial.nombre_usuario       ?? '',
    correo_electronico:   inicial.correo_electronico   ?? '',
    telefono:             inicial.telefono             ?? '',
    password:             '',
    password_confirmation:'',
    pregunta_seguridad:   inicial.pregunta_seguridad   ?? '',
    respuesta_seguridad:  '',
    estado:               inicial.estado               ?? 'activo',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setForm({
      nombres:              inicial.nombres              ?? '',
      apellidos:            inicial.apellidos            ?? '',
      nombre_usuario:       inicial.nombre_usuario       ?? '',
      correo_electronico:   inicial.correo_electronico   ?? '',
      telefono:             inicial.telefono             ?? '',
      password:             '',
      password_confirmation:'',
      pregunta_seguridad:   inicial.pregunta_seguridad   ?? '',
      respuesta_seguridad:  '',
      estado:               inicial.estado               ?? 'activo',
    })
  }, [inicial.id_usuario]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)

    let payload
    if (esEdicion) {
      // PUT: sin password. Solo se envían campos opcionales.
      payload = {
        nombres:            form.nombres.trim(),
        apellidos:          form.apellidos.trim(),
        nombre_usuario:     form.nombre_usuario.trim(),
        correo_electronico: form.correo_electronico.trim(),
        estado:             form.estado,
        ...(form.telefono.trim() ? { telefono: form.telefono.trim() } : { telefono: null }),
        ...(form.pregunta_seguridad.trim() ? { pregunta_seguridad: form.pregunta_seguridad.trim() } : {}),
        ...(form.respuesta_seguridad.trim() ? { respuesta_seguridad: form.respuesta_seguridad.trim() } : {}),
      }
    } else {
      // POST: todos los campos obligatorios
      payload = {
        nombres:               form.nombres.trim(),
        apellidos:             form.apellidos.trim(),
        nombre_usuario:        form.nombre_usuario.trim(),
        correo_electronico:    form.correo_electronico.trim(),
        password:              form.password,
        password_confirmation: form.password_confirmation,
        pregunta_seguridad:    form.pregunta_seguridad.trim(),
        respuesta_seguridad:   form.respuesta_seguridad.trim(),
        ...(form.telefono.trim() ? { telefono: form.telefono.trim() } : {}),
      }
    }

    await onGuardar(payload)
    setGuardando(false)
  }

  const campo = (id, label, requerido, children) => (
    <div style={es.campo}>
      <label style={es.label} htmlFor={id}>
        {label}
        {requerido ? <span style={es.req}> *</span> : <span style={es.opc}> (opcional)</span>}
      </label>
      {children}
      {errores422[id] && <span style={es.errorMsg}>{errores422[id][0]}</span>}
    </div>
  )

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* Nombres y apellidos */}
      <div style={es.fila2}>
        {campo('nombres', 'Nombres', true,
          <input id="nombres" name="nombres" type="text" maxLength={100}
            value={form.nombres} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.nombres ? es.inputErr : {}) }} />
        )}
        {campo('apellidos', 'Apellidos', true,
          <input id="apellidos" name="apellidos" type="text" maxLength={100}
            value={form.apellidos} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.apellidos ? es.inputErr : {}) }} />
        )}
      </div>

      {/* Usuario y correo */}
      <div style={es.fila2}>
        {campo('nombre_usuario', 'Nombre de usuario', true,
          <>
            <input id="nombre_usuario" name="nombre_usuario" type="text" maxLength={50}
              value={form.nombre_usuario} onChange={onChange} disabled={guardando}
              placeholder="letras, números, ._-"
              style={{ ...es.input, fontFamily: 'var(--font-mono)', ...(errores422.nombre_usuario ? es.inputErr : {}) }} />
          </>
        )}
        {campo('correo_electronico', 'Correo electrónico', true,
          <input id="correo_electronico" name="correo_electronico" type="email" maxLength={120}
            value={form.correo_electronico} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.correo_electronico ? es.inputErr : {}) }} />
        )}
      </div>

      {/* Teléfono y estado (edición) */}
      <div style={es.fila2}>
        {campo('telefono', 'Teléfono', false,
          <input id="telefono" name="telefono" type="text" maxLength={20}
            value={form.telefono} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.telefono ? es.inputErr : {}) }} />
        )}
        {esEdicion && campo('estado', 'Estado', true,
          <select id="estado" name="estado" value={form.estado} onChange={onChange}
            disabled={guardando}
            style={{ ...es.input, ...(errores422.estado ? es.inputErr : {}) }}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        )}
      </div>

      {/* Password — solo en creación */}
      {!esEdicion && (
        <div style={es.fila2}>
          {campo('password', 'Contraseña', true,
            <input id="password" name="password" type="password"
              value={form.password} onChange={onChange} disabled={guardando}
              placeholder="Mín. 8 chars, mayúsculas, minúsculas y números"
              style={{ ...es.input, ...(errores422.password ? es.inputErr : {}) }} />
          )}
          {campo('password_confirmation', 'Confirmar contraseña', true,
            <input id="password_confirmation" name="password_confirmation" type="password"
              value={form.password_confirmation} onChange={onChange} disabled={guardando}
              style={{ ...es.input, ...(errores422.password_confirmation ? es.inputErr : {}) }} />
          )}
        </div>
      )}

      {/* Seguridad */}
      <div style={es.separador}>
        <span style={es.sepLabel}>Seguridad</span>
      </div>

      {campo('pregunta_seguridad', 'Pregunta de seguridad', !esEdicion,
        <input id="pregunta_seguridad" name="pregunta_seguridad" type="text" maxLength={150}
          value={form.pregunta_seguridad} onChange={onChange} disabled={guardando}
          placeholder="Ej: ¿Nombre de tu mascota?"
          style={{ ...es.input, ...(errores422.pregunta_seguridad ? es.inputErr : {}) }} />
      )}
      {campo('respuesta_seguridad', 'Respuesta de seguridad', !esEdicion,
        <input id="respuesta_seguridad" name="respuesta_seguridad" type="text" maxLength={255}
          value={form.respuesta_seguridad} onChange={onChange} disabled={guardando}
          style={{ ...es.input, ...(errores422.respuesta_seguridad ? es.inputErr : {}) }} />
      )}

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>Cancelar</Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {esEdicion ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

const es = {
  form:     { display: 'flex', flexDirection: 'column', gap: '16px' },
  fila2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  campo:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:      { color: 'var(--color-error)' },
  opc:      { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  separador: {
    display: 'flex', alignItems: 'center', gap: '8px',
    borderTop: '1px solid var(--color-border)', paddingTop: '4px',
  },
  sepLabel: { fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
