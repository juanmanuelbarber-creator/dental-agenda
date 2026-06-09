// =============================================
//  API — wrapper para llamadas a Apps Script
//  Configurar la URL después del deploy
// =============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxPY0hqIgcJ_h2OhCXn7z8_EFwkwOIQJn-SmeVEVHbK/exec'  // ← reemplazar con tu URL

const API = {
  // Apps Script bloquea POST desde dominios externos (CORS).
  // Solución: todo va por GET, el body se serializa como parámetro "data".
  async _call(recurso, method, params = {}) {
    const qs  = new URLSearchParams({ recurso, method, ...params }).toString()
    const res = await fetch(`${API_URL}?${qs}`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Error en la API')
    return json.data
  },

  async get(recurso, params = {}) {
    return this._call(recurso, 'GET', params)
  },

  async post(recurso, body = {}) {
    return this._call(recurso, 'POST', { data: JSON.stringify(body) })
  },

  async put(recurso, body = {}) {
    return this._call(recurso, 'PUT', { data: JSON.stringify(body) })
  },

  async del(recurso, id) {
    return this._call(recurso, 'DELETE', { id })
  }
}
