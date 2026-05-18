import api from './axios'

/**
 * Módulo de API — Carreras.
 * Endpoints consumidos:
 *   GET    /carreras              (admin + coordinador)
 *   POST   /carreras              (admin)
 *   PUT    /carreras/{id}         (admin)
 *   DELETE /carreras/{id}         (admin)
 */

/**
 * Lista todas las carreras.
 * @param {{ estado?: string, id_facultad?: number, buscar?: string }} params
 */
export async function getCarreras(params = {}) {
  const response = await api.get('/carreras', { params })
  return response.data
}

/**
 * Crea una nueva carrera.
 * @param {{ id_facultad: number, nombre_carrera: string, codigo_carrera: string }} datos
 */
export async function crearCarrera(datos) {
  const response = await api.post('/carreras', datos)
  return response.data
}

/**
 * Actualiza una carrera existente.
 * @param {number} id
 * @param {{ id_facultad?: number, nombre_carrera?: string, codigo_carrera?: string, estado?: string }} datos
 */
export async function actualizarCarrera(id, datos) {
  const response = await api.put(`/carreras/${id}`, datos)
  return response.data
}

/**
 * Desactiva una carrera (eliminación lógica, siempre exitosa).
 * @param {number} id
 */
export async function eliminarCarrera(id) {
  const response = await api.delete(`/carreras/${id}`)
  return response.data
}
