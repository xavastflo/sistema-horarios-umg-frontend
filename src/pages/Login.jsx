import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { rutaDashboard } from '../components/ProtectedRoute'
import logoUMG from '../assets/logo-umg.png';

export default function Login() {
  const { iniciarSesion, token, perfilActivo, cargando } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [form,      setForm]      = useState({ nombre_usuario: '', password: '' })
  const [enviando,  setEnviando]  = useState(false)
  const [error,     setError]     = useState(null)
  const [verPass,   setVerPass]   = useState(false)

  // Si ya está autenticado, redirigir a su dashboard
  useEffect(() => {
    if (!cargando && token && perfilActivo) {
      const destino = location.state?.from?.pathname ?? rutaDashboard(perfilActivo)
      navigate(destino, { replace: true })
    }
  }, [cargando, token, perfilActivo, navigate, location])

  function onChange(e) {
    setError(null)
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.nombre_usuario.trim() || !form.password) {
      setError('Ingrese usuario y contraseña.')
      return
    }
    setEnviando(true)
    setError(null)
    const resultado = await iniciarSesion(form.nombre_usuario.trim(), form.password)
    if (!resultado.ok) {
      setError(resultado.error)
    }
    // Si fue exitoso, el useEffect de arriba redirige automáticamente
    setEnviando(false)
  }

  const [verRecuperar, setVerRecuperar] = useState(false)

  if (cargando) return null // esperar rehidratación antes de mostrar login

  return (
<div style={estilos.pagina}>
      {/* Panel izquierdo decorativo */}
      <div style={estilos.panelIzq}>
        <div style={estilos.panelContenido}>
          
          {/* REEMPLAZO AQUÍ: Cambiamos la H por la imagen */}
          <div style={estilos.logoBig}>
            <img 
                src={logoUMG} 
                alt="Logo UMG" 
                style={{ 
                  height: '110px', 
                  width: 'auto', 
                  objectFit: 'contain', 
                  margin: '0 auto',
                  // Quitamos mixBlendMode para que no arruine los colores
                }} 
              />
          </div>

          <h1 style={estilos.titulo}>Sistema de<br />Horarios</h1>
          <p style={estilos.subtitulo}>Universidad Mariano Gálvez</p>
          <div style={estilos.decorLinea} />
          <p style={estilos.decorTexto}>
            Gestión integral de horarios académicos<br />
            para docentes, coordinadores y estudiantes.
          </p>
        </div>
        {/* Fondo geométrico */}
        <div style={estilos.bgCirculo1} />
        <div style={estilos.bgCirculo2} />
      </div>

      {/* Panel derecho — formulario */}
      <div style={estilos.panelDer}>
        <form onSubmit={onSubmit} style={estilos.form} noValidate>
          <div style={estilos.formHeader}>
            <h2 style={estilos.formTitulo}>Iniciar sesión</h2>
            <p style={estilos.formSub}>Ingresa tus credenciales para continuar</p>
          </div>

          {/* Campo usuario */}
          <div style={estilos.campo}>
            <label htmlFor="nombre_usuario" style={estilos.label}>
              Usuario
            </label>
            <input
              id="nombre_usuario"
              name="nombre_usuario"
              type="text"
              autoComplete="username"
              autoFocus
              value={form.nombre_usuario}
              onChange={onChange}
              placeholder="nombre_usuario"
              style={estilos.input}
              disabled={enviando}
            />
          </div>

          {/* Campo contraseña */}
          <div style={estilos.campo}>
            <label htmlFor="password" style={estilos.label}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={verPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
                style={{ ...estilos.input, paddingRight: '42px' }}
                disabled={enviando}
              />
              <button
                type="button"
                onClick={() => setVerPass(v => !v)}
                style={estilos.btnVerPass}
                tabIndex={-1}
                title={verPass ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {verPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div style={estilos.errorBox} role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Enlace recuperación */}
          <div style={{ textAlign: 'right', marginTop: '-10px' }}>
            <button
              type="button"
              onClick={() => setVerRecuperar(true)}
              style={estilos.btnRecuperar}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            disabled={enviando}
            style={{ ...estilos.btnSubmit, ...(enviando ? estilos.btnSubmitCargando : {}) }}
          >
            {enviando
              ? <><span className="spinner" /> Verificando…</>
              : 'Ingresar al sistema'
            }
          </button>
        </form>

        {/* Modal informativo de recuperación */}
        {verRecuperar && (
          <div style={estilos.modalOverlay} onClick={() => setVerRecuperar(false)}>
            <div style={estilos.modalBox} onClick={e => e.stopPropagation()}>
              <h3 style={estilos.modalTitulo}>¿Cómo recuperar tu contraseña?</h3>
              <p style={estilos.modalTexto}>
                Para recuperar el acceso a tu cuenta, comunícate con el
                <strong> administrador del sistema</strong> o con el
                coordinador de tu carrera.
              </p>
              <p style={estilos.modalTexto}>
                Proporciona tu nombre de usuario y correo electrónico
                para que puedan verificar tu identidad y restablecer tu contraseña.
              </p>
              <button
                type="button"
                onClick={() => setVerRecuperar(false)}
                style={estilos.modalBtnCerrar}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        <p style={estilos.footer}>
          UMG — Sistema de Horarios Universitarios
        </p>
      </div>
    </div>
  )
}

/* ── Estilos ────────────────────────────────────────────────────── */
const estilos = {
  pagina: {
    display:    'flex',
    height:     '100vh',
    overflow:   'hidden',
    background: 'var(--color-bg)',
  },

  // Panel izquierdo
  panelIzq: {
    position:       'relative',
    width:          '44%',
    background:     'var(--color-primary)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    flexShrink:     0,
  },
  panelContenido: { position: 'relative', zIndex: 1, padding: '40px', color: '#fff' },
  logoBig: {
    width:           '56px',
    height:          '56px',
    background:      'var(--color-accent)',
    borderRadius:    '14px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '28px',
    fontWeight:      800,
    color:           '#fff',
    marginBottom:    '24px',
    boxShadow:       '0 8px 24px rgba(217,119,6,.35)',
  },
  titulo: {
    fontSize:    '38px',
    fontWeight:  800,
    lineHeight:  1.15,
    letterSpacing: '-.02em',
    marginBottom: '8px',
  },
  subtitulo: {
    fontSize:  '14px',
    opacity:   .7,
    fontWeight: 500,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    marginBottom: '32px',
  },
  decorLinea: {
    width:        '40px',
    height:       '3px',
    background:   'var(--color-accent)',
    borderRadius: '2px',
    marginBottom: '20px',
  },
  decorTexto: {
    fontSize:   '14px',
    opacity:    .6,
    lineHeight: 1.7,
  },
  bgCirculo1: {
    position:     'absolute',
    width:        '320px',
    height:       '320px',
    border:       '1px solid rgba(255,255,255,.06)',
    borderRadius: '50%',
    right:        '-80px',
    top:          '-80px',
  },
  bgCirculo2: {
    position:     'absolute',
    width:        '400px',
    height:       '400px',
    border:       '1px solid rgba(255,255,255,.04)',
    borderRadius: '50%',
    right:        '-120px',
    bottom:       '-120px',
  },

  // Panel derecho — formulario
  panelDer: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '40px 32px',
    background:     'var(--color-surface)',
  },
  form: {
    width:     '100%',
    maxWidth:  '380px',
    display:   'flex',
    flexDirection: 'column',
    gap:       '20px',
  },
  formHeader: { marginBottom: '4px' },
  formTitulo: {
    fontSize:    '24px',
    fontWeight:  700,
    color:       'var(--color-text)',
    letterSpacing: '-.02em',
    marginBottom: '4px',
  },
  formSub: { fontSize: '13.5px', color: 'var(--color-text-secondary)' },

  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize:   '13px',
    fontWeight: 600,
    color:      'var(--color-text-secondary)',
    letterSpacing: '.01em',
  },
  input: {
    padding:      '10px 13px',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '14px',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    outline:      'none',
    transition:   'border-color .15s, box-shadow .15s',
    width:        '100%',
  },
  btnVerPass: {
    position:   'absolute',
    right:      '10px',
    top:        '50%',
    transform:  'translateY(-50%)',
    background: 'transparent',
    border:     'none',
    fontSize:   '16px',
    lineHeight: 1,
    cursor:     'pointer',
    padding:    '2px',
  },

  errorBox: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    padding:      '10px 13px',
    fontSize:     '13.5px',
    color:        'var(--color-error)',
    fontWeight:   500,
  },

  btnSubmit: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    padding:        '12px',
    background:     'var(--color-primary)',
    color:          '#fff',
    border:         'none',
    borderRadius:   'var(--radius-md)',
    fontSize:       '14px',
    fontWeight:     600,
    cursor:         'pointer',
    transition:     'background .15s, transform .12s',
    letterSpacing:  '.01em',
  },
  btnSubmitCargando: {
    background:   'var(--color-primary-light)',
    cursor:       'wait',
  },

  footer: {
    marginTop:  '32px',
    fontSize:   '12px',
    color:      'var(--color-text-muted)',
    textAlign:  'center',
  },

  btnRecuperar: {
    background:  'transparent',
    border:      'none',
    fontSize:    '12.5px',
    color:       'var(--color-primary)',
    cursor:      'pointer',
    padding:     0,
    fontFamily:  'var(--font-sans)',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
  },

  modalOverlay: {
    position:        'fixed',
    inset:           0,
    background:      'rgba(0,0,0,0.45)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          200,
  },
  modalBox: {
    background:    'var(--color-surface)',
    borderRadius:  'var(--radius-lg)',
    padding:       '28px 32px',
    maxWidth:      '400px',
    width:         '90%',
    boxShadow:     '0 20px 60px rgba(0,0,0,0.25)',
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  modalTitulo: {
    fontSize:    '16px',
    fontWeight:  700,
    color:       'var(--color-text)',
    margin:      0,
  },
  modalTexto: {
    fontSize:   '13.5px',
    color:      'var(--color-text-secondary)',
    lineHeight: 1.6,
    margin:     0,
  },
  modalBtnCerrar: {
    alignSelf:     'flex-end',
    marginTop:     '4px',
    padding:       '8px 20px',
    background:    'var(--color-primary)',
    color:         '#fff',
    border:        'none',
    borderRadius:  'var(--radius-md)',
    fontSize:      '13.5px',
    fontWeight:    600,
    cursor:        'pointer',
    fontFamily:    'var(--font-sans)',
  },
}
