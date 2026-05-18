import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Card       from '../../components/ui/Card'

/* ── Componente de tarjeta de dashboard ────────────────────────── */
function DashboardCard({ icono, titulo, descripcion, colorAccent }) {
  return (
    <div style={{ ...estilos.card, borderTopColor: colorAccent }}>
      <div style={{ ...estilos.cardIcono, color: colorAccent }}>{icono}</div>
      <h3 style={estilos.cardTitulo}>{titulo}</h3>
      <p style={estilos.cardDesc}>{descripcion}</p>
    </div>
  )
}

function PillEstado({ texto, color }) {
  return (
    <span style={{ ...estilos.pill, background: color + '18', color }}>
      {texto}
    </span>
  )
}

/* ── Administrador ─────────────────────────────────────────────── */
export function AdminDashboard() {
  const { usuario } = useAuth()
  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Panel de Administración"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Tienes acceso completo al sistema.`}
        accion={<PillEstado texto="Administrador" color="var(--color-role-admin)" />}
      />

      <Card>
      <div style={estilos.grid}>
        <DashboardCard
          colorAccent="var(--color-role-admin)"
          icono="👥"
          titulo="Usuarios y roles"
          descripcion="Gestiona usuarios, asigna roles y administra permisos de acceso."
        />
        <DashboardCard
          colorAccent="var(--color-primary)"
          icono="🏛️"
          titulo="Facultades y carreras"
          descripcion="Configura la estructura académica de la institución."
        />
        <DashboardCard
          colorAccent="var(--color-accent)"
          icono="📅"
          titulo="Períodos académicos"
          descripcion="Administra los períodos y controla el estado de cada uno."
        />
        <DashboardCard
          colorAccent="var(--color-success)"
          icono="✅"
          titulo="Aprobación de horarios"
          descripcion="Aprueba, bloquea y publica los horarios generados por coordinadores."
        />
      </div>

      <div style={estilos.aviso}>
        <span style={estilos.avisoIcono}>🔧</span>
        Las pantallas de gestión se habilitarán en próximos sprints del frontend.
      </div>
      </Card>
    </div>
  )
}

/* ── Coordinador ───────────────────────────────────────────────── */
export function CoordinadorDashboard() {
  const { usuario } = useAuth()
  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Panel del Coordinador"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Gestiona los horarios de tus carreras.`}
        accion={<PillEstado texto="Coordinador" color="var(--color-role-coord)" />}
      />

      <Card>
      <div style={estilos.grid}>
        <DashboardCard
          colorAccent="var(--color-role-coord)"
          icono="🗓️"
          titulo="Horarios"
          descripcion="Genera, revisa y ajusta manualmente los horarios de tus carreras."
        />
        <DashboardCard
          colorAccent="var(--color-primary)"
          icono="📚"
          titulo="Pensums y cursos"
          descripcion="Administra cursos por ciclo semestral en cada pensum académico."
        />
        <DashboardCard
          colorAccent="var(--color-accent)"
          icono="👨‍🏫"
          titulo="Docentes"
          descripcion="Asigna docentes a secciones y consulta su disponibilidad."
        />
        <DashboardCard
          colorAccent="var(--color-success)"
          icono="📊"
          titulo="Reportes"
          descripcion="Genera reportes PDF y Excel de horarios y asignaciones."
        />
      </div>

      <div style={estilos.aviso}>
        <span style={estilos.avisoIcono}>🔧</span>
        Las pantallas de gestión se habilitarán en próximos sprints del frontend.
      </div>
      </Card>
    </div>
  )
}

/* ── Docente ───────────────────────────────────────────────────── */
export function DocenteDashboard() {
  const { usuario } = useAuth()
  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Mi Panel Docente"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Consulta tu horario y gestiona tu disponibilidad.`}
        accion={<PillEstado texto="Docente" color="var(--color-role-docente)" />}
      />

      <Card>
      <div style={estilos.grid}>
        <DashboardCard
          colorAccent="var(--color-role-docente)"
          icono="📋"
          titulo="Mi horario"
          descripcion="Consulta todas las clases que tienes asignadas en el período actual."
        />
        <DashboardCard
          colorAccent="var(--color-accent)"
          icono="🚫"
          titulo="Mi disponibilidad"
          descripcion="Indica los bloques horarios en los que no puedes impartir clases."
        />
        <DashboardCard
          colorAccent="var(--color-primary)"
          icono="🔔"
          titulo="Notificaciones"
          descripcion="Recibe avisos cuando tu horario sea aprobado, modificado o publicado."
        />
      </div>

      <div style={estilos.aviso}>
        <span style={estilos.avisoIcono}>🔧</span>
        Las pantallas de gestión se habilitarán en próximos sprints del frontend.
      </div>
      </Card>
    </div>
  )
}

/* ── Estudiante ────────────────────────────────────────────────── */
export function EstudianteDashboard() {
  const { usuario } = useAuth()
  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Mi Portal Estudiantil"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Consulta el horario publicado de tu carrera.`}
        accion={<PillEstado texto="Estudiante" color="var(--color-role-estudiante)" />}
      />

      <Card>
      <div style={estilos.grid}>
        <DashboardCard
          colorAccent="var(--color-role-estudiante)"
          icono="📅"
          titulo="Horario publicado"
          descripcion="Consulta el horario de clases de tu carrera y período académico."
        />
        <DashboardCard
          colorAccent="var(--color-primary)"
          icono="🔍"
          titulo="Buscar por carrera"
          descripcion="Selecciona tu carrera y período para ver el horario disponible."
        />
      </div>

      <div style={estilos.aviso}>
        <span style={estilos.avisoIcono}>ℹ️</span>
        Solo se muestran horarios en estado <strong>publicado</strong>.
        Contacta al coordinador si el horario aún no aparece.
      </div>
      </Card>
    </div>
  )
}

/* ── Estilos compartidos ────────────────────────────────────────── */
const estilos = {
  pagina: { maxWidth: '960px' },

  cabecera: {
    display:       'flex',
    alignItems:    'flex-start',
    justifyContent:'space-between',
    gap:           '16px',
    marginBottom:  '28px',
    flexWrap:      'wrap',
  },
  titulo: {
    fontSize:    '22px',
    fontWeight:  700,
    color:       'var(--color-text)',
    letterSpacing: '-.02em',
    marginBottom: '4px',
  },
  saludo: {
    fontSize: '14px',
    color:    'var(--color-text-secondary)',
    lineHeight: 1.5,
  },

  pill: {
    display:      'inline-flex',
    alignItems:   'center',
    padding:      '5px 14px',
    borderRadius: '99px',
    fontSize:     '12px',
    fontWeight:   600,
    flexShrink:   0,
    letterSpacing: '.03em',
  },

  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap:                 '16px',
    marginBottom:        '28px',
  },

  card: {
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderTop:     '3px solid',
    borderRadius:  'var(--radius-lg)',
    padding:       '20px',
    boxShadow:     'var(--shadow-sm)',
    transition:    'box-shadow .15s, transform .15s',
  },
  cardIcono:  { fontSize: '24px', marginBottom: '12px' },
  cardTitulo: {
    fontSize:    '14px',
    fontWeight:  600,
    color:       'var(--color-text)',
    marginBottom:'6px',
  },
  cardDesc:   { fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.55 },

  aviso: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    background:   'var(--color-primary-subtle)',
    border:       '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding:      '12px 16px',
    fontSize:     '13px',
    color:        'var(--color-text-secondary)',
  },
  avisoIcono: { fontSize: '16px', flexShrink: 0 },
}
