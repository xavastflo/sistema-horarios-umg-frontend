import api from './axios'

/**
 * Módulo de API — Notificaciones.
 *
 * Sin restricción de rol: cualquier usuario autenticado accede a sus propias
 * notificaciones. El backend filtra por id_usuario del token.
 *
 * Endpoints:
 *   GET    /notificaciones              { total, no_leidas, notificaciones[] }
 *   GET    /notificaciones/no-leidas    { total, notificaciones[] }
 *   PATCH  /notificaciones/leer-todas   { message, actualizadas }
 *   PATCH  /notificaciones/{id}/leer    { message, notificacion }
 *   DELETE /notificaciones/{id}         { message }  — lógico (estado → inactivo)
 *
 * Tipos posibles de tipo_notificacion:
 *   cambio_horario | bloqueo_horario | aprobacion_horario | general
 */

export async function getNotificaciones() {
  const response = await api.get('/notificaciones')
  return response.data // { total, no_leidas, notificaciones }
}

export async function getNoLeidas() {
  const response = await api.get('/notificaciones/no-leidas')
  return response.data // { total, notificaciones }
}

export async function leerTodas() {
  const response = await api.patch('/notificaciones/leer-todas')
  return response.data // { message, actualizadas }
}

export async function leerNotificacion(id) {
  const response = await api.patch(`/notificaciones/${id}/leer`)
  return response.data
}

export async function eliminarNotificacion(id) {
  const response = await api.delete(`/notificaciones/${id}`)
  return response.data
}
