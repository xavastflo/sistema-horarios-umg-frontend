import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * PeriodoAcademicoForm
 *
 * Formulario de crear/editar períodos académicos (semestres UMG).
 *
 * Terminología:
 *   - "Tipo de semestre" → Semestres Impares (Ene–Jun) | Semestres Pares (Jul–Nov)
 *
 * numero_periodo se calcula automáticamente:
 *   Semestres Impares → numero_periodo = 1
 *   Semestres Pares   → numero_periodo = 2
 * El usuario NO lo elige manualmente. Esto garantiza coherencia con
 * el UNIQUE(anio, numero_periodo) en la BD.
 *
 * Lógica de ciclos del pensum (pertenece a pensum_curso.ciclo_semestre, no aquí):
 *   Semestres Impares  → activa ciclos IMPARES  (1, 3, 5, 7, 9, 11)
 *   Semestres Pares    → activa ciclos PARES    (2, 4, 6, 8, 10, 12)
 *
 * Payload enviado al backend:
 *   { nombre_base, numero_periodo, fecha_inicio, fecha_fin,
 *     fecha_limite_edicion_horarios?, estado? }
 *   (anio se deriva en el backend desde fecha_inicio)
 */

const TIPOS_SEMESTRE = [
  { value: 'Semestres Impares', label: 'Semestres Impares', rango: 'Enero – Junio',    ciclos: 'impares (1, 3, 5…)' },
  { value: 'Semestres Pares',   label: 'Semestres Pares',   rango: 'Julio – Noviembre', ciclos: 'pares (2, 4, 6…)' },
]

/** numero_periodo calculado automáticamente — nunca elegido por el usuario */
const NUMERO_PERIODO_MAP = {
  'Semestres Impares': 1,
  'Semestres Pares':   2,
}

function extraerNombreBase(nombreCompleto) {
  if (!nombreCompleto) return ''
  const sinAnio = nombreCompleto.replace(/\s+\d{4}$/, '').trim()
  return TIPOS_SEMESTRE.some(t => t.value === sinAnio) ? sinAnio : ''
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
    fecha_inicio:                  inicial.fecha_inicio?.slice(0, 10)   ?? '',
    fecha_fin:                     inicial.fecha_fin?.slice(0, 10)      ?? '',
    fecha_limite_edicion_horarios: inicial.fecha_limite_edicion_horarios?.slice(0, 10) ?? '',
    estado:                        inicial.estado                        ?? 'planificacion',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorFechas, setErrorFechas] = useState('')

  useEffect(() => {
    setForm({
      nombre_base:                   extraerNombreBase(inicial.nombre_periodo),
      fecha_inicio:                  inicial.fecha_inicio?.slice(0, 10)   ?? '',
      fecha_fin:                     inicial.fecha_fin?.slice(0, 10)      ?? '',
      fecha_limite_edicion_horarios: inicial.fecha_limite_edicion_horarios?.slice(0, 10) ?? '',
      estado:                        inicial.estado                        ?? 'planificacion',
    })
  }, [inicial.id_periodo_academico]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'fecha_inicio' || name === 'fecha_fin') setErrorFechas('')
  }

  // Vista previa del nombre que construirá el backend
  const anioPreview = form.fecha_inicio
    ? new Date(form.fecha_inicio + 'T00:00:00').getFullYear()
    : null
  const nombrePreview = (form.nombre_base && anioPreview)
    ? `${form.nombre_base} ${anioPreview}`
    : (form.nombre_base || '—')

  // Tipo seleccionado (para mostrar el hint de ciclos)
  const tipoSel = TIPOS_SEMESTRE.find(t => t.value === form.nombre_base)

  async function onSubmit(e) {
    e.preventDefault()

    // numero_periodo calculado automáticamente desde nombre_base
    // Semestres Impares → 1 | Semestres Pares → 2
    const numeroPeriodo = NUMERO_PERIODO_MAP[form.nombre_base] ?? null

    // Validación cruzada de fechas — comparación directa de strings YYYY-MM-DD.
    // No usa new Date() para evitar el bug UTC: en zonas UTC-6 el string '2025-06-01'
    // se interpreta como medianoche UTC y retrocede al día anterior, causando que
    // fechas válidas se reporten erróneamente como invertidas.
    if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setErrorFechas('La fecha de fin debe ser igual o posterior a la fecha de inicio.')
      return
    }
    setErrorFechas('')

    setGuardando(true)
    await onGuardar({
      nombre_base:    form.nombre_base,
      numero_periodo: numeroPeriodo,
      fecha_inicio:   form.fecha_inicio,
      fecha_fin:      form.fecha_fin,
      estado:         form.estado,
      fecha_limite_edicion_horarios: form.fecha_limite_edicion_horarios || null,
    })
    setGuardando(false)
  }

  const campo = (id, label, req, children, hint = null) => (
    <div style={es.campo}>
      <label style={es.label} htmlFor={id}>
        {label}
        {req
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

      {/* ── Tipo de semestre ────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="nombre_base">
          Tipo de semestre <span style={es.req}>*</span>
        </label>
        <select
          id="nombre_base" name="nombre_base"
          value={form.nombre_base} onChange={onChange} disabled={guardando}
          style={{ ...es.input, ...(errores422.nombre_base ? es.inputErr : {}) }}
        >
          <option value="">— Selecciona el tipo de semestre —</option>
          {TIPOS_SEMESTRE.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {tipoSel && (
          <span style={es.hint}>
            Activa los ciclos <strong>{tipoSel.ciclos}</strong> del pensum en la generación de horarios.
          </span>
        )}
        {errores422.nombre_base && (
          <span style={es.errorMsg}>{errores422.nombre_base[0]}</span>
        )}
      </div>

      {/* Vista previa del nombre que guardará el backend */}
      <div style={es.preview}>
        <span style={es.previewLabel}>Nombre que se guardará:</span>
        <span style={{
          ...es.previewValor,
          color: (form.nombre_base && anioPreview) ? 'var(--color-primary)' : 'var(--color-text-muted)',
        }}>
          {nombrePreview}
        </span>
        {form.nombre_base && !anioPreview && (
          <span style={es.previewHint}>← ingresa la fecha de inicio para ver el año</span>
        )}
      </div>

      {/* ── numero_periodo se calcula automáticamente ──────── */}
      {/* Ya no hay select de "Semestre correspondiente" 1–12.   */}
      {/* El valor se deriva del tipo: Impares → 1 | Pares → 2.  */}
      {form.nombre_base && (
        <div style={es.numeroBadge}>
          <span style={es.numeroBadgeLabel}>Período académico:</span>
          <span style={es.numeroBadgeValor}>
            {NUMERO_PERIODO_MAP[form.nombre_base] === 1
              ? 'P1 — Semestres Impares'
              : 'P2 — Semestres Pares'}
          </span>
          <span style={es.numeroBadgeHint}>
            (calculado automáticamente)
          </span>
        </div>
      )}

      {/* ── Fechas ──────────────────────────────────────────── */}
      {errorFechas && (
        <div style={es.errorFechas} role="alert">{errorFechas}</div>
      )}
      <div style={es.fila2}>
        {campo('fecha_inicio', 'Fecha de inicio', true,
          <input
            id="fecha_inicio" name="fecha_inicio" type="date"
            value={form.fecha_inicio} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.fecha_inicio ? es.inputErr : {}) }}
          />,
          'El año del semestre se extrae automáticamente de esta fecha.'
        )}
        {campo('fecha_fin', 'Fecha de fin', true,
          <input
            id="fecha_fin" name="fecha_fin" type="date"
            value={form.fecha_fin} onChange={onChange} disabled={guardando}
            style={{ ...es.input, ...(errores422.fecha_fin ? es.inputErr : {}) }}
          />
        )}
      </div>

      {/* ── Fecha límite de edición ──────────────────────────── */}
      {campo('fecha_limite_edicion_horarios', 'Fecha límite edición de horarios', false,
        <input
          id="fecha_limite_edicion_horarios" name="fecha_limite_edicion_horarios"
          type="date" value={form.fecha_limite_edicion_horarios}
          onChange={onChange} disabled={guardando}
          style={{ ...es.input, ...(errores422.fecha_limite_edicion_horarios ? es.inputErr : {}) }}
        />,
        'Después de esta fecha no se podrán modificar los horarios del semestre.'
      )}

      {/* ── Estado ──────────────────────────────────────────── */}
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
          {esEdicion ? 'Guardar cambios' : 'Crear semestre'}
        </Button>
      </div>
    </form>
  )
}

const es = {
  errorFechas: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '8px 12px',
    fontSize: '13px', color: 'var(--color-error)', fontWeight: 500,
  },
  numeroBadge: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
    padding: '8px 12px', background: 'var(--color-primary-subtle)',
    border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)',
    marginTop: '-4px',
  },
  numeroBadgeLabel: { fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0 },
  numeroBadgeValor: { fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' },
  numeroBadgeHint:  { fontSize: '11.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' },
  form:   { display: 'flex', flexDirection: 'column', gap: '16px' },
  fila2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  campo:  { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:    { color: 'var(--color-error)' },
  opc:    { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  hint:   { fontSize: '11.5px', color: 'var(--color-text-muted)', lineHeight: 1.4 },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  preview: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', background: 'var(--color-bg)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    flexWrap: 'wrap', marginTop: '-8px',
  },
  previewLabel: { fontSize: '12px', color: 'var(--color-text-muted)', flexShrink: 0 },
  previewValor: { fontSize: '13.5px', fontWeight: 700 },
  previewHint:  { fontSize: '11.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
