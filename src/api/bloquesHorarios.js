import api from './axios'

/**
 * Módulo de API — Bloques Horarios.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /bloques-horario                         listar con filtros
 *   POST   /bloques-horario                         crear bloque individual
 *   DELETE /bloques-horario/{id}                    desactivar
 *   POST   /bloques-horario/generar                 generación automática
 *   GET    /carrera-jornadas/{id}/bloques           bloques de una carrera-jornada
 *
 * Catálogos auxiliares (también usados aquí):
 *   GET    /catalogos/dias                          catálogo de días
 */

/**
 * Lista bloques horarios con filtros opcionales.
 * @param {{ id_carrera_jornada?: number, id_dia?: number, estado?: string }} params
 */
export async function getBloques(params = {}) {
  const response = await api.get('/bloques-horario', { params })
  return response.data
}

/**
 * Crea un bloque horario individual.
 * @param {{ id_carrera_jornada, id_dia, hora_inicio, hora_fin, duracion_minutos }} datos
 */
export async function crearBloque(datos) {
  const response = await api.post('/bloques-horario', datos)
  return response.data
}

/**
 * Desactiva un bloque horario.
 * El backend rechaza con 422 si el bloque está en uso en un horario activo.
 * @param {number} id
 */
export async function eliminarBloque(id) {
  const response = await api.delete(`/bloques-horario/${id}`)
  return response.data
}

/**
 * Genera bloques automáticamente para una carrera-jornada.
 * @param {{
 *   id_carrera_jornada: number,
 *   ids_dia: number[],
 *   hora_inicio_general: string,  "HH:MM"
 *   hora_fin_general: string,     "HH:MM"
 *   duracion_minutos: number,
 *   exclusiones?: [{ inicio: string, fin: string }]
 * }} datos
 */
export async function generarBloques(datos) {
  const response = await api.post('/bloques-horario/generar', datos)
  return response.data
}

/**
 * Obtiene bloques de una carrera-jornada agrupados por día.
 * @param {number} idCarreraJornada
 */
export async function getBloquesPorCarreraJornada(idCarreraJornada) {
  const response = await api.get(`/carrera-jornadas/${idCarreraJornada}/bloques`)
  return response.data // { carrera_jornada, bloques_por_dia }
}

/**
 * Catálogo de días.
 */
export async function getDias() {
  const response = await api.get('/catalogos/dias')
  return response.data
}
