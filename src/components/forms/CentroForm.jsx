import { useState, useEffect } from 'react'
import Button from '../ui/Button'

/**
 * CentroForm — crear y editar centros educativos (sedes).
 * Puramente presentacional: sin fetch, sin efectos de datos.
 */
export default function CentroForm({ inicial = {}, onGuardar, onCancelar, errores422 = {} }) {
  const [form, setForm] = useState({
    nombre:      inicial.nombre      ?? '',
    codigo_sede: inicial.codigo_sede ?? '',
    direccion:   inicial.direccion   ?? '',
    estado:      inicial.estado      ?? 'activo',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setForm({
      nombre:      inicial.nombre      ?? '',
      codigo_sede: inicial.codigo_sede ?? '',
      direccion:   inicial.direccion   ?? '',
      estado:      inicial.estado      ?? 'activo',
    })
  }, [inicial.id_centro_educativo]) // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    await onGuardar({
      nombre:      form.nombre.trim(),
      codigo_sede: form.codigo_sede.trim().toUpperCase() || null,
      direccion:   form.direccion.trim()   || null,
      estado:      form.estado,
    })
    setGuardando(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate style={es.form}>

      <div style={es.campo}>
        <label style={es.label} htmlFor="nombre">
          Nombre de la sede <span style={es.req}>*</span>
        </label>
        <input id="nombre" name="nombre" type="text" maxLength={150}
          value={form.nombre} onChange={onChange} disabled={guardando}
          placeholder="Ej: Sede Central - Campus Central"
          style={{ ...es.input, ...(errores422.nombre ? es.err : {}) }} />
        {errores422.nombre && <span style={es.errMsg}>{errores422.nombre[0]}</span>}
      </div>

      <div style={es.fila2}>
        <div style={es.campo}>
          <label style={es.label} htmlFor="codigo_sede">
            Código <span style={es.opc}>(opcional)</span>
          </label>
          <input id="codigo_sede" name="codigo_sede" type="text" maxLength={20}
            value={form.codigo_sede} onChange={onChange} disabled={guardando}
            placeholder="Ej: CENTRAL"
            style={{ ...es.input, fontFamily: 'var(--font-mono)', ...(errores422.codigo_sede ? es.err : {}) }} />
          {errores422.codigo_sede && <span style={es.errMsg}>{errores422.codigo_sede[0]}</span>}
        </div>

        {inicial.id_centro_educativo && (
          <div style={es.campo}>
            <label style={es.label} htmlFor="estado">Estado <span style={es.req}>*</span></label>
            <select id="estado" name="estado" value={form.estado} onChange={onChange}
              disabled={guardando}
              style={{ ...es.input, ...(errores422.estado ? es.err : {}) }}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        )}
      </div>

      <div style={es.campo}>
        <label style={es.label} htmlFor="direccion">
          Dirección <span style={es.opc}>(opcional)</span>
        </label>
        <textarea id="direccion" name="direccion" maxLength={255} rows={2}
          value={form.direccion} onChange={onChange} disabled={guardando}
          placeholder="Dirección completa de la sede"
          style={{ ...es.input, resize: 'vertical', minHeight: '60px' }} />
      </div>

      <div style={es.acciones}>
        <Button variante="ghost" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variante="primary" type="submit" cargando={guardando}>
          {inicial.id_centro_educativo ? 'Guardar cambios' : 'Crear sede'}
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
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  err:     { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errMsg:  { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  acciones: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
