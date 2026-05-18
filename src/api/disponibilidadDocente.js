import api from './axios'

/**
 * Módulo de API — Disponibilidad Docente.
 *
 * REGLA: registro activo = docente NO disponible en ese bloque.
 * Sin registro = docente disponible.
 *
 * Endpoints:
 *   GET    /docentes/{id}/disponibilidad           admin+coord: consultar restricciones
 *   POST   /docentes/{id}/disponibilidad/toggle    docente: marcar/desmarcar bloque
 *   POST   /docentes/{id}/disponibilidad           docente: marcar bloque como no disponible
 *   DELETE /docentes/{id}/disponibilidad/{disp}    docente: desmarcar bloque
 *
 * POST y DELETE son solo para rol:docente.
 * GET es accesible por admin, coordinador y docente.
 */

/**
 * Lista los bloques NO disponibles de un docente.
 * @param {number} idDocente
 * @returns {{ docente, bloques_no_disponibles, total }}
 */
export async function getDisponibilidad(idDocente) {
  const response = await api.get(`/docentes/${idDocente}/disponibilidad`)
  return response.data
}

/**
 * Alterna el estado de disponibilidad de un bloque (toggle).
 * Si el bloque está marcado como no disponible → lo desmarca.
 * Si no está marcado → lo marca como no disponible.
 * Solo accesible por el docente autenticado.
 *
 * @param {number} idDocente
 * @param {number} idBloqueHorario
 * @param {string} [observacion]
 * @returns {{ message, disponible: boolean }}
 */
export async function toggleDisponibilidad(idDocente, idBloqueHorario, observacion = null) {
  const payload = { id_bloque_horario: idBloqueHorario }
  if (observacion) payload.observacion = observacion
  const response = await api.post(`/docentes/${idDocente}/disponibilidad/toggle`, payload)
  return response.data
}

/**
 * Marca un bloque como NO disponible (crea restricción).
 * Solo accesible por el docente autenticado.
 *
 * @param {number} idDocente
 * @param {{ id_bloque_horario: number, observacion?: string }} datos
 */
export async function marcarNoDisponible(idDocente, datos) {
  const response = await api.post(`/docentes/${idDocente}/disponibilidad`, datos)
  return response.data
}

/**
 * Desmarca un bloque (elimina la restricción, estado → inactivo).
 * Solo accesible por el docente autenticado.
 *
 * @param {number} idDocente
 * @param {number} idDisponibilidad  (id_disponibilidad_docente)
 */
export async function desmarcarBloque(idDocente, idDisponibilidad) {
  const response = await api.delete(`/docentes/${idDocente}/disponibilidad/${idDisponibilidad}`)
  return response.data
}
