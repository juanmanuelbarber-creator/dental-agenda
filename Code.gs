// =============================================
//  DentaAgenda — Google Apps Script Backend
//  Versión: un solo odontólogo
//
//  1. Pegá este código en script.google.com
//  2. Ejecutá setupSpreadsheet() UNA sola vez
//  3. Deployá como Web App (acceso: Anyone)
//  4. Copiá la URL al frontend (js/utils/api.js)
// =============================================

const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID')

const HOJAS = {
  PACIENTES: 'Pacientes',
  TURNOS:    'Turnos',
  HISTORIAL: 'Historial',
  WSP_LOG:   'WspLog',
}

// ============================================================
//  SETUP — ejecutar UNA sola vez
// ============================================================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.create('DentaAgenda')
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId())

  ss.getSheets()[0].setName(HOJAS.PACIENTES)
  ss.insertSheet(HOJAS.TURNOS)
  ss.insertSheet(HOJAS.HISTORIAL)
  ss.insertSheet(HOJAS.WSP_LOG)

  _setCabeceras(ss.getSheetByName(HOJAS.PACIENTES),
    ['id','nombre','dni','telefono','email','fecha_nac','obra_social','alergias','notas','created_at'])

  _setCabeceras(ss.getSheetByName(HOJAS.TURNOS),
    ['id','paciente_id','paciente_nombre','fecha','hora','tratamiento','estado','estado_pago','monto','notas','created_at'])

  _setCabeceras(ss.getSheetByName(HOJAS.HISTORIAL),
    ['id','paciente_id','paciente_nombre','fecha','tipo','contenido','adjunto_url','created_at'])

  _setCabeceras(ss.getSheetByName(HOJAS.WSP_LOG),
    ['id','paciente_id','paciente_nombre','turno_fecha','turno_hora','tipo','telefono','mensaje','estado','created_at'])

  Logger.log('✅ Spreadsheet creada: ' + ss.getUrl())
  SpreadsheetApp.getUi().alert('✅ ¡Listo! Ahora deployá el script como Web App.')
}

function _setCabeceras(sheet, cols) {
  sheet.getRange(1, 1, 1, cols.length).setValues([cols])
    .setFontWeight('bold')
    .setBackground('#0F6E56')
    .setFontColor('#ffffff')
  sheet.setFrozenRows(1)
}

// ============================================================
//  WEB APP
// ============================================================
function doGet(e)  { return _handle(e) }
function doPost(e) { return _handle(e) }

function _handle(e) {
  try {
    const params  = e.parameter || {}
    const method  = params.method || 'GET'
    const recurso = params.recurso || ''
    const body    = params.data ? JSON.parse(params.data) : {}

    switch (recurso) {
      case 'pacientes':
        if (method === 'GET')    return _ok(getPacientes(params))
        if (method === 'POST')   return _ok(crearPaciente(body))
        if (method === 'PUT')    return _ok(editarPaciente(body))
        if (method === 'DELETE') return _ok(eliminarPaciente(params.id))
        break
      case 'turnos':
        if (method === 'GET')    return _ok(getTurnos(params))
        if (method === 'POST')   return _ok(crearTurno(body))
        if (method === 'PUT')    return _ok(editarTurno(body))
        if (method === 'DELETE') return _ok(eliminarTurno(params.id))
        break
      case 'historial':
        if (method === 'GET')    return _ok(getHistorial(params))
        if (method === 'POST')   return _ok(crearNota(body))
        if (method === 'DELETE') return _ok(eliminarNota(params.id))
        break
      case 'wsp_log':
        if (method === 'GET')    return _ok(getWspLog())
        if (method === 'POST')   return _ok(registrarWsp(body))
        break
      case 'stats':
        return _ok(getStats(params))
    }
    return _error('Recurso no encontrado: ' + recurso)
  } catch(err) {
    return _error(err.message)
  }
}

// ============================================================
//  PACIENTES
// ============================================================
function getPacientes(params) {
  let rows = _toArray(HOJAS.PACIENTES)
  if (params.q) rows = rows.filter(r => r.nombre?.toLowerCase().includes(params.q.toLowerCase()))
  rows.sort((a, b) => (a.nombre||'').localeCompare(b.nombre||''))
  return rows
}

function crearPaciente(d) {
  const row = [_uuid(), d.nombre, d.dni||'', d.telefono||'', d.email||'',
    d.fecha_nac||'', d.obra_social||'', d.alergias||'', d.notas||'', new Date().toISOString()]
  _getSheet(HOJAS.PACIENTES).appendRow(row)
  return _rowToObj(HOJAS.PACIENTES, row)
}

function editarPaciente(d) {
  const idx = _findRow(HOJAS.PACIENTES, d.id)
  if (!idx) throw new Error('Paciente no encontrado')
  const cols     = _getCols(HOJAS.PACIENTES)
  const existing = _getSheet(HOJAS.PACIENTES).getRange(idx, 1, 1, cols.length).getValues()[0]
  const merged   = _mergeRow(cols, existing, d)
  _getSheet(HOJAS.PACIENTES).getRange(idx, 1, 1, cols.length).setValues([merged])
  return _rowToObj(HOJAS.PACIENTES, merged)
}

function eliminarPaciente(id) {
  const idx = _findRow(HOJAS.PACIENTES, id)
  if (idx) _getSheet(HOJAS.PACIENTES).deleteRow(idx)
  _deleteWhere(HOJAS.TURNOS,   'paciente_id', id)
  _deleteWhere(HOJAS.HISTORIAL,'paciente_id', id)
  _deleteWhere(HOJAS.WSP_LOG,  'paciente_id', id)
  return { ok: true }
}

// ============================================================
//  TURNOS
// ============================================================
function getTurnos(params) {
  let rows = _toArray(HOJAS.TURNOS)
  if (params.fecha)       rows = rows.filter(r => r.fecha === params.fecha)
  if (params.paciente_id) rows = rows.filter(r => r.paciente_id === params.paciente_id)
  if (params.mes)         rows = rows.filter(r => r.fecha?.startsWith(params.mes))
  rows.sort((a, b) => (a.hora||'').localeCompare(b.hora||''))
  return rows
}

function crearTurno(d) {
  const pac = _toArray(HOJAS.PACIENTES).find(p => p.id === d.paciente_id)
  const row = [_uuid(), d.paciente_id, pac?.nombre||'', d.fecha, d.hora,
    d.tratamiento||'', d.estado||'pendiente', d.estado_pago||'pendiente',
    d.monto||'', d.notas||'', new Date().toISOString()]
  _getSheet(HOJAS.TURNOS).appendRow(row)
  return _rowToObj(HOJAS.TURNOS, row)
}

function editarTurno(d) {
  const idx = _findRow(HOJAS.TURNOS, d.id)
  if (!idx) throw new Error('Turno no encontrado')
  const cols     = _getCols(HOJAS.TURNOS)
  const existing = _getSheet(HOJAS.TURNOS).getRange(idx, 1, 1, cols.length).getValues()[0]
  const merged   = _mergeRow(cols, existing, d)
  _getSheet(HOJAS.TURNOS).getRange(idx, 1, 1, cols.length).setValues([merged])
  return _rowToObj(HOJAS.TURNOS, merged)
}

function eliminarTurno(id) {
  const idx = _findRow(HOJAS.TURNOS, id)
  if (idx) _getSheet(HOJAS.TURNOS).deleteRow(idx)
  return { ok: true }
}

// ============================================================
//  HISTORIAL
// ============================================================
function getHistorial(params) {
  let rows = _toArray(HOJAS.HISTORIAL)
  if (params.paciente_id) rows = rows.filter(r => r.paciente_id === params.paciente_id)
  rows.sort((a, b) => (b.fecha||'').localeCompare(a.fecha||''))
  return rows
}

function crearNota(d) {
  const pac = _toArray(HOJAS.PACIENTES).find(p => p.id === d.paciente_id)
  const row = [_uuid(), d.paciente_id, pac?.nombre||'', d.fecha,
    d.tipo||'General', d.contenido, d.adjunto_url||'', new Date().toISOString()]
  _getSheet(HOJAS.HISTORIAL).appendRow(row)
  return _rowToObj(HOJAS.HISTORIAL, row)
}

function eliminarNota(id) {
  const idx = _findRow(HOJAS.HISTORIAL, id)
  if (idx) _getSheet(HOJAS.HISTORIAL).deleteRow(idx)
  return { ok: true }
}

// ============================================================
//  WSP LOG
// ============================================================
function getWspLog() {
  const rows = _toArray(HOJAS.WSP_LOG)
  rows.sort((a, b) => (b.created_at||'').localeCompare(a.created_at||''))
  return rows.slice(0, 300)
}

function registrarWsp(d) {
  const row = [_uuid(), d.paciente_id||'', d.paciente_nombre||'',
    d.turno_fecha||'', d.turno_hora||'', d.tipo||'recordatorio',
    d.telefono, d.mensaje, d.estado||'enviado', new Date().toISOString()]
  _getSheet(HOJAS.WSP_LOG).appendRow(row)
  return _rowToObj(HOJAS.WSP_LOG, row)
}

// ============================================================
//  STATS
// ============================================================
function getStats(params) {
  const hoy  = new Date().toISOString().split('T')[0]
  const mes  = params.mes || hoy.substring(0, 7)
  const todos = _toArray(HOJAS.TURNOS)

  const hoyT = todos.filter(t => t.fecha === hoy)
  const mesT = todos.filter(t => t.fecha?.startsWith(mes))

  return {
    hoy_total:        hoyT.length,
    hoy_pendientes:   hoyT.filter(t => t.estado === 'pendiente').length,
    hoy_confirmados:  hoyT.filter(t => t.estado === 'confirmado').length,
    hoy_atendidos:    hoyT.filter(t => t.estado === 'atendido').length,
    mes_total:        mesT.length,
    mes_atendidos:    mesT.filter(t => t.estado === 'atendido').length,
    mes_cobrado:      mesT.filter(t => t.estado_pago === 'cobrado').reduce((s,t) => s + (parseFloat(t.monto)||0), 0),
    mes_pendiente:    mesT.filter(t => t.estado === 'atendido' && t.estado_pago !== 'cobrado').reduce((s,t) => s + (parseFloat(t.monto)||0), 0),
    total_pacientes:  _toArray(HOJAS.PACIENTES).length,
  }
}

// ============================================================
//  HELPERS
// ============================================================
function _getSheet(n)  { return SpreadsheetApp.openById(SHEET_ID).getSheetByName(n) }

function _getCols(n) {
  const s = _getSheet(n)
  return s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]
}

function _toArray(nombre) {
  const sheet = _getSheet(nombre)
  const last  = sheet.getLastRow()
  if (last < 2) return []
  const cols = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const data = sheet.getRange(2, 1, last - 1, cols.length).getValues()
  return data
    .filter(row => row[0] !== '')
    .map(row => {
      const obj = {}
      cols.forEach((c, i) => { obj[c] = row[i] === '' ? null : String(row[i]) })
      return obj
    })
}

function _rowToObj(nombre, row) {
  const cols = _getCols(nombre)
  const obj  = {}
  cols.forEach((c, i) => { obj[c] = row[i] === '' ? null : String(row[i]) })
  return obj
}

function _findRow(nombre, id) {
  const sheet = _getSheet(nombre)
  const last  = sheet.getLastRow()
  if (last < 2) return null
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues()
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2
  }
  return null
}

function _mergeRow(cols, existing, updates) {
  return cols.map((col, i) => {
    if (col === 'id' || col === 'created_at') return existing[i]
    return updates[col] !== undefined ? updates[col] : existing[i]
  })
}

function _deleteWhere(nombre, campo, valor) {
  const sheet  = _getSheet(nombre)
  const cols   = _getCols(nombre)
  const colIdx = cols.indexOf(campo) + 1
  if (colIdx === 0) return
  const last = sheet.getLastRow()
  if (last < 2) return
  for (let i = last; i >= 2; i--) {
    if (sheet.getRange(i, colIdx).getValue() === valor) sheet.deleteRow(i)
  }
}

function _uuid()  { return Utilities.getUuid() }

function _ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON)
}

function _error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON)
}
