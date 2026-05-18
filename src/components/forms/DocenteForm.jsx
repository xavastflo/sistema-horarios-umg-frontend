import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * DocenteForm
 *
 * Formulario para crear y editar docentes.
 *
 * En creación: requiere seleccionar un usuario con rol docente.
 * En edición: usuario es solo lectura (no cambia); se puede editar
 *   código y prioridad. Estado editable solo via PUT.
 *
 * Props:
 *   inicial       {object}    Valores iniciales para edición
 *   usuariosDisp  {array}     Usuarios con rol docente disponibles (para crear)
 *   onGuardar     {function}  (datos) => Promise
 *   onCancelar    {function}
 *   errores422    {object}    Mapa campo → [mensajes]
 *   esAdmin       {boolean}   Si es admin puede crear docentes; coord solo edita
 */
export default function DocenteForm({
  inicial       = {},
  usuariosDisp  = [],
  onGuardar,
  onCancelar,
  errores422    = {},
  esAdmin       = false,
}) {
  const esEdicion = Boolean(inicial.id_docente)

  const [form, setForm] = useState({
    id_usuario:     inicial.usuario?.id_usuario ?? '',
    codigo_docente: inicial.codigo_docente      ?? '',
    prioridad:      inicial.prioridad           ?? 3,
    estado:         inicial.estado              ?? 'activo',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setForm({
      id_usuario:     inicial.usuario?.id_usuario ?? '',
      codigo_docente: inicial.codigo_docente      ?? '',
      prioridad:      inicial.prioridad           ?? 3,
      estado:         inicial.estado              ?? 'activo',
    })
  }, [inicial.id_docente]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)

    let payload
    if (esEdicion) {
      // PUT acepta: codigo_docente, prioridad, estado
      payload = {
        prioridad: Number(form.prioridad),
        estado:    form.estado,
        ...(form.codigo_docente.trim()
          ? { codigo_docente: form.codigo_docente.trim() }
          : { codigo_docente: null }),
      }
    } else {
      // POST requiere: id_usuario (con rol docente), código y prioridad opcionales
      payload = {
        id_usuario: Number(form.id_usuario),
        prioridad:  Number(form.prioridad),
        ...(form.codigo_docente.trim() && { codigo_docente: form.codigo_docente.trim() }),
      }
    }

    await onGuardar(payload)
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* Usuario — solo en creación (admin) */}
      {!esEdicion && esAdmin && (
        <div style={es.campo}>
          <label style={es.label} htmlFor="id_usuario">
            Usuario con rol docente <span style={es.req}>*</span>
          </label>
          <select
            id="id_usuario" name="id_usuario"
            value={form.id_usuario} onChange={onChange}
            disabled={guardando}
            style={{ ...es.input, ...(errores422.id_usuario ? es.inputErr : {}) }}
          >
            <option value="">— Selecciona un usuario —</option>
            {usuariosDisp.map(u => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombres} {u.apellidos} ({u.nombre_usuario})
              </option>
            ))}
          </select>
          {errores422.id_usuario && (
            <span style={es.errorMsg}>{errores422.id_usuario[0]}</span>
          )}
          <span style={es.hint}>
            Solo aparecen usuarios con rol docente asignado.
          </span>
        </div>
      )}

      {/* Usuario — solo lectura en edición */}
      {esEdicion && (
        <div style={es.campo}>
          <label style={es.label}>Usuario</label>
          <div style={es.lectura}>
            {inicial.usuario?.nombre_completo ?? inicial.usuario?.nombre_usuario ?? '—'}
          </div>
          <span style={es.hint}>No editable — fijado al crear el perfil docente.</span>
        </div>
      )}

      {/* Código docente */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="codigo_docente">
          Código de docente <span style={es.opc}>(opcional)</span>
        </label>
        <input
          id="codigo_docente" name="codigo_docente" type="text"
          maxLength={20} value={form.codigo_docente} onChange={onChange}
          placeholder="Ej: DOC-001"
          disabled={guardando}
          style={{
            ...es.input,
            fontFamily: 'var(--font-mono)',
            ...(errores422.codigo_docente ? es.inputErr : {}),
          }}
        />
        {errores422.codigo_docente && (
          <span style={es.errorMsg}>{errores422.codigo_docente[0]}</span>
        )}
      </div>

      {/* Prioridad + Estado en fila */}
      <div style={es.fila2}>
        <div style={es.campo}>
          <label style={es.label} htmlFor="prioridad">
            Prioridad <span style={es.req}>*</span>
          </label>
          <select
            id="prioridad" name="prioridad"
            value={form.prioridad} onChange={onChange}
            disabled={guardando}
            style={{ ...es.input, ...(errores422.prioridad ? es.inputErr : {}) }}
          >
            <option value={1}>1 — Alta</option>
            <option value={2}>2 — Media</option>
            <option value={3}>3 — Baja</option>
          </select>
          {errores422.prioridad && (
            <span style={es.errorMsg}>{errores422.prioridad[0]}</span>
          )}
          <span style={es.hint}>Define el orden en la asignación automática de horarios.</span>
        </div>

        {/* Estado — solo en edición */}
        {esEdicion && (
          <div style={es.campo}>
            <label style={es.label} htmlFor="estado">
              Estado <span style={es.req}>*</span>
            </label>
            <select
              id="estado" name="estado"
              value={form.estado} onChange={onChange}
              disabled={guardando}
              style={{ ...es.input, ...(errores422.estado ? es.inputErr : {}) }}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            {errores422.estado && (
              <span style={es.errorMsg}>{errores422.estado[0]}</span>
            )}
          </div>
        )}
      </div>

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {esEdicion ? 'Guardar cambios' : 'Crear perfil docente'}
        </Button>
      </div>
    </form>
  )
}

const es = {
  form:    { display: 'flex', flexDirection: 'column', gap: '16px' },
  fila2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  campo:   { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:   { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:     { color: 'var(--color-error)' },
  opc:     { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  hint:    { fontSize: '11.5px', color: 'var(--color-text-muted)' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  lectura: {
    padding: '9px 12px', background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500,
  },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
