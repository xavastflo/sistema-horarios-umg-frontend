import api from './axios'

/**
 * Módulo de API — Horarios.
 * Consulta y gestión de estados de horarios existentes.
 *
 * Roles:
 *   GET endpoints     → administrador + coordinador
 *     El coordinador solo ve las carreras que coordina (filtrado en backend).
 *   PATCH transiciones → solo administrador (aprobar, bloquear, publicar)
 *
 * NO implementa en este módulo:
 *   - Edición manual de detalles de horario
 *   - Reportes (ver src/api/reportes.js)
 *   - Reportes
 */

/**
 * Lista horarios existentes.
 * @param {{ id_carrera?: number, id_periodo_academico?: number, estado?: string }} params
 * @returns {{ total, horarios }}
 */
export async function getHorarios(params = {}) {
  const response = await api.get('/horarios', { params })
  return response.data
}

/**
 * Obtiene un horario con su estado y total de detalles.
 * @param {number} id
 * @returns {{ horario, total_detalles }}
 */
export async function getHorario(id) {
  const response = await api.get(`/horarios/${id}`)
  return response.data
}

/**
 * Lista los detalles activos de un horario (curso, docente, bloque, día, hora).
 * @param {number} id
 * @returns {{ id_horario, total, detalles }}
 */
export async function getDetallesHorario(id) {
  const response = await api.get(`/horarios/${id}/detalles`)
  return response.data
}

/**
 * Detalles enriquecidos con jornada, carrera y ciclo_semestre.
 * @param {number} id
 */
export async function getHorarioCompleto(id) {
  const response = await api.get(`/horarios/${id}/completo`)
  return response.data
}

/**
 * Acciones disponibles desde el estado actual.
 * @param {number} id
 * @returns {{ id_horario, estado_actual, acciones: string[], es_terminal }}
 */
export async function getTransiciones(id) {
  const response = await api.get(`/horarios/${id}/transiciones`)
  return response.data
}

/**
 * Aprueba un horario. Transición: generado → aprobado.
 * Solo administrador.
 * @param {number} id
 * @param {string} [observaciones]
 */
export async function aprobarHorario(id, observaciones = null) {
  const body = observaciones ? { observaciones } : {}
  const response = await api.patch(`/horarios/${id}/aprobar`, body)
  return response.data
}

/**
 * Bloquea un horario. Transición: aprobado → bloqueado.
 * Solo administrador.
 * @param {number} id
 * @param {string} [observaciones]
 */
export async function bloquearHorario(id, observaciones = null) {
  const body = observaciones ? { observaciones } : {}
  const response = await api.patch(`/horarios/${id}/bloquear`, body)
  return response.data
}

/**
 * Publica un horario. Transición: aprobado|bloqueado → publicado (estado terminal).
 * Solo administrador.
 * @param {number} id
 * @param {string} [observaciones]
 */
export async function publicarHorario(id, observaciones = null) {
  const body = observaciones ? { observaciones } : {}
  const response = await api.patch(`/horarios/${id}/publicar`, body)
  return response.data
}

/**
 * Genera y persiste un horario automáticamente.
 * Endpoint creado en PARENTESIS técnico.
 * @param {{ id_periodo_academico: number, id_carrera_jornada: number }} datos
 * @returns {{ message, horario, resumen, no_asignadas }}
 */
export async function generarHorario(datos) {
  const response = await api.post('/horarios/generar', datos)
  return response.data
}
