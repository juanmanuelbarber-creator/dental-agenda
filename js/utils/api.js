// =============================================
//  API — wrapper para llamadas a Apps Script
//  Configurar la URL después del deploy
// =============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbwTbOmk9LJKrtJDr1Ml3kL2ylGC3cY8HopWQHb9ZAjqjL8k2gsrjn3B8nCmNMm30k8gFA/exec'  // ← reemplazar con tu URL

const API = {
  async get(recurso, params = {}) {
    const qs  = new URLSearchParams({ recurso, method: 'GET', ...params }).toString()
    const res = await fetch(`${API_URL}?${qs}`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Error en la API')
    return json.data
  },

  async post(recurso, body = {}) {
    const res = await fetch(`${API_URL}?recurso=${recurso}&method=POST`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Error en la API')
    return json.data
  },

  async put(recurso, body = {}) {
    const res = await fetch(`${API_URL}?recurso=${recurso}&method=PUT`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Error en la API')
    return json.data
  },

  async del(recurso, id) {
    const qs  = new URLSearchParams({ recurso, method: 'DELETE', id }).toString()
    const res = await fetch(`${API_URL}?${qs}`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Error en la API')
    return json.data
  }
}
