import api from './axios'

/**
 * Módulo de API — Cursos.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /cursos              lista con filtros estado y buscar
 *   POST   /cursos              crear curso (codigo_curso se convierte a mayúsculas en backend)
 *   PUT    /cursos/{id}         actualizar nombre, código o estado
 *   DELETE /cursos/{id}         desactivar — rechaza con 422 si tiene secciones activas
 */

/**
 * Lista cursos con filtros opcionales.
 * @param {{ estado?: string, buscar?: string }} params
 */
export async function getCursos(params = {}) {
  const response = await api.get('/cursos', { params })
  return response.data
}

/**
 * Crea un curso.
 * El backend convierte codigo_curso a mayúsculas automáticamente.
 * @param {{ codigo_curso: string, nombre_curso: string }} datos
 */
export async function crearCurso(datos) {
  const response = await api.post('/cursos', datos)
  return response.data
}

/**
 * Actualiza un curso.
 * @param {number} id
 * @param {{ codigo_curso?: string, nombre_curso?: string, estado?: string }} datos
 */
export async function actualizarCurso(id, datos) {
  const response = await api.put(`/cursos/${id}`, datos)
  return response.data
}

/**
 * Desactiva un curso (estado → inactivo).
 * El backend rechaza con 422 si el curso tiene secciones activas.
 * @param {number} id
 */
export async function eliminarCurso(id) {
  const response = await api.delete(`/cursos/${id}`)
  return response.data
}
