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
 * @param {{ estado?: string, id_carrera?: number, id_periodo_academico?: number }} params
 */
export async function getPensums(params = {}) {
  const response = await api.get('/pensums', { params })
  return response.data
}

/**
 * Crea un pensum.
 * @param {{
 *   id_carrera: number,
 *   id_periodo_academico: number,
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
 * Actualiza nombre, código, descripción o estado de un pensum.
 * No acepta id_carrera ni id_periodo_academico (el backend los ignora en PUT).
 * @param {number} id
 * @param {{ nombre_pensum?: string, codigo_pensum?: string, descripcion?: string, estado?: string }} datos
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
