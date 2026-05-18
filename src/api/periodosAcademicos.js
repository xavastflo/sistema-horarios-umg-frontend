import api from './axios'

/**
 * Módulo de API — Períodos Académicos.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /periodos-academicos
 *   POST   /periodos-academicos
 *   PUT    /periodos-academicos/{id}
 *   DELETE /periodos-academicos/{id}          (solo estado=planificacion, sin secciones)
 *   PATCH  /periodos-academicos/{id}/marcar-vigente
 */

/**
 * Lista períodos académicos con filtros opcionales.
 * @param {{ estado?: string, anio?: number, es_vigente?: boolean }} params
 */
export async function getPeriodos(params = {}) {
  const response = await api.get('/periodos-academicos', { params })
  return response.data
}

/**
 * Crea un período académico.
 * @param {{
 *   nombre_periodo: string,
 *   anio: number,
 *   numero_periodo: number,
 *   fecha_inicio: string,
 *   fecha_fin: string,
 *   fecha_limite_edicion_horarios?: string,
 *   estado?: string,
 *   es_vigente?: boolean
 * }} datos
 */
export async function crearPeriodo(datos) {
  const response = await api.post('/periodos-academicos', datos)
  return response.data
}

/**
 * Actualiza un período académico existente.
 * @param {number} id
 * @param {object} datos  — mismos campos que crear, todos opcionales
 */
export async function actualizarPeriodo(id, datos) {
  const response = await api.put(`/periodos-academicos/${id}`, datos)
  return response.data
}

/**
 * Cierra un período académico (eliminación lógica).
 * Solo disponible si estado === 'planificacion' y sin secciones.
 * @param {number} id
 */
export async function eliminarPeriodo(id) {
  const response = await api.delete(`/periodos-academicos/${id}`)
  return response.data
}

/**
 * Marca un período como vigente y desmarca todos los demás.
 * @param {number} id
 */
export async function marcarVigente(id) {
  const response = await api.patch(`/periodos-academicos/${id}/marcar-vigente`)
  return response.data
}
