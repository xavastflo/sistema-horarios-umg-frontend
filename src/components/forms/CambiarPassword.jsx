import { useState } from 'react'
import Card   from '../ui/Card'
import Button from '../ui/Button'
import api    from '../../api/axios'

/**
 * CambiarPassword
 *
 * Formulario para que el usuario autenticado cambie su propia contraseña.
 * Consume: POST /api/auth/cambiar-password
 *
 * Body: { password_actual, password, password_confirmation }
 *
 * No requiere props — usa el token del usuario en sesión via Axios.
 */
export default function CambiarPassword() {
  const [form, setForm] = useState({
    password_actual:       '',
    password:              '',
    password_confirmation: '',
  })
  const [mostrar,    setMostrar]    = useState(false)  // toggle ver/ocultar
  const [guardando,  setGuardando]  = useState(false)
  const [errores422, setErrores422] = useState({})
  const [errorMsg,   setErrorMsg]   = useState(null)
  const [okMsg,      setOkMsg]      = useState(null)

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrores422(prev => ({ ...prev, [name]: undefined }))
    setErrorMsg(null)
    setOkMsg(null)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setErrores422({})
    setErrorMsg(null)
    setOkMsg(null)

    try {
      const { data } = await api.post('/auth/cambiar-password', {
        password_actual:       form.password_actual,
        password:              form.password,
        password_confirmation: form.password_confirmation,
      })
      setOkMsg(data.message ?? 'Contraseña actualizada correctamente.')
      setForm({ password_actual: '', password: '', password_confirmation: '' })
    } catch (err) {
      const status = err.response?.status
      if (status === 422) {
        setErrores422(err.response?.data?.errors ?? {})
        setErrorMsg(err.response?.data?.message ?? null)
      } else if (status === 403) {
        setErrorMsg('No tienes permisos para esta acción.')
      } else {
        setErrorMsg(err.response?.data?.message ?? 'Error al actualizar la contraseña.')
      }
    } finally {
      setGuardando(false)
    }
  }

  const tipoInput = mostrar ? 'text' : 'password'

  function Campo({ id, label, placeholder = '' }) {
    return (
      <div style={es.campo}>
        <label htmlFor={id} style={es.label}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            id={id} name={id} type={tipoInput}
            value={form[id]} onChange={onChange}
            placeholder={placeholder}
            disabled={guardando}
            style={{ ...es.input, paddingRight: '40px', ...(errores422[id] ? es.inputErr : {}) }}
          />
          {/* Toggle solo en el primer campo para no saturar la UI */}
          {id === 'password_actual' && (
            <button
              type="button" tabIndex={-1}
              onClick={() => setMostrar(v => !v)}
              style={es.btnOjo}
              title={mostrar ? 'Ocultar contraseñas' : 'Ver contraseñas'}
            >
              {mostrar ? '🙈' : '👁️'}
            </button>
          )}
        </div>
        {errores422[id] && (
          <span style={es.errorMsg}>{errores422[id][0]}</span>
        )}
      </div>
    )
  }

  return (
    <Card>
      <div style={es.header}>
        <h2 style={es.titulo}>Cambiar contraseña</h2>
        <p style={es.subtitulo}>
          Ingresa tu contraseña actual y luego escribe la nueva dos veces para confirmarla.
        </p>
      </div>

      {okMsg && (
        <div style={es.alertaOk} role="status">✓ {okMsg}</div>
      )}
      {errorMsg && !Object.keys(errores422).length && (
        <div style={es.alertaError} role="alert">{errorMsg}</div>
      )}

      <form onSubmit={onSubmit} noValidate style={es.form}>
        <Campo
          id="password_actual"
          label="Contraseña actual"
          placeholder="Tu contraseña vigente"
        />
        <Campo
          id="password"
          label="Nueva contraseña"
          placeholder="Mín. 8 caracteres"
        />
        <Campo
          id="password_confirmation"
          label="Confirmar nueva contraseña"
          placeholder="Repite la nueva contraseña"
        />

        <div style={es.acciones}>
          <Button variante="primary" type="submit" cargando={guardando}>
            Actualizar contraseña
          </Button>
        </div>
      </form>
    </Card>
  )
}

const es = {
  header:    { marginBottom: '20px' },
  titulo:    { fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' },
  subtitulo: { fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 },

  alertaOk: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: '#166534', fontWeight: 500, marginBottom: '16px',
  },
  alertaError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)', padding: '10px 14px',
    fontSize: '13.5px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '16px',
  },

  form:      { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo:     { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:     { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' },
  input: {
    padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--color-text)',
    background: 'var(--color-surface)', fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%', transition: 'border-color .15s',
  },
  inputErr: { borderColor: 'var(--color-error)', background: '#fff8f8' },
  errorMsg: { fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 },
  btnOjo: {
    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', fontSize: '16px',
    lineHeight: 1, cursor: 'pointer', padding: '2px',
  },
  acciones: {
    display: 'flex', justifyContent: 'flex-end',
    paddingTop: '4px', borderTop: '1px solid var(--color-border)', marginTop: '4px',
  },
}
