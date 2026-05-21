import api from './axios'

/**
 * Módulo de API — Centros Educativos (Sedes).
 * Acceso: administrador (GET público para selects internos).
 */

export async function getCentros(params = {}) {
  const response = await api.get('/centros-educativos', { params })
  return response.data
}

export async function crearCentro(datos) {
  const response = await api.post('/centros-educativos', datos)
  return response.data
}

export async function actualizarCentro(id, datos) {
  const response = await api.put(`/centros-educativos/${id}`, datos)
  return response.data
}

export async function eliminarCentro(id) {
  const response = await api.delete(`/centros-educativos/${id}`)
  return response.data
}
