import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * CursoForm
 *
 * Formulario para crear y editar cursos.
 * Cursos es un catálogo global — sin relación con carrera ni período.
 *
 * Props:
 *   inicial    {object}   Valores iniciales para edición
 *   onGuardar  {function} (datos) => Promise
 *   onCancelar {function}
 *   errores422 {object}   Mapa campo → [mensajes]
 */
export default function CursoForm({ inicial = {}, onGuardar, onCancelar, errores422 = {} }) {
  const esEdicion = Boolean(inicial.id_curso)

  const [form, setForm] = useState({
    codigo_curso: inicial.codigo_curso ?? '',
    nombre_curso: inicial.nombre_curso ?? '',
    estado:       inicial.estado       ?? 'activo',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setForm({
      codigo_curso: inicial.codigo_curso ?? '',
      nombre_curso: inicial.nombre_curso ?? '',
      estado:       inicial.estado       ?? 'activo',
    })
  }, [inicial.id_curso]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      codigo_curso: form.codigo_curso.trim().toUpperCase(),
      nombre_curso: form.nombre_curso.trim(),
      ...(esEdicion && { estado: form.estado }),
    }
    await onGuardar(payload)
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* Código */}
      <div style={es.fila2}>
        <div style={es.campo}>
          <label style={es.label} htmlFor="codigo_curso">
            Código <span style={es.req}>*</span>
          </label>
          <input
            id="codigo_curso" name="codigo_curso" type="text"
            maxLength={20} value={form.codigo_curso} onChange={onChange}
            placeholder="Ej: MAT101 (se convierte a mayúsculas)"
            disabled={guardando}
            style={{
              ...es.input,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '.04em',
              ...(errores422.codigo_curso ? es.inputErr : {}),
            }}
          />
          {errores422.codigo_curso && (
            <span style={es.errorMsg}>{errores422.codigo_curso[0]}</span>
          )}
        </div>

        {/* Estado — solo en edición */}
        {esEdicion && (
          <div style={es.campo}>
            <label style={es.label} htmlFor="estado">Estado <span style={es.req}>*</span></label>
            <select
              id="estado" name="estado"
              value={form.estado} onChange={onChange} disabled={guardando}
              style={{ ...es.input, ...(errores422.estado ? es.inputErr : {}) }}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            {errores422.estado && <span style={es.errorMsg}>{errores422.estado[0]}</span>}
          </div>
        )}
      </div>

      {/* Nombre */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="nombre_curso">
          Nombre del curso <span style={es.req}>*</span>
        </label>
        <input
          id="nombre_curso" name="nombre_curso" type="text"
          maxLength={120} value={form.nombre_curso} onChange={onChange}
          placeholder="Ej: Matemática I"
          disabled={guardando}
          style={{ ...es.input, ...(errores422.nombre_curso ? es.inputErr : {}) }}
        />
        {errores422.nombre_curso && (
          <span style={es.errorMsg}>{errores422.nombre_curso[0]}</span>
        )}
      </div>

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {esEdicion ? 'Guardar cambios' : 'Crear curso'}
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
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
