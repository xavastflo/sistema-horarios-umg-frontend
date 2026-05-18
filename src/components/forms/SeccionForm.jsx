import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * SeccionForm
 *
 * Formulario de creación de secciones.
 * No hay edición (no existe PUT en el backend).
 *
 * Props:
 *   cursos     {array}    Cursos activos para el select
 *   periodos   {array}    Períodos activos para el select
 *   onGuardar  {function} (datos) => Promise
 *   onCancelar {function}
 *   errores422 {object}   Mapa campo → [mensajes]
 */
export default function SeccionForm({
  cursos     = [],
  periodos   = [],
  onGuardar,
  onCancelar,
  errores422 = {},
}) {
  const [form, setForm] = useState({
    id_curso:             '',
    id_periodo_academico: '',
    numero_seccion:       '',
  })
  const [guardando, setGuardando] = useState(false)

  // Limpiar formulario si los catálogos cambian (defensa ante re-uso del componente)
  useEffect(() => {
    setForm({ id_curso: '', id_periodo_academico: '', numero_seccion: '' })
  }, []) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    await onGuardar({
      id_curso:             Number(form.id_curso),
      id_periodo_academico: Number(form.id_periodo_academico),
      numero_seccion:       form.numero_seccion.trim().toUpperCase(),
    })
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* Curso */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_curso">
          Curso <span style={es.req}>*</span>
        </label>
        <select
          id="id_curso" name="id_curso"
          value={form.id_curso} onChange={onChange}
          disabled={guardando}
          style={{ ...es.input, ...(errores422.id_curso ? es.inputErr : {}) }}
        >
          <option value="">— Selecciona un curso —</option>
          {cursos.map(c => (
            <option key={c.id_curso} value={c.id_curso}>
              [{c.codigo_curso}] {c.nombre_curso}
            </option>
          ))}
        </select>
        {errores422.id_curso && (
          <span style={es.errorMsg}>{errores422.id_curso[0]}</span>
        )}
      </div>

      {/* Período académico */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_periodo_academico">
          Período académico <span style={es.req}>*</span>
        </label>
        <select
          id="id_periodo_academico" name="id_periodo_academico"
          value={form.id_periodo_academico} onChange={onChange}
          disabled={guardando}
          style={{ ...es.input, ...(errores422.id_periodo_academico ? es.inputErr : {}) }}
        >
          <option value="">— Selecciona un período —</option>
          {periodos.map(p => (
            <option key={p.id_periodo_academico} value={p.id_periodo_academico}>
              {p.nombre_periodo}
              {p.anio ? ` (${p.anio})` : ''}
              {p.es_vigente ? ' ★' : ''}
            </option>
          ))}
        </select>
        {errores422.id_periodo_academico && (
          <span style={es.errorMsg}>{errores422.id_periodo_academico[0]}</span>
        )}
      </div>

      {/* Número de sección */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="numero_seccion">
          Número de sección <span style={es.req}>*</span>
        </label>
        <input
          id="numero_seccion" name="numero_seccion"
          type="text" maxLength={10}
          value={form.numero_seccion} onChange={onChange}
          placeholder='Ej: A, B, 01, 02 (se convierte a mayúsculas)'
          disabled={guardando}
          style={{
            ...es.input,
            fontFamily:    'var(--font-mono)',
            letterSpacing: '.06em',
            ...(errores422.numero_seccion ? es.inputErr : {}),
          }}
        />
        {errores422.numero_seccion && (
          <span style={es.errorMsg}>{errores422.numero_seccion[0]}</span>
        )}
        <span style={es.hint}>
          Único por combinación de curso + período. El backend convierte a mayúsculas.
        </span>
      </div>

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          Crear sección
        </Button>
      </div>
    </form>
  )
}

const es = {
  form:     { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:      { color: 'var(--color-error)' },
  hint:     { fontSize: '11.5px', color: 'var(--color-text-muted)' },
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
