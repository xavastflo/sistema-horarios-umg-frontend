import api from './axios'

/**
 * Módulo de API — Secciones.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /secciones              lista con filtros opcionales
 *   POST   /secciones              crear sección
 *   DELETE /secciones/{id}         desactivar (lógico; rechaza si tiene docente)
 *
 * No existe PUT — las secciones no tienen edición.
 * Los endpoints de asignación de docente quedan para el Paso 14.
 */

/**
 * Lista secciones.
 * @param {{ id_curso?: number, id_periodo_academico?: number, estado?: string }} params
 */
export async function getSecciones(params = {}) {
  const response = await api.get('/secciones', { params })
  return response.data
}

/**
 * Crea una sección.
 * numero_seccion se convierte a mayúsculas en el backend.
 * @param {{ id_curso: number, id_periodo_academico: number, numero_seccion: string }} datos
 */
export async function crearSeccion(datos) {
  const response = await api.post('/secciones', datos)
  return response.data
}

/**
 * Desactiva una sección (estado → inactivo).
 * El backend rechaza con 422 si tiene docente asignado.
 * @param {number} id
 */
export async function eliminarSeccion(id) {
  const response = await api.delete(`/secciones/${id}`)
  return response.data
}
