import api from './axios'

/**
 * Módulo de API — Pensum.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /pensums                lista con filtros opcionales
 *   POST   /pensums                crear pensum
 *   PUT    /pensums/{id}           actualizar nombre, código, descripción, estado
 *   DELETE /pensums/{id}           desactivar (estado → inactivo, siempre exitoso)
 *
 * Nota: los endpoints de gestión de cursos del pensum
 * (/pensums/{id}/cursos) quedan fuera de este módulo.
 */

/**
 * Lista pensums con filtros opcionales.
 * @param {{ estado?: string, id_carrera?: number, anio_inicio_vigencia?: number }} params
 */
export async function getPensums(params = {}) {
  const response = await api.get('/pensums', { params })
  return response.data
}

/**
 * Crea un pensum.
 * @param {{
 *   id_carrera: number,
 *   anio_inicio_vigencia: number,
 *   anio_fin_vigencia?: number|null,
 *   nombre_pensum: string,
 *   codigo_pensum: string,
 *   descripcion?: string
 * }} datos
 */
export async function crearPensum(datos) {
  const response = await api.post('/pensums', datos)
  return response.data
}

/**
 * Actualiza nombre, código, descripción, estado o vigencia de un pensum.
 * No acepta id_carrera (el backend lo ignora en PUT).
 * @param {number} id
 * @param {{
 *   nombre_pensum?: string,
 *   codigo_pensum?: string,
 *   descripcion?: string,
 *   estado?: string,
 *   anio_inicio_vigencia?: number,
 *   anio_fin_vigencia?: number|null
 * }} datos
 */
export async function actualizarPensum(id, datos) {
  const response = await api.put(`/pensums/${id}`, datos)
  return response.data
}

/**
 * Desactiva un pensum (estado → inactivo).
 * Operación siempre exitosa si el pensum existe.
 * @param {number} id
 */
export async function eliminarPensum(id) {
  const response = await api.delete(`/pensums/${id}`)
  return response.data
}

/**
 * Obtiene los cursos de un pensum, opcionalmente filtrados por tipo de período.
 *
 * id_periodo_academico en params sigue siendo válido: el backend filtra
 * los cursos por ciclosPermitidos() del período (pares/impares).
 * Sin ese parámetro devuelve todos los cursos del pensum.
 *
 * Usado por SeccionForm.jsx para mostrar solo los cursos del tipo de período.
 *
 * @param {number} idPensum
 * @param {{ id_periodo_academico?: number, estado?: string, ciclo_semestre?: number }} params
 */
export async function getCursosPensum(idPensum, params = {}) {
  const response = await api.get(`/pensums/${idPensum}/cursos`, { params })
  return response.data
}
