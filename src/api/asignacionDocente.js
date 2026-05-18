import api from './axios'

/**
 * Módulo de API — Asignación Docente a Sección.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   POST   /secciones/{id}/asignacion    asignar docente a sección
 *   DELETE /secciones/{id}/asignacion    quitar docente (estado → inactivo)
 *   GET    /asignaciones                 listar asignaciones con filtros
 *
 * Reglas de negocio validadas por el backend (devuelve 422):
 *   - La sección ya tiene docente activo
 *   - El docente no está activo
 *   - El docente alcanzó el máximo de cursos en el período
 *   - El docente ya tiene un curso del mismo ciclo_semestre en el período
 */

/**
 * Asigna un docente a una sección.
 * @param {number} idSeccion
 * @param {number} idDocente
 * @returns {{ message, asignacion }}
 */
export async function asignarDocente(idSeccion, idDocente) {
  const response = await api.post(`/secciones/${idSeccion}/asignacion`, {
    id_docente: idDocente,
  })
  return response.data
}

/**
 * Quita el docente asignado a una sección (estado → inactivo).
 * @param {number} idSeccion
 * @returns {{ message }}
 */
export async function quitarDocente(idSeccion) {
  const response = await api.delete(`/secciones/${idSeccion}/asignacion`)
  return response.data
}

/**
 * Lista asignaciones globales con filtros opcionales.
 * Útil para consultar carga docente por período.
 * @param {{ id_docente?: number, id_periodo_academico?: number, estado?: string }} params
 */
export async function getAsignaciones(params = {}) {
  const response = await api.get('/asignaciones', { params })
  return response.data
}
