import api from './axios'

/**
 * Módulo de API — Facultades.
 * Endpoints consumidos (todos requieren rol: administrador):
 *   GET    /facultades
 *   POST   /facultades
 *   PUT    /facultades/{id}
 *   DELETE /facultades/{id}
 */

/**
 * Lista todas las facultades.
 * @param {{ estado?: string, buscar?: string }} params
 */
export async function getFacultades(params = {}) {
  const response = await api.get('/facultades', { params })
  return response.data // array de facultades
}

/**
 * Crea una nueva facultad.
 * @param {{ nombre_facultad: string, codigo_facultad?: string, descripcion?: string }} datos
 */
export async function crearFacultad(datos) {
  const response = await api.post('/facultades', datos)
  return response.data // facultad creada
}

/**
 * Actualiza una facultad existente.
 * @param {number} id
 * @param {{ nombre_facultad?: string, codigo_facultad?: string, descripcion?: string, estado?: string }} datos
 */
export async function actualizarFacultad(id, datos) {
  const response = await api.put(`/facultades/${id}`, datos)
  return response.data // facultad actualizada
}

/**
 * Desactiva una facultad (solo si no tiene carreras activas).
 * El backend devuelve 422 si tiene carreras activas.
 * @param {number} id
 */
export async function eliminarFacultad(id) {
  const response = await api.delete(`/facultades/${id}`)
  return response.data // { message }
}
