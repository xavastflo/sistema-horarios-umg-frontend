import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'

function DashboardCard({ icono, titulo, valor, descripcion, colorAccent }) {
  return (
    <div style={{ ...estilos.card, borderTopColor: colorAccent }}>
      <div style={estilos.cardTop}>
        <div style={{ ...estilos.cardIcono, color: colorAccent }}>{icono}</div>
        <div style={estilos.cardValor}>{valor}</div>
      </div>
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

function MiniFila({ label, valor }) {
  return (
    <div style={estilos.miniFila}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  )
}

function useResumenDashboard(tipo) {
  const [data, setData] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setCargando(true)
      setError(null)

      try {
        const peticiones = construirPeticiones(tipo)
        const resultados = await Promise.allSettled(
          peticiones.map(p => api.get(p.url, { params: p.params ?? {} }))
        )

        if (!activo) return

        const resumen = {}

        resultados.forEach((res, index) => {
          const key = peticiones[index].key

          if (res.status === 'fulfilled') {
            resumen[key] = res.value.data
          } else {
            resumen[key] = null
          }
        })

        setData(resumen)
      } catch {
        if (activo) setError('No se pudieron cargar las métricas del resumen.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()

    return () => {
      activo = false
    }
  }, [tipo])

  return { data, cargando, error }
}

function construirPeticiones(tipo) {
  if (tipo === 'admin') {
    return [
      { key: 'carreras', url: '/carreras', params: { estado: 'activo' } },
      { key: 'docentes', url: '/docentes', params: { estado: 'activo' } },
      { key: 'secciones', url: '/secciones', params: { estado: 'activo' } },
      { key: 'horarios', url: '/horarios' },
      { key: 'notificaciones', url: '/notificaciones' },
    ]
  }

  if (tipo === 'coordinador') {
    return [
      { key: 'carreras', url: '/carreras', params: { estado: 'activo' } },
      { key: 'docentes', url: '/docentes', params: { estado: 'activo' } },
      { key: 'secciones', url: '/secciones', params: { estado: 'activo' } },
      { key: 'horarios', url: '/horarios' },
      { key: 'noLeidas', url: '/notificaciones/no-leidas' },
    ]
  }

  if (tipo === 'docente') {
    return [
      { key: 'miHorario', url: '/docente/horario' },
      { key: 'noLeidas', url: '/notificaciones/no-leidas' },
    ]
  }

  if (tipo === 'estudiante') {
    return [
      { key: 'miHorario', url: '/estudiante/horario' },
      { key: 'noLeidas', url: '/notificaciones/no-leidas' },
    ]
  }

  return []
}

function contar(payload, claveLista = null) {
  if (!payload) return 0

  if (typeof payload.total === 'number') return payload.total
  if (typeof payload.no_leidas === 'number') return payload.no_leidas

  if (claveLista && Array.isArray(payload[claveLista])) {
    return payload[claveLista].length
  }

  if (Array.isArray(payload)) return payload.length

  const posibles = [
    'data',
    'carreras',
    'docentes',
    'secciones',
    'horarios',
    'notificaciones',
    'clases',
    'detalles',
  ]

  for (const key of posibles) {
    if (Array.isArray(payload[key])) return payload[key].length
  }

  return 0
}

function lista(payload, claveLista = null) {
  if (!payload) return []

  if (claveLista && Array.isArray(payload[claveLista])) return payload[claveLista]
  if (Array.isArray(payload)) return payload

  const posibles = [
    'data',
    'carreras',
    'docentes',
    'secciones',
    'horarios',
    'notificaciones',
    'clases',
    'detalles',
  ]

  for (const key of posibles) {
    if (Array.isArray(payload[key])) return payload[key]
  }

  return []
}

function contarHorariosPorEstado(horariosPayload, estado) {
  const horarios = lista(horariosPayload, 'horarios')

  return horarios.filter(h => {
    const estadoHorario =
      h.estado_horario?.nombre_estado ??
      h.nombre_estado ??
      h.estado

    return estadoHorario === estado
  }).length
}

/* ── Administrador ─────────────────────────────────────────────── */
export function AdminDashboard() {
  const { usuario } = useAuth()
  const { data, cargando, error } = useResumenDashboard('admin')

  const totalHorarios = contar(data.horarios, 'horarios')
  const publicados = contarHorariosPorEstado(data.horarios, 'publicado')
  const generados = contarHorariosPorEstado(data.horarios, 'generado')

  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Resumen del sistema"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Consulta el estado general de la operación académica.`}
        accion={<PillEstado texto="Administrador" color="var(--color-role-admin)" />}
      />

      <Card>
        {error && <div style={estilos.error}>{error}</div>}

        <div style={estilos.grid}>
          <DashboardCard
            colorAccent="var(--color-role-admin)"
            icono="🏫"
            titulo="Carreras activas"
            valor={cargando ? '…' : contar(data.carreras, 'carreras')}
            descripcion="Carreras disponibles para configuración académica."
          />
          <DashboardCard
            colorAccent="var(--color-primary)"
            icono="👨‍🏫"
            titulo="Docentes activos"
            valor={cargando ? '…' : contar(data.docentes, 'docentes')}
            descripcion="Docentes registrados y disponibles para asignación."
          />
          <DashboardCard
            colorAccent="var(--color-accent)"
            icono="📚"
            titulo="Secciones activas"
            valor={cargando ? '…' : contar(data.secciones, 'secciones')}
            descripcion="Secciones creadas para los períodos académicos."
          />
          <DashboardCard
            colorAccent="var(--color-success)"
            icono="🗓️"
            titulo="Horarios existentes"
            valor={cargando ? '…' : totalHorarios}
            descripcion="Horarios generados o gestionados en el sistema."
          />
        </div>

        <div style={estilos.resumenSecundario}>
          <MiniFila label="Horarios generados" valor={cargando ? '…' : generados} />
          <MiniFila label="Horarios publicados" valor={cargando ? '…' : publicados} />
          <MiniFila label="Notificaciones registradas" valor={cargando ? '…' : contar(data.notificaciones, 'notificaciones')} />
        </div>
      </Card>
    </div>
  )
}

/* ── Coordinador ───────────────────────────────────────────────── */
export function CoordinadorDashboard() {
  const { usuario } = useAuth()
  const { data, cargando, error } = useResumenDashboard('coordinador')

  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Resumen del coordinador"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Consulta el estado de tus carreras y horarios.`}
        accion={<PillEstado texto="Coordinador" color="var(--color-role-coord)" />}
      />

      <Card>
        {error && <div style={estilos.error}>{error}</div>}

        <div style={estilos.grid}>
          <DashboardCard
            colorAccent="var(--color-role-coord)"
            icono="🏫"
            titulo="Mis carreras"
            valor={cargando ? '…' : contar(data.carreras, 'carreras')}
            descripcion="Carreras bajo tu coordinación."
          />
          <DashboardCard
            colorAccent="var(--color-primary)"
            icono="📚"
            titulo="Secciones"
            valor={cargando ? '…' : contar(data.secciones, 'secciones')}
            descripcion="Secciones asociadas a tus carreras."
          />
          <DashboardCard
            colorAccent="var(--color-accent)"
            icono="👨‍🏫"
            titulo="Docentes"
            valor={cargando ? '…' : contar(data.docentes, 'docentes')}
            descripcion="Docentes disponibles para asignación académica."
          />
          <DashboardCard
            colorAccent="var(--color-success)"
            icono="🔔"
            titulo="Notificaciones"
            valor={cargando ? '…' : contar(data.noLeidas, 'notificaciones')}
            descripcion="Notificaciones pendientes de lectura."
          />
        </div>
      </Card>
    </div>
  )
}

/* ── Docente ───────────────────────────────────────────────────── */
export function DocenteDashboard() {
  const { usuario } = useAuth()
  const { data, cargando, error } = useResumenDashboard('docente')

  const clases = useMemo(() => lista(data.miHorario, 'clases'), [data.miHorario])
  const cursosUnicos = new Set(clases.map(c => c.id_curso ?? c.codigo_curso ?? c.nombre_curso)).size

  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Resumen docente"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Consulta rápidamente tus clases y avisos.`}
        accion={<PillEstado texto="Docente" color="var(--color-role-docente)" />}
      />

      <Card>
        {error && <div style={estilos.error}>{error}</div>}

        <div style={estilos.grid}>
          <DashboardCard
            colorAccent="var(--color-role-docente)"
            icono="📋"
            titulo="Clases asignadas"
            valor={cargando ? '…' : clases.length}
            descripcion="Bloques de clase registrados en tu horario."
          />
          <DashboardCard
            colorAccent="var(--color-primary)"
            icono="📚"
            titulo="Cursos"
            valor={cargando ? '…' : cursosUnicos}
            descripcion="Cursos distintos que tienes asignados."
          />
          <DashboardCard
            colorAccent="var(--color-accent)"
            icono="🔔"
            titulo="Notificaciones"
            valor={cargando ? '…' : contar(data.noLeidas, 'notificaciones')}
            descripcion="Avisos pendientes relacionados con horarios."
          />
        </div>
      </Card>
    </div>
  )
}

/* ── Estudiante ────────────────────────────────────────────────── */
export function EstudianteDashboard() {
  const { usuario } = useAuth()
  const { data, cargando, error } = useResumenDashboard('estudiante')

  const clases = useMemo(() => lista(data.miHorario, 'clases'), [data.miHorario])

  return (
    <div style={estilos.pagina} className="fade-in">
      <PageHeader
        titulo="Resumen estudiantil"
        descripcion={`Bienvenido, ${usuario?.nombres ?? usuario?.nombre_usuario}. Consulta la información general de tu horario.`}
        accion={<PillEstado texto="Estudiante" color="var(--color-role-estudiante)" />}
      />

      <Card>
        {error && <div style={estilos.error}>{error}</div>}

        <div style={estilos.grid}>
          <DashboardCard
            colorAccent="var(--color-role-estudiante)"
            icono="📅"
            titulo="Clases visibles"
            valor={cargando ? '…' : clases.length}
            descripcion="Clases disponibles en tu horario publicado."
          />
          <DashboardCard
            colorAccent="var(--color-primary)"
            icono="🔔"
            titulo="Notificaciones"
            valor={cargando ? '…' : contar(data.noLeidas, 'notificaciones')}
            descripcion="Avisos pendientes de lectura."
          />
        </div>
      </Card>
    </div>
  )
}

/* ── Estilos compartidos ────────────────────────────────────────── */
const estilos = {
  pagina: { maxWidth: '960px' },

  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 14px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
    letterSpacing: '.03em',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },

  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderTop: '3px solid',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'box-shadow .15s, transform .15s',
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },

  cardIcono: {
    fontSize: '24px',
  },

  cardValor: {
    fontSize: '28px',
    lineHeight: 1,
    fontWeight: 800,
    color: 'var(--color-text)',
  },

  cardTitulo: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '6px',
  },

  cardDesc: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.55,
  },

  resumenSecundario: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    paddingTop: '14px',
    borderTop: '1px solid var(--color-border)',
  },

  miniFila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  },

  error: {
    marginBottom: '16px',
    background: 'var(--color-error-subtle)',
    border: '1px solid var(--color-error)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    fontSize: '13px',
  },
}