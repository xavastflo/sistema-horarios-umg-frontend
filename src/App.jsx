import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login      from './pages/Login'
import Layout     from './components/Layout'
import ProtectedRoute, { rutaDashboard } from './components/ProtectedRoute'
import {
  AdminDashboard,
  CoordinadorDashboard,
  DocenteDashboard,
  EstudianteDashboard,
} from './pages/dashboards/Dashboards'
import ModuloPendiente from './pages/ModuloPendiente'
import CentrosEducativos from './pages/admin/CentrosEducativos'
import Facultades        from './pages/admin/Facultades'
import Carreras        from './pages/admin/Carreras'
import CarreraJornadas  from './pages/admin/CarreraJornadas'
import BloquesHorarios    from './pages/admin/BloquesHorarios'
import PeriodosAcademicos from './pages/admin/PeriodosAcademicos'
import Pensum             from './pages/admin/Pensum'
import Cursos             from './pages/admin/Cursos'
import PensumCursos       from './pages/admin/PensumCursos'
import Docentes             from './pages/admin/Docentes'
import DisponibilidadDocente from './pages/admin/DisponibilidadDocente'
import Secciones             from './pages/admin/Secciones'
import AsignacionDocente     from './pages/admin/AsignacionDocente'
import Horarios              from './pages/admin/Horarios'
import Usuarios              from './pages/admin/Usuarios'
import Reportes              from './pages/admin/Reportes'
import Notificaciones        from './pages/admin/Notificaciones'
import PerfilUsuario         from './pages/perfil/PerfilUsuario'
import MisCarreras           from './pages/coordinador/MisCarreras'
import MiHorario             from './pages/docente/MiHorario'

/**
 * Redirige la raíz "/" al dashboard del perfil activo del usuario.
 * Si no hay sesión, ProtectedRoute ya redirige a /login.
 */
function RootRedirect() {
  const { perfilActivo } = useAuth()
  return <Navigate to={rutaDashboard(perfilActivo)} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas con Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Raíz → redirigir al dashboard del perfil activo */}
          <Route index element={<RootRedirect />} />

          {/* Dashboard de administrador */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={['administrador']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Módulos de administrador */}
          <Route
            path="admin/centros-educativos"
            element={
              <ProtectedRoute rolesPermitidos={['administrador']}>
                <CentrosEducativos />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/facultades"
            element={
              <ProtectedRoute rolesPermitidos={['administrador']}>
                <Facultades />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/carreras"
            element={
              <ProtectedRoute rolesPermitidos={['administrador']}>
                <Carreras />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/carrera-jornadas"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <CarreraJornadas />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/bloques-horarios"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <BloquesHorarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/periodos-academicos"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <PeriodosAcademicos />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/pensum"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <Pensum />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/cursos"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <Cursos />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/pensum-cursos"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <PensumCursos />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/docentes"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <Docentes />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/disponibilidad-docente"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador', 'docente']}>
                <DisponibilidadDocente />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/secciones"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <Secciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/asignacion-docente"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <AsignacionDocente />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/horarios"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador']}>
                <Horarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={['administrador']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/reportes"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador', 'docente']}>
                <Reportes />
              </ProtectedRoute>
            }
          />
          {/* Perfil — accesible para todos los roles autenticados */}
          <Route
            path="perfil"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador', 'docente', 'estudiante']}>
                <PerfilUsuario />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/notificaciones"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'coordinador', 'docente', 'estudiante']}>
                <Notificaciones />
              </ProtectedRoute>
            }
          />

          {/* Dashboard de coordinador */}
          <Route
            path="coordinador/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={['coordinador']}>
                <CoordinadorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Módulos de coordinador */}
          <Route
            path="coordinador/mis-carreras"
            element={
              <ProtectedRoute rolesPermitidos={['coordinador']}>
                <MisCarreras />
              </ProtectedRoute>
            }
          />

          {/* Dashboard de docente */}
          <Route
            path="docente/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={['docente']}>
                <DocenteDashboard />
              </ProtectedRoute>
            }
          />

          {/* Mi Horario docente */}
          <Route
            path="docente/mi-horario"
            element={
              <ProtectedRoute rolesPermitidos={['docente']}>
                <MiHorario />
              </ProtectedRoute>
            }
          />

          {/* Dashboard de estudiante */}
          <Route
            path="estudiante/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={['estudiante']}>
                <EstudianteDashboard />
              </ProtectedRoute>
            }
          />

          {/* Ruta de cambio de perfil — cualquier autenticado con >1 rol */}
          {/* Preparada para el componente CambiarPerfil. Por ahora redirige al dashboard. */}
          <Route
            path="cambiar-perfil"
            element={<RootRedirect />}
          />

          {/* Módulos pendientes — ruta única protegida reutilizable */}
          <Route
            path="pendiente"
            element={
              <ProtectedRoute>
                <ModuloPendiente />
              </ProtectedRoute>
            }
          />

          {/* Ruta no encontrada dentro del layout */}
          <Route path="*" element={<RootRedirect />} />
        </Route>

        {/* Ruta completamente desconocida → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
