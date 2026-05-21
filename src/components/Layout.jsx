import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { rutaDashboard } from './ProtectedRoute'

/** Iconos SVG inline — sin dependencia de librería */
const IconDashboard   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const IconLogout      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconSwitch      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
const IconChevron     = ({ up }) => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
const IconMenu        = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>

const IconAcademico  = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
const IconUsuarios   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconDocente    = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconDisponib   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconSecciones  = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const IconAsignacion = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconHorario    = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>
const IconReportes   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
const IconCarreras   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IconMiHorario  = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconBell       = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const IconPublicado  = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

/**
 * MENU_POR_ROL
 * Define los ítems del sidebar para cada perfil activo.
 * path: ruta real si el módulo existe, o '/pendiente' con state.modulo para los pendientes.
 * Los paths de módulos pendientes no requieren rutas individuales en App.jsx.
 */
const MENU_POR_ROL = {
  administrador: [
    { label: 'Dashboard',           path: '/admin/dashboard',  Icono: IconDashboard  },
    { label: 'Gestión académica',   path: '/pendiente',        Icono: IconAcademico,  modulo: 'Gestión académica'  },
    { label: 'Sedes',               path: '/admin/centros-educativos', Icono: IconAcademico                        },
    { label: 'Facultades',          path: '/admin/facultades', Icono: IconAcademico                                },
    { label: 'Carreras',            path: '/admin/carreras',   Icono: IconCarreras                                 },
    { label: 'Jornadas por carrera',path: '/admin/carrera-jornadas', Icono: IconDisponib                           },
    { label: 'Bloques horarios',    path: '/admin/bloques-horarios', Icono: IconHorario                            },
    { label: 'Períodos académicos', path: '/admin/periodos-academicos', Icono: IconDisponib                        },
    { label: 'Pensum',              path: '/admin/pensum',              Icono: IconAcademico                       },
    { label: 'Cursos',              path: '/admin/cursos',              Icono: IconSecciones                       },
    { label: 'Cursos por pensum',   path: '/admin/pensum-cursos',       Icono: IconAcademico                       },
    { label: 'Usuarios',            path: '/admin/usuarios',   Icono: IconUsuarios                                 },
    { label: 'Docentes',            path: '/admin/docentes',   Icono: IconDocente                                  },
    { label: 'Disponibilidad',      path: '/admin/disponibilidad-docente', Icono: IconDisponib              },
    { label: 'Secciones',           path: '/admin/secciones',  Icono: IconSecciones                                },
    { label: 'Asignación docente',  path: '/admin/asignacion-docente', Icono: IconAsignacion                      },
    { label: 'Horarios',            path: '/admin/horarios',   Icono: IconHorario                                  },
    { label: 'Reportes',            path: '/admin/reportes',   Icono: IconReportes                                 },
    { label: 'Notificaciones',      path: '/admin/notificaciones', Icono: IconBell                                 },
  ],
  coordinador: [
    { label: 'Dashboard',           path: '/coordinador/dashboard', Icono: IconDashboard  },
    { label: 'Mis carreras',        path: '/pendiente',             Icono: IconCarreras,   modulo: 'Mis carreras'           },
    { label: 'Jornadas por carrera',path: '/admin/carrera-jornadas', Icono: IconDisponib                                    },
    { label: 'Bloques horarios',    path: '/admin/bloques-horarios', Icono: IconHorario                                     },
    { label: 'Períodos académicos', path: '/admin/periodos-academicos', Icono: IconDisponib                                  },
    { label: 'Pensum',              path: '/admin/pensum',              Icono: IconAcademico                                 },
    { label: 'Cursos',              path: '/admin/cursos',              Icono: IconSecciones                                 },
    { label: 'Cursos por pensum',   path: '/admin/pensum-cursos',       Icono: IconAcademico                                 },
    { label: 'Docentes',            path: '/admin/docentes',        Icono: IconDocente                                       },
    { label: 'Disponibilidad',      path: '/admin/disponibilidad-docente', Icono: IconDisponib                                },
    { label: 'Secciones',           path: '/admin/secciones',        Icono: IconSecciones                                    },
    { label: 'Asignación docente',  path: '/admin/asignacion-docente', Icono: IconAsignacion                               },
    { label: 'Generar horario',     path: '/admin/horarios',         Icono: IconHorario                                       },
    { label: 'Editar horario',      path: '/pendiente',             Icono: IconAcademico,  modulo: 'Edición de horarios'    },
    { label: 'Horarios por carrera',path: '/admin/horarios',         Icono: IconHorario                                       },
    { label: 'Reportes',            path: '/admin/reportes',        Icono: IconReportes                                      },
    { label: 'Notificaciones',      path: '/admin/notificaciones',  Icono: IconBell                                          },
  ],
  docente: [
    { label: 'Dashboard',           path: '/docente/dashboard', Icono: IconDashboard },
    { label: 'Mi horario',          path: '/pendiente',         Icono: IconMiHorario, modulo: 'Mi horario'         },
    { label: 'Mi disponibilidad',   path: '/admin/disponibilidad-docente', Icono: IconDisponib                      },
    { label: 'Mis notificaciones',   path: '/admin/notificaciones',          Icono: IconBell                          },
  ],
  estudiante: [
    { label: 'Dashboard',           path: '/estudiante/dashboard', Icono: IconDashboard },
    { label: 'Horarios publicados', path: '/pendiente',            Icono: IconPublicado, modulo: 'Horarios publicados' },
    { label: 'Mis notificaciones',   path: '/admin/notificaciones', Icono: IconBell                                     },
  ],
}

/** Color e inicial según rol */
const rolMeta = {
  administrador: { color: 'var(--color-role-admin)',      inicial: 'A', label: 'Administrador' },
  coordinador:   { color: 'var(--color-role-coord)',      inicial: 'C', label: 'Coordinador'   },
  docente:       { color: 'var(--color-role-docente)',    inicial: 'D', label: 'Docente'        },
  estudiante:    { color: 'var(--color-role-estudiante)', inicial: 'E', label: 'Estudiante'     },
}

export default function Layout() {
  const { usuario, perfilActivo, roles, cerrarSesion, cambiarPerfil, tieneMultiplesRoles } = useAuth()
  const navigate  = useNavigate()

  const [menuRoles,      setMenuRoles]      = useState(false)
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [cerrando,       setCerrando]       = useState(false)

  const meta = rolMeta[perfilActivo] ?? { color: 'var(--color-primary)', inicial: '?', label: perfilActivo }

  // ── Cerrar sesión ────────────────────────────────────────────
  async function handleLogout() {
    setCerrando(true)
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  // ── Cambiar perfil activo ────────────────────────────────────
  async function handleCambiarPerfil(nombreRol) {
    setMenuRoles(false)
    const resultado = await cambiarPerfil(nombreRol)
    if (resultado.ok) {
      navigate(rutaDashboard(nombreRol), { replace: true })
    }
  }

  const nombreMostrar = usuario
    ? `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim() || usuario.nombre_usuario
    : ''

  return (
    <div style={estilos.root}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{ ...estilos.sidebar, width: sidebarAbierto ? 'var(--sidebar-width)' : '60px' }}>

        {/* Logo / nombre del sistema */}
        <div style={estilos.logoArea}>
          <div style={{ ...estilos.logoBadge, background: meta.color }}>
            <span style={estilos.logoLetra}>H</span>
          </div>
          {sidebarAbierto && (
            <div style={estilos.logoTexto}>
              <span style={estilos.logoNombre}>Horarios</span>
              <span style={estilos.logoSub}>UMG</span>
            </div>
          )}
        </div>

        {/* Navegación dinámica según perfilActivo */}
        <nav style={estilos.nav}>
          {(MENU_POR_ROL[perfilActivo] ?? []).map((item) => {
            const { label, path, Icono, modulo } = item
            // Ítems pendientes usan Link con state; ítems reales usan NavLink con isActive
            if (modulo) {
              return (
                <Link
                  key={label}
                  to={path}
                  state={{ modulo }}
                  style={estilos.navLink}
                >
                  <span style={estilos.navIcon}><Icono /></span>
                  {sidebarAbierto && <span>{label}</span>}
                </Link>
              )
            }
            return (
              <NavLink
                key={label}
                to={path}
                style={({ isActive }) => ({ ...estilos.navLink, ...(isActive ? estilos.navLinkActivo : {}) })}
              >
                <span style={estilos.navIcon}><Icono /></span>
                {sidebarAbierto && <span>{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Pie del sidebar */}
        <div style={estilos.sidebarPie}>
          <button
            onClick={handleLogout}
            disabled={cerrando}
            style={estilos.btnLogout}
            title="Cerrar sesión"
          >
            {cerrando
              ? <span className="spinner" />
              : <><span style={estilos.navIcon}><IconLogout /></span>{sidebarAbierto && <span>Salir</span>}</>
            }
          </button>
        </div>
      </aside>

      {/* ── Área principal ──────────────────────────────────── */}
      <div style={estilos.main}>

        {/* Topbar */}
        <header style={estilos.topbar}>

          {/* Botón toggle sidebar */}
          <button
            onClick={() => setSidebarAbierto(v => !v)}
            style={estilos.btnMenu}
            title={sidebarAbierto ? 'Colapsar menú' : 'Expandir menú'}
          >
            <IconMenu />
          </button>

          <div style={estilos.topbarDerecha}>

            {/* Selector de perfil + info de usuario */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => tieneMultiplesRoles() && setMenuRoles(v => !v)}
                style={estilos.btnUsuario}
                title={tieneMultiplesRoles() ? 'Cambiar perfil activo' : nombreMostrar}
              >
                {/* Avatar con inicial */}
                <div style={{ ...estilos.avatar, background: meta.color }}>
                  {(nombreMostrar[0] ?? meta.inicial).toUpperCase()}
                </div>
                <div style={estilos.usuarioInfo}>
                  <span style={estilos.usuarioNombre}>{nombreMostrar}</span>
                  <span style={{ ...estilos.usuarioPerfil, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                {tieneMultiplesRoles() && (
                  <span style={estilos.chevron}><IconChevron up={menuRoles} /></span>
                )}
              </button>

              {/* Dropdown de roles */}
              {menuRoles && (
                <div style={estilos.dropdown} className="fade-in">
                  <p style={estilos.dropdownTitulo}>Cambiar perfil</p>
                  {roles.map(r => {
                    const m = rolMeta[r.nombre_rol] ?? { color: 'var(--color-primary)', label: r.nombre_rol }
                    const esActivo = r.nombre_rol === perfilActivo
                    return (
                      <button
                        key={r.id_rol}
                        onClick={() => !esActivo && handleCambiarPerfil(r.nombre_rol)}
                        style={{
                          ...estilos.dropdownItem,
                          ...(esActivo ? estilos.dropdownItemActivo : {}),
                        }}
                      >
                        <span style={{ ...estilos.dropdownDot, background: m.color }} />
                        {m.label}
                        {esActivo && <span style={estilos.dropdownCheck}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Icono de cambio de perfil — solo si tiene múltiples roles */}
            {tieneMultiplesRoles() && (
              <button
                style={estilos.btnIcono}
                title="Cambiar perfil"
                onClick={() => setMenuRoles(v => !v)}
              >
                <IconSwitch />
              </button>
            )}

          </div>
        </header>

        {/* Contenido de la página */}
        <main style={estilos.contenido} className="fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ── Estilos ────────────────────────────────────────────────────── */
const estilos = {
  root: {
    display:   'flex',
    height:    '100vh',
    overflow:  'hidden',
    background: 'var(--color-bg)',
  },

  // Sidebar
  sidebar: {
    display:         'flex',
    flexDirection:   'column',
    background:      'var(--color-bg-sidebar)',
    color:           'var(--color-text-on-primary)',
    transition:      'width .22s ease',
    overflow:        'hidden',
    flexShrink:      0,
    boxShadow:       'var(--shadow-lg)',
    zIndex:          10,
  },
  logoArea: {
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    padding:     '18px 14px',
    borderBottom:'1px solid rgba(255,255,255,.08)',
  },
  logoBadge: {
    width:         '32px',
    height:        '32px',
    borderRadius:  'var(--radius-md)',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    flexShrink:    0,
  },
  logoLetra: { fontWeight: 700, fontSize: '16px', color: '#fff' },
  logoTexto: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  logoNombre: { fontWeight: 700, fontSize: '14px', letterSpacing: '-.01em' },
  logoSub:    { fontSize: '11px', opacity: .55, letterSpacing: '.08em', textTransform: 'uppercase' },

  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' },
  navLink: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        '9px 10px',
    borderRadius:   'var(--radius-md)',
    fontSize:       '13.5px',
    fontWeight:     500,
    color:          'rgba(255,255,255,.65)',
    transition:     'background .15s, color .15s',
    whiteSpace:     'nowrap',
    textDecoration: 'none',
  },
  navLinkActivo: {
    background: 'rgba(255,255,255,.12)',
    color:      '#fff',
  },
  navIcon: { display: 'flex', flexShrink: 0 },

  sidebarPie: { padding: '8px', borderTop: '1px solid rgba(255,255,255,.08)' },
  btnLogout: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    width:        '100%',
    padding:      '9px 10px',
    background:   'transparent',
    border:       'none',
    borderRadius: 'var(--radius-md)',
    color:        'rgba(255,255,255,.55)',
    fontSize:     '13.5px',
    fontWeight:   500,
    cursor:       'pointer',
    transition:   'background .15s, color .15s',
    whiteSpace:   'nowrap',
  },

  // Área principal
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },

  topbar: {
    height:          'var(--topbar-height)',
    background:      'var(--color-surface)',
    borderBottom:    '1px solid var(--color-border)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0 20px',
    flexShrink:       0,
    boxShadow:       'var(--shadow-sm)',
    zIndex:           9,
  },
  btnMenu: {
    background:   'transparent',
    border:       'none',
    borderRadius: 'var(--radius-sm)',
    padding:      '6px',
    color:        'var(--color-text-secondary)',
    display:      'flex',
    transition:   'background .15s',
  },

  topbarDerecha: { display: 'flex', alignItems: 'center', gap: '8px' },

  btnUsuario: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    background:     'transparent',
    border:         'none',
    borderRadius:   'var(--radius-md)',
    padding:        '5px 8px',
    cursor:         'pointer',
    transition:     'background .15s',
  },
  avatar: {
    width:           '32px',
    height:          '32px',
    borderRadius:    '50%',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    color:           '#fff',
    fontWeight:      700,
    fontSize:        '13px',
    flexShrink:      0,
  },
  usuarioInfo: { display: 'flex', flexDirection: 'column', lineHeight: 1.3, textAlign: 'left' },
  usuarioNombre:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' },
  usuarioPerfil:  { fontSize: '11px', fontWeight: 500, textTransform: 'capitalize' },
  chevron: { color: 'var(--color-text-muted)' },

  dropdown: {
    position:     'absolute',
    top:          'calc(100% + 8px)',
    right:        0,
    background:   'var(--color-surface)',
    border:       '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow:    'var(--shadow-lg)',
    minWidth:     '180px',
    padding:      '8px',
    zIndex:       100,
  },
  dropdownTitulo: {
    fontSize:    '10px',
    fontWeight:  600,
    color:       'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    padding:     '4px 8px 8px',
  },
  dropdownItem: {
    display:       'flex',
    alignItems:    'center',
    gap:           '8px',
    width:         '100%',
    padding:       '8px 10px',
    background:    'transparent',
    border:        'none',
    borderRadius:  'var(--radius-sm)',
    fontSize:      '13px',
    fontWeight:    500,
    color:         'var(--color-text)',
    cursor:        'pointer',
    textAlign:     'left',
    transition:    'background .12s',
  },
  dropdownItemActivo: {
    background:    'var(--color-primary-subtle)',
    color:         'var(--color-primary)',
    cursor:        'default',
  },
  dropdownDot: {
    width:         '8px',
    height:        '8px',
    borderRadius:  '50%',
    flexShrink:    0,
  },
  dropdownCheck: { marginLeft: 'auto', fontSize: '12px', fontWeight: 700 },

  btnIcono: {
    background:   'transparent',
    border:       'none',
    borderRadius: 'var(--radius-sm)',
    padding:      '6px',
    color:        'var(--color-text-secondary)',
    display:      'flex',
  },

  contenido: {
    flex:       1,
    overflow:   'auto',
    padding:    '28px 32px',
  },
}
