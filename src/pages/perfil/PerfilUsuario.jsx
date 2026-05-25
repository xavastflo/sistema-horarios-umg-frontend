import PageHeader      from '../../components/ui/PageHeader'
import Card            from '../../components/ui/Card'
import Badge           from '../../components/ui/Badge'
import CambiarPassword from '../../components/forms/CambiarPassword'
import { useAuth }     from '../../context/AuthContext'

/**
 * PerfilUsuario
 *
 * Vista unificada de perfil accesible para todos los roles.
 * Ruta: /perfil
 *
 * Sección A — Información personal (solo lectura)
 *   Datos del usuario autenticado desde AuthContext.
 *   No permite edición: modificaciones van por Control Académico.
 *
 * Sección B — Seguridad de la cuenta
 *   Formulario de cambio de contraseña (CambiarPassword).
 */
export default function PerfilUsuario() {
  const { usuario, perfilActivo, roles } = useAuth()

  const nombreCompleto = [usuario?.nombres, usuario?.apellidos]
    .filter(Boolean).join(' ').trim() || usuario?.nombre_usuario || '—'

  const rolesActivos = roles?.map(r => r.nombre_rol) ?? []

  return (
    <div className="fade-in">
      <PageHeader
        titulo="Mi perfil"
        descripcion="Información de tu cuenta y configuración de seguridad."
      />

      <div style={es.layout}>

        {/* ── Sección A: Información personal ────────────────── */}
        <Card>
          <div style={es.seccionHeader}>
            <h2 style={es.seccionTitulo}>Información personal</h2>
            <Badge texto="Solo lectura" variante="neutral" />
          </div>

          <div style={es.grid}>
            <CampoLectura label="Nombres"         valor={usuario?.nombres    ?? '—'} />
            <CampoLectura label="Apellidos"        valor={usuario?.apellidos  ?? '—'} />
            <CampoLectura label="Nombre de usuario"
              valor={usuario?.nombre_usuario ?? '—'}
              mono
            />
            <CampoLectura label="Correo electrónico"
              valor={usuario?.correo_electronico ?? '—'}
            />
            <CampoLectura label="Teléfono"
              valor={usuario?.telefono ?? 'No registrado'}
            />
            <CampoLectura label="Estado"
              valor={usuario?.estado ?? '—'}
              estado={usuario?.estado}
            />
          </div>

          {/* Roles */}
          <div style={es.rolesBloque}>
            <span style={es.campoLabel}>Roles asignados</span>
            <div style={es.rolesChips}>
              {rolesActivos.length > 0
                ? rolesActivos.map(r => (
                    <Badge
                      key={r}
                      texto={r}
                      variante={r === perfilActivo ? 'primary' : 'neutral'}
                      dot={r === perfilActivo}
                    />
                  ))
                : <span style={es.campoValor}>Sin roles</span>
              }
              {perfilActivo && (
                <span style={es.perfilActivo}>Perfil activo: {perfilActivo}</span>
              )}
            </div>
          </div>

          {/* Aviso informativo */}
          <div style={es.aviso}>
            <span style={es.avisoIcono}>ℹ️</span>
            <p style={es.avisoTexto}>
              Para modificar sus datos personales, por favor contacte al departamento
              de <strong>Control Académico</strong> o al <strong>Administrador del Sistema</strong>.
            </p>
          </div>
        </Card>

        {/* ── Sección B: Seguridad ────────────────────────────── */}
        <div>
          <div style={es.seccionHeader}>
            <h2 style={es.seccionTituloExt}>Seguridad de la cuenta</h2>
          </div>
          <CambiarPassword />
        </div>

      </div>
    </div>
  )
}

/* ── Subcomponente: campo de solo lectura ──────────────────────────── */
function CampoLectura({ label, valor, mono = false, estado = null }) {
  const colorEstado = estado === 'activo'    ? 'var(--color-success)'
                    : estado === 'bloqueado' ? 'var(--color-error)'
                    : estado === 'inactivo'  ? 'var(--color-text-muted)'
                    : null

  return (
    <div style={es.campo}>
      <span style={es.campoLabel}>{label}</span>
      <div style={{
        ...es.campoInput,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        ...(colorEstado ? { color: colorEstado, fontWeight: 600 } : {}),
      }}>
        {valor}
      </div>
    </div>
  )
}

/* ── Estilos ─────────────────────────────────────────────────────── */
const es = {
  layout: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '24px',
    alignItems:          'start',
  },
  seccionHeader: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    marginBottom:   '20px',
  },
  seccionTitulo: {
    fontSize:   '15px',
    fontWeight: 700,
    color:      'var(--color-text)',
    margin:     0,
  },
  seccionTituloExt: {
    fontSize:     '15px',
    fontWeight:   700,
    color:        'var(--color-text)',
    margin:       '0 0 12px',
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '14px',
    marginBottom:        '20px',
  },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  campoLabel: {
    fontSize:   '11.5px',
    fontWeight: 700,
    color:      'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
  },
  campoInput: {
    padding:      '8px 12px',
    background:   'var(--color-bg)',
    border:       '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize:     '13.5px',
    color:        'var(--color-text)',
    minHeight:    '38px',
    display:      'flex',
    alignItems:   'center',
  },
  campoValor: { fontSize: '13.5px', color: 'var(--color-text-secondary)' },
  rolesBloque:  { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  rolesChips:   { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  perfilActivo: {
    fontSize:    '11.5px',
    color:       'var(--color-text-muted)',
    fontStyle:   'italic',
    marginLeft:  '4px',
  },
  aviso: {
    display:      'flex',
    gap:          '10px',
    padding:      '12px 14px',
    background:   '#f0f9ff',
    border:       '1px solid #bae6fd',
    borderRadius: 'var(--radius-md)',
  },
  avisoIcono: { fontSize: '16px', flexShrink: 0, lineHeight: '1.5' },
  avisoTexto: {
    fontSize:   '12.5px',
    color:      '#0c4a6e',
    margin:     0,
    lineHeight: 1.55,
  },
}
