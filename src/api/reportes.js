import api from './axios'

/**
 * Módulo de API — Reportes.
 *
 * Los reportes devuelven archivos binarios (PDF/XLSX).
 * Se usa responseType:'blob' para recibirlos correctamente,
 * luego se crea un enlace temporal para dispararla descarga.
 *
 * Endpoints reales (backend Sprint 4 Paso 3):
 *   GET /reportes/horario-carrera        admin+coord
 *   GET /reportes/horario-docente        admin+coord+docente
 *   GET /reportes/secciones-no-asignadas admin+coord
 *   GET /reportes/resumen-asignaciones   admin+coord
 *
 * Parámetro ?formato=pdf|excel controla el tipo de archivo.
 * Default: excel.
 */

/**
 * Descarga un archivo blob y dispara el diálogo "Guardar como".
 * @param {Blob}   blob      Respuesta binaria de axios
 * @param {string} nombre    Nombre del archivo con extensión
 */
function descargar(blob, nombre) {
  const url = window.URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Reporte 1: Horario de una carrera en un período.
 * @param {{ id_horario: number, formato: 'pdf'|'excel' }} params
 */
export async function descargarHorarioCarrera({ id_horario, formato = 'excel' }) {
  const response = await api.get('/reportes/horario-carrera', {
    params:       { id_horario, formato },
    responseType: 'blob',
  })
  const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
  descargar(response.data, `horario_carrera_${id_horario}.${ext}`)
}

/**
 * Reporte 2: Horario de un docente.
 * @param {{
 *   id_docente?: number,           requerido para admin/coord
 *   id_periodo_academico?: number, opcional
 *   id_carrera?: number,           opcional
 *   formato: 'pdf'|'excel'
 * }} params
 */
export async function descargarHorarioDocente({ id_docente, id_periodo_academico, id_carrera, formato = 'excel' }) {
  const params = { formato }
  if (id_docente)            params.id_docente             = id_docente
  if (id_periodo_academico)  params.id_periodo_academico   = id_periodo_academico
  if (id_carrera)            params.id_carrera             = id_carrera

  const response = await api.get('/reportes/horario-docente', {
    params,
    responseType: 'blob',
  })
  const ext  = formato === 'pdf' ? 'pdf' : 'xlsx'
  const suf  = id_docente ?? 'propio'
  descargar(response.data, `horario_docente_${suf}.${ext}`)
}

/**
 * Reporte 3: Secciones no asignadas.
 * @param {{ id_carrera, id_periodo_academico, id_horario, formato }} params
 */
export async function descargarSeccionesNoAsignadas({ id_carrera, id_periodo_academico, id_horario, formato = 'excel' }) {
  const response = await api.get('/reportes/secciones-no-asignadas', {
    params:       { id_carrera, id_periodo_academico, id_horario, formato },
    responseType: 'blob',
  })
  const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
  descargar(response.data, `secciones_no_asignadas_c${id_carrera}_p${id_periodo_academico}.${ext}`)
}

/**
 * Reporte 4: Resumen de asignaciones.
 * @param {{ id_carrera, id_periodo_academico, id_horario?, formato }} params
 */
export async function descargarResumenAsignaciones({ id_carrera, id_periodo_academico, id_horario, formato = 'excel' }) {
  const params = { id_carrera, id_periodo_academico, formato }
  if (id_horario) params.id_horario = id_horario

  const response = await api.get('/reportes/resumen-asignaciones', {
    params,
    responseType: 'blob',
  })
  const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
  descargar(response.data, `resumen_asignaciones_c${id_carrera}_p${id_periodo_academico}.${ext}`)
}
