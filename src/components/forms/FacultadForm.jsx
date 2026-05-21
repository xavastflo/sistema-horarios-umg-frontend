import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import { getCentros } from '../../api/centros'

/**
 * FacultadForm
 *
 * Formulario de crear/editar facultades.
 * QA: incluye selector obligatorio de Sede (id_centro_educativo).
 *
 * Props:
 *   inicial    {object}   Valores iniciales para edición
 *   onGuardar  {function} (datos) => Promise
 *   onCancelar {function}
 *   errores422 {object}   Mapa campo → [mensajes]
 */
export default function FacultadForm({ inicial = {}, onGuardar, onCancelar, errores422 = {} }) {
  const [form, setForm] = useState({
    id_centro_educativo: inicial.id_centro_educativo ?? '',
    nombre_facultad:     inicial.nombre_facultad     ?? '',
    codigo_facultad:     inicial.codigo_facultad     ?? '',
    descripcion:         inicial.descripcion          ?? '',
  })
  const [guardando, setGuardando] = useState(false)

  // ── Catálogo de sedes ──────────────────────────────────────
  const [centros,       setCentros]       = useState([])
  const [cargandoCent,  setCargandoCent]  = useState(true)
  const [errorCentros,  setErrorCentros]  = useState(null)

  useEffect(() => {
    getCentros({ estado: 'activo' })
      .then(data => setCentros(data))
      .catch(() => setErrorCentros('No se pudieron cargar las sedes.'))
      .finally(() => setCargandoCent(false))
  }, [])

  // Sincronizar valores al abrir edición distinta
  useEffect(() => {
    setForm({
      id_centro_educativo: inicial.id_centro_educativo ?? '',
      nombre_facultad:     inicial.nombre_facultad     ?? '',
      codigo_facultad:     inicial.codigo_facultad     ?? '',
      descripcion:         inicial.descripcion          ?? '',
    })
  }, [inicial.id_facultad]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      id_centro_educativo: Number(form.id_centro_educativo),
      nombre_facultad:     form.nombre_facultad.trim(),
      ...(form.codigo_facultad.trim()
        ? { codigo_facultad: form.codigo_facultad.trim().toUpperCase() }
        : { codigo_facultad: null }),
      ...(form.descripcion.trim()
        ? { descripcion: form.descripcion.trim() }
        : { descripcion: null }),
    }
    await onGuardar(payload)
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* ── Sede (id_centro_educativo) — obligatoria ────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="id_centro_educativo">
          Sede <span style={es.req}>*</span>
        </label>

        {cargandoCent && <p style={es.hint}>Cargando sedes…</p>}
        {errorCentros && <p style={es.errorMsg}>{errorCentros}</p>}

        {!cargandoCent && !errorCentros && (
          <select
            id="id_centro_educativo"
            name="id_centro_educativo"
            value={form.id_centro_educativo}
            onChange={onChange}
            disabled={guardando}
            style={{
              ...es.input,
              ...(errores422.id_centro_educativo ? es.inputError : {}),
            }}
          >
            <option value="">— Selecciona la sede —</option>
            {centros.map(c => (
              <option key={c.id_centro_educativo} value={c.id_centro_educativo}>
                {c.nombre}
                {c.codigo_sede ? ` (${c.codigo_sede})` : ''}
              </option>
            ))}
          </select>
        )}

        {errores422.id_centro_educativo && (
          <span style={es.errorMsg}>{errores422.id_centro_educativo[0]}</span>
        )}
      </div>

      {/* ── Nombre ─────────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="nombre_facultad">
          Nombre de la facultad <span style={es.req}>*</span>
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
          style={{ ...es.input, ...(errores422.nombre_facultad ? es.inputError : {}) }}
        />
        {errores422.nombre_facultad && (
          <span style={es.errorMsg}>{errores422.nombre_facultad[0]}</span>
        )}
      </div>

      {/* ── Código ─────────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="codigo_facultad">
          Código <span style={es.opc}>(opcional)</span>
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
          style={{ ...es.input, ...(errores422.codigo_facultad ? es.inputError : {}) }}
        />
        {errores422.codigo_facultad && (
          <span style={es.errorMsg}>{errores422.codigo_facultad[0]}</span>
        )}
        <span style={es.hint}>
          La unicidad del código es por sede — dos sedes pueden tener el mismo código.
        </span>
      </div>

      {/* ── Descripción ────────────────────────────────────── */}
      <div style={es.campo}>
        <label style={es.label} htmlFor="descripcion">
          Descripción <span style={es.opc}>(opcional)</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          maxLength={200}
          rows={2}
          value={form.descripcion}
          onChange={onChange}
          placeholder="Descripción breve de la facultad"
          disabled={guardando}
          style={{ ...es.input, resize: 'vertical', minHeight: '60px' }}
        />
      </div>

      {/* ── Acciones ───────────────────────────────────────── */}
      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variante="primary"
          type="submit"
          cargando={guardando}
          disabled={cargandoCent || guardando}
        >
          {inicial.id_facultad ? 'Guardar cambios' : 'Crear facultad'}
        </Button>
      </div>
    </form>
  )
}

const es = {
  form:       { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo:      { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:      { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:        { color: 'var(--color-error)' },
  opc:        { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  hint:       { fontSize: '11.5px', color: 'var(--color-text-muted)' },
  input: {
    padding:      '9px 12px',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '14px',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    fontFamily:   'var(--font-sans)',
    outline:      'none',
    width:        '100%',
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
