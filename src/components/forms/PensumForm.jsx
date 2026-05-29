import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * PensumForm
 *
 * Formulario para crear y editar pensums.
 * En edición: id_carrera se muestra como solo lectura —
 * el backend no lo acepta en PUT.
 *
 * REFACTOR: ya no usa id_periodo_academico.
 * La vigencia se define por anio_inicio_vigencia / anio_fin_vigencia.
 *
 * Props:
 *   inicial      {object}   Valores iniciales para edición
 *   carreras     {array}    Lista de carreras activas para el select de crear
 *   onGuardar    {function} (datos) => Promise
 *   onCancelar   {function}
 *   errores422   {object}   Mapa campo → [mensajes]
 */
export default function PensumForm({
  inicial    = {},
  carreras   = [],
  onGuardar,
  onCancelar,
  errores422 = {},
}) {
  const esEdicion = Boolean(inicial.id_pensum)

  const [form, setForm] = useState({
    id_carrera:           inicial.id_carrera           ?? '',
    anio_inicio_vigencia: inicial.anio_inicio_vigencia ?? '',
    anio_fin_vigencia:    inicial.anio_fin_vigencia    ?? '',
    nombre_pensum:        inicial.nombre_pensum        ?? '',
    codigo_pensum:        inicial.codigo_pensum        ?? '',
    descripcion:          inicial.descripcion          ?? '',
    estado:               inicial.estado               ?? 'activo',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setForm({
      id_carrera:           inicial.id_carrera           ?? '',
      anio_inicio_vigencia: inicial.anio_inicio_vigencia ?? '',
      anio_fin_vigencia:    inicial.anio_fin_vigencia    ?? '',
      nombre_pensum:        inicial.nombre_pensum        ?? '',
      codigo_pensum:        inicial.codigo_pensum        ?? '',
      descripcion:          inicial.descripcion          ?? '',
      estado:               inicial.estado               ?? 'activo',
    })
  }, [inicial.id_pensum]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)

    let payload
    if (esEdicion) {
      // PUT solo acepta estos campos — no enviar id_carrera
      payload = {
        nombre_pensum:        form.nombre_pensum.trim(),
        codigo_pensum:        form.codigo_pensum.trim().toUpperCase(),
        estado:               form.estado,
        anio_inicio_vigencia: form.anio_inicio_vigencia ? Number(form.anio_inicio_vigencia) : null,
        anio_fin_vigencia:    form.anio_fin_vigencia    ? Number(form.anio_fin_vigencia)    : null,
        ...(form.descripcion.trim() ? { descripcion: form.descripcion.trim() } : { descripcion: null }),
      }
    } else {
      payload = {
        id_carrera:           Number(form.id_carrera),
        anio_inicio_vigencia: Number(form.anio_inicio_vigencia),
        anio_fin_vigencia:    form.anio_fin_vigencia ? Number(form.anio_fin_vigencia) : null,
        nombre_pensum:        form.nombre_pensum.trim(),
        codigo_pensum:        form.codigo_pensum.trim().toUpperCase(),
        ...(form.descripcion.trim() ? { descripcion: form.descripcion.trim() } : {}),
      }
    }

    await onGuardar(payload)
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      {/* Carrera — solo en creación */}
      {!esEdicion ? (
        <Campo id="id_carrera" label="Carrera" req errores422={errores422}>
          <select
            id="id_carrera" name="id_carrera"
            value={form.id_carrera} onChange={onChange}
            disabled={guardando}
            style={{ ...es.input, ...(errores422.id_carrera ? es.inputErr : {}) }}
          >
            <option value="">— Selecciona una carrera —</option>
            {carreras.map(c => (
              <option key={c.id_carrera} value={c.id_carrera}>
                {c.nombre_carrera}{c.codigo_carrera ? ` (${c.codigo_carrera})` : ''}
              </option>
            ))}
          </select>
        </Campo>
      ) : (
        <CampoLectura
          label="Carrera"
          valor={inicial.carrera?.nombre_carrera ?? `ID ${inicial.id_carrera}`}
        />
      )}

      {/* Período — eliminado. Vigencia reemplaza esa relación. */}

      {/* Año inicio de vigencia */}
      <Campo id="anio_inicio_vigencia" label="Año de inicio de vigencia" req errores422={errores422}>
        <input
          id="anio_inicio_vigencia" name="anio_inicio_vigencia" type="number"
          min={2000} max={2100} value={form.anio_inicio_vigencia} onChange={onChange}
          placeholder="Ej: 2014"
          disabled={guardando}
          style={{ ...es.input, ...(errores422.anio_inicio_vigencia ? es.inputErr : {}) }}
        />
      </Campo>

      {/* Año fin de vigencia */}
      <Campo id="anio_fin_vigencia" label="Año de fin de vigencia" errores422={errores422}>
        <input
          id="anio_fin_vigencia" name="anio_fin_vigencia" type="number"
          min={2000} max={2100} value={form.anio_fin_vigencia} onChange={onChange}
          placeholder="Dejar vacío si sigue vigente"
          disabled={guardando}
          style={{ ...es.input, ...(errores422.anio_fin_vigencia ? es.inputErr : {}) }}
        />
      </Campo>

      {/* Nombre */}
      <Campo id="nombre_pensum" label="Nombre del pensum" req errores422={errores422}>
        <input
          id="nombre_pensum" name="nombre_pensum" type="text"
          maxLength={120} value={form.nombre_pensum} onChange={onChange}
          placeholder="Ej: Pensum 2024 Ingeniería en Sistemas"
          disabled={guardando}
          style={{ ...es.input, ...(errores422.nombre_pensum ? es.inputErr : {}) }}
        />
      </Campo>

      {/* Código */}
      <Campo id="codigo_pensum" label="Código" req errores422={errores422}>
        <input
          id="codigo_pensum" name="codigo_pensum" type="text"
          maxLength={20} value={form.codigo_pensum} onChange={onChange}
          placeholder="Ej: INGSIST-2024-1 (se convierte a mayúsculas)"
          disabled={guardando}
          style={{ ...es.input, fontFamily: 'var(--font-mono)', ...(errores422.codigo_pensum ? es.inputErr : {}) }}
        />
      </Campo>

      {/* Descripción */}
      <Campo id="descripcion" label="Descripción" errores422={errores422}>
        <textarea
          id="descripcion" name="descripcion"
          maxLength={200} rows={2} value={form.descripcion} onChange={onChange}
          placeholder="Descripción opcional del pensum"
          disabled={guardando}
          style={{ ...es.input, resize: 'vertical', minHeight: '60px' }}
        />
      </Campo>

      {/* Estado — solo en edición */}
      {esEdicion && (
        <Campo id="estado" label="Estado" req errores422={errores422}>
          <select
            id="estado" name="estado"
            value={form.estado} onChange={onChange}
            disabled={guardando}
            style={{ ...es.input, ...(errores422.estado ? es.inputErr : {}) }}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Campo>
      )}

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {esEdicion ? 'Guardar cambios' : 'Crear pensum'}
        </Button>
      </div>
    </form>
  )
}

/** Campo con label, slot de input y mensajes de error */
function Campo({ id, label, req = false, errores422 = {}, children }) {
  return (
    <div style={es.campo}>
      <label style={es.label} htmlFor={id}>
        {label}
        {req
          ? <span style={es.req}> *</span>
          : <span style={es.opc}> (opcional)</span>}
      </label>
      {children}
      {errores422[id] && <span style={es.errorMsg}>{errores422[id][0]}</span>}
    </div>
  )
}

/** Campo de solo lectura con el valor del objeto relacionado */
function CampoLectura({ label, valor }) {
  return (
    <div style={es.campo}>
      <label style={es.label}>{label}</label>
      <div style={es.lectura}>{valor}</div>
      <span style={es.lecturaHint}>No editable — fijado al crear el pensum.</span>
    </div>
  )
}

const es = {
  form:    { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo:   { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:   { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  req:     { color: 'var(--color-error)' },
  opc:     { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr:    { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg:    { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  lectura: {
    padding: '9px 12px', background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500,
  },
  lecturaHint: { fontSize: '11px', color: 'var(--color-text-muted)' },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
