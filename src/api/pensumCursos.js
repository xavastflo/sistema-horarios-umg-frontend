import api from './axios'

/**
 * Módulo de API — Pensum_Curso.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /pensums/{id}/cursos              listar asociaciones del pensum
 *   POST   /pensums/{id}/cursos              asociar curso al pensum
 *   PATCH  /pensums/{id}/cursos/{pc}         actualizar ciclo_semestre
 *   DELETE /pensums/{id}/cursos/{pc}         desactivar asociación (estado → inactivo)
 *
 * Nota: {pc} es id_pensum_curso, no id_curso.
 * DELETE es lógico — el registro queda con estado inactivo.
 */

/**
 * Lista los cursos asociados a un pensum.
 * @param {number} idPensum
 * @param {{ estado?: string, ciclo_semestre?: number }} params
 */
export async function getCursosPensum(idPensum, params = {}) {
  const response = await api.get(`/pensums/${idPensum}/cursos`, { params })
  return response.data // array de { id_pensum_curso, id_curso, ciclo_semestre, estado, curso: {...} }
}

/**
 * Asocia un curso al pensum en un ciclo/semestre.
 * @param {number} idPensum
 * @param {{ id_curso: number, ciclo_semestre: number }} datos
 */
export async function asociarCurso(idPensum, datos) {
  const response = await api.post(`/pensums/${idPensum}/cursos`, datos)
  return response.data
}

/**
 * Actualiza el ciclo_semestre de una asociación.
 * Solo acepta { ciclo_semestre } — el id_curso no es editable.
 * @param {number} idPensum
 * @param {number} idPensumCurso  (id_pensum_curso, no id_curso)
 * @param {{ ciclo_semestre: number }} datos
 */
export async function actualizarCiclo(idPensum, idPensumCurso, datos) {
  const response = await api.patch(`/pensums/${idPensum}/cursos/${idPensumCurso}`, datos)
  return response.data
}

/**
 * Desactiva una asociación curso-pensum (estado → inactivo).
 * No elimina el curso ni el pensum.
 * @param {number} idPensum
 * @param {number} idPensumCurso  (id_pensum_curso)
 */
export async function quitarCurso(idPensum, idPensumCurso) {
  const response = await api.delete(`/pensums/${idPensum}/cursos/${idPensumCurso}`)
  return response.data
}
