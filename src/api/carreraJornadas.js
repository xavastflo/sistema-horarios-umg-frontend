import api from './axios'

/**
 * Módulo de API — Carrera_Jornada.
 * Endpoints consumidos:
 *   GET  /catalogos/jornadas            (público — catálogo fijo)
 *   GET  /carreras/{id}                 (admin+coord — ver jornadas activas de la carrera)
 *   POST /carreras/{id}/jornadas        (admin+coord — asignar jornadas)
 *
 * No existe DELETE para carrera/jornada en el backend.
 */

/**
 * Lista el catálogo de jornadas (todas, sin filtro de estado).
 * Devuelve solo jornadas activas porque el catálogo es de solo lectura.
 */
export async function getJornadas() {
  const response = await api.get('/catalogos/jornadas')
  return response.data // array de jornadas
}

/**
 * Obtiene una carrera con sus jornadasActivas incluidas.
 * @param {number} idCarrera
 */
export async function getCarreraConJornadas(idCarrera) {
  const response = await api.get(`/carreras/${idCarrera}`)
  return response.data // carrera con jornadasActivas[]
}

/**
 * Asigna una o varias jornadas a una carrera.
 * Las jornadas ya asignadas y activas se ignorarán (el backend lo indica en ignoradas[]).
 * Las que estaban inactivas se reactivan.
 *
 * @param {number}   idCarrera
 * @param {number[]} idsJornada  Array de id_jornada a asignar
 * @returns {{ message, asignadas, ignoradas, carrera }}
 */
export async function asignarJornadas(idCarrera, idsJornada) {
  const response = await api.post(`/carreras/${idCarrera}/jornadas`, {
    jornadas: idsJornada,
  })
  return response.data
}
