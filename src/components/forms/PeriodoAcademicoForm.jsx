import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * PeriodoAcademicoForm
 *
 * Formulario de crear y editar períodos académicos.
 *
 * Cambio de UX (vs versión anterior):
 *   - 'nombre_base'  → <select> con opciones fijas (no texto libre)
 *   - 'anio'         → eliminado del formulario; el backend lo extrae de fecha_inicio
 *   - 'nombre_periodo' se construye en el backend: "{nombre_base} {año de fecha_inicio}"
 *
 * El payload enviado al backend:
 *   POST: { nombre_base, numero_periodo, fecha_inicio, fecha_fin,
 *            fecha_limite_edicion_horarios?, estado?, es_vigente? }
 *   PUT:  mismos campos, todos opcionales
 *
 * Props:
 *   inicial    {object}    Valores iniciales para edición
 *   onGuardar  {function}  (datos) => Promise
 *   onCancelar {function}
 *   errores422 {object}    Mapa campo → [mensajes]
 */

/** Opciones estandarizadas para la UMG — deben coincidir con NOMBRES_BASE del backend */
const NOMBRES_BASE = [
  'Primer Semestre',
  'Segundo Semestre',
  'Escuela de Vacaciones',
]

/**
 * Extrae el prefijo del nombre existente para preseleccionar en edición.
 * "Primer Semestre 2024" → "Primer Semestre"
 */
function extraerNombreBase(nombreCompleto) {
  if (!nombreCompleto) return ''
  // Quita el año al final si existe
  const sinAnio = nombreCompleto.replace(/\s+\d{4}$/, '').trim()
  return NOMBRES_BASE.includes(sinAnio) ? sinAnio : ''
}

export default function PeriodoAcademicoForm({
  inicial     = {},
  onGuardar,
  onCancelar,
  errores422  = {},
}) {
  const esEdicion = Boolean(inicial.id_periodo_academico)

  const [form, setForm] = useState({
    nombre_base:                   extraerNombreBase(inicial.nombre_periodo),
    numero_periodo:                inicial.numero_periodo                ?? '',
    fecha_inicio:                  inicial.fecha_inicio?.slice(0, 10)   ?? '',
    fecha_fin:                     inicial.fecha_fin?.slice(0, 10)      ?? '',
    fecha_limite_edicion_horarios: inicial.fecha_limite_edicion_horarios?.slice(0, 10) ?? '',
    estado:                        inicial.estado                        ?? 'planificacion',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setForm({
      nombre_base:                   extraerNombreBase(inicial.nombre_periodo),
      numero_periodo:                inicial.numero_periodo                ?? '',
      fecha_inicio:                  inicial.fecha_inicio?.slice(0, 10)   ?? '',
      fecha_fin:                     inicial.fecha_fin?.slice(0, 10)      ?? '',
      fecha_limite_edicion_horarios: inicial.fecha_limite_edicion_horarios?.slice(0, 10) ?? '',
      estado:                        inicial.estado                        ?? 'planificacion',
    })
  }, [inicial.id_periodo_academico]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  /** Vista previa del nombre que generará el backend */
  const anioPreview = form.fecha_inicio
    ? new Date(form.fecha_inicio + 'T00:00:00').getFullYear()
    : null
  const nombrePreview = (form.nombre_base && anioPreview)
    ? `${form.nombre_base} ${anioPreview}`
    : (form.nombre_base || '—')

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      nombre_base:    form.nombre_base,
      numero_periodo: Number(form.numero_periodo),
      fecha_inicio:   form.fecha_inicio,
      fecha_fin:      form.fecha_fin,
      estado:         form.estado,
      // anio NO se envía — el backend lo extrae de fecha_inicio
      ...(form.fecha_limite_edicion_horarios
        ? { fecha_limite_edicion_horarios: form.fecha_limite_edicion_horarios }
        : { fecha_limite_edicion_horarios: null }),
    }
    await onGuardar(payload)
    setGuardando(false)
  }

  const campo = (id, label, requerido, children, hint = null) => (
    <div style={es.campo}>
      <label style={es.label} htmlFor={id}>
        {label}
        {requerido
          ? <span style={es.req}> *</span>
          : <span style={es.opc}> (opcional)</span>}
      </label>
      {children}
      {hint && <span style={es.hint}>{hint}</span>}
      {errores422[id] && <span style={es.errorMsg}>{errores422[id][0]}</span>}
    </div>
  )

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* Tipo de período — select estandarizado */}
      {campo('nombre_base', 'Tipo de período', true, null)}
      <div style={es.campoCompuesto}>
        <select
          id="nombre_base" name="nombre_base"
          value={form.nombre_base} onChange={onChange}
          disabled={guardando}
          style={{ ...es.input, ...(errores422.nombre_base ? es.inputErr : {}) }}
        >
          <option value="">— Selecciona el tipo de período —</option>
          {NOMBRES_BASE.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {errores422.nombre_base && (
          <span style={es.errorMsg}>{errores422.nombre_base[0]}</span>
        )}

        {/* Vista previa del nombre que se guardará */}
        <div style={es.preview}>
          <span style={es.previewLabel}>Nombre que se guardará:</span>
          <span style={{
            ...es.previewValor,
            color: (form.nombre_base && anioPreview)
              ? 'var(--color-primary)'
              : 'var(--color-text-muted)',
          }}>
            {nombrePreview}
          </span>
          {form.nombre_base && !anioPreview && (
            <span style={es.previewHint}>← ingresa la fecha de inicio para ver el año</span>
          )}
        </div>
      </div>

      {/* Número de período */}
      {campo('numero_periodo', 'N.° de período', true,
        <select
          id="numero_periodo" name="numero_periodo"
          value={form.numero_periodo} onChange={onChange}
          disabled={guardando}
          style={{ ...es.input, ...(errores422.numero_periodo ? es.inputErr : {}) }}
        >
          <option value="">—</option>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <option key={n} value={n}>Período {n}</option>
          ))}
        </select>
      )}

      {/* Fechas inicio / fin */}
      <div style={es.fila2}>
        {campo('fecha_inicio', 'Fecha de inicio', true,
          <input
            id="fecha_inicio" name="fecha_inicio" type="date"
            value={form.fecha_inicio} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.fecha_inicio ? es.inputErr : {}) }}
          />,
          'El año se extrae automáticamente de esta fecha.'
        )}
        {campo('fecha_fin', 'Fecha de fin', true,
          <input
            id="fecha_fin" name="fecha_fin" type="date"
            value={form.fecha_fin} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.fecha_fin ? es.inputErr : {}) }}
          />
        )}
      </div>

      {/* Fecha límite edición de horarios */}
      {campo('fecha_limite_edicion_horarios', 'Fecha límite edición de horarios', false,
        <input
          id="fecha_limite_edicion_horarios" name="fecha_limite_edicion_horarios"
          type="date" value={form.fecha_limite_edicion_horarios}
          onChange={onChange} disabled={guardando}
          style={{ ...es.input, ...(errores422.fecha_limite_edicion_horarios ? es.inputErr : {}) }}
        />,
        'Después de esta fecha no se podrán editar los horarios del período.'
      )}

      {/* Estado */}
      {campo('estado', 'Estado', true,
        <select
          id="estado" name="estado"
          value={form.estado} onChange={onChange} disabled={guardando}
          style={{ ...es.input, ...(errores422.estado ? es.inputErr : {}) }}
        >
          <option value="planificacion">Planificación</option>
          <option value="activo">Activo</option>
          <option value="cerrado">Cerrado</option>
          <option value="finalizado">Finalizado</option>
        </select>
      )}

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {esEdicion ? 'Guardar cambios' : 'Crear período'}
        </Button>
      </div>
    </form>
  )
}

const es = {
  form:          { display: 'flex', flexDirection: 'column', gap: '16px' },
  fila2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  campo:         { display: 'flex', flexDirection: 'column', gap: '5px' },
  campoCompuesto:{ display: 'flex', flexDirection: 'column', gap: '8px' },
  label:         { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:           { color: 'var(--color-error)' },
  opc:           { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  hint:          { fontSize: '11.5px', color: 'var(--color-text-muted)' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr:    { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg:    { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  preview: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', background: 'var(--color-bg)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    flexWrap: 'wrap',
  },
  previewLabel:{ fontSize: '12px', color: 'var(--color-text-muted)', flexShrink: 0 },
  previewValor:{ fontSize: '13.5px', fontWeight: 700 },
  previewHint: { fontSize: '11.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
