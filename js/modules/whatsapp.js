const WhatsApp = {
  plantilla: (d) =>
`Hola ${d.nombre} 👋
Te recordamos que tenés turno con *${CONFIG.nombre_dentista}* el *${d.fecha}* a las *${d.hora}*.
🦷 ${d.tratamiento}

¿Confirmás tu asistencia?
✅ Respondé *SÍ* para confirmar
❌ Respondé *NO* para cancelar`,

  render() {
    document.getElementById('page').innerHTML = `
      <div class="page-header">
        <h1>WhatsApp</h1>
        <div class="header-actions">
          <button class="btn btn-wsp" onclick="WhatsApp.masivo()">Enviar recordatorios de hoy</button>
        </div>
      </div>
      <div class="page-content">
        <div class="card mb-2" style="margin-bottom:1.25rem">
          <h3 style="font-size:14px;font-weight:600;margin-bottom:.75rem">Plantilla de recordatorio</h3>
          <div class="wsp-preview">${this.plantilla({nombre:'[Nombre del paciente]', fecha:'[Fecha]', hora:'[Hora]', tratamiento:'[Tratamiento]'})}</div>
          <p class="text-xs text-3 mt-1">Al hacer clic en "WhatsApp", se abre el chat con el mensaje prellenado listo para enviar.</p>
        </div>
        <h3 style="font-size:14px;font-weight:600;margin-bottom:.75rem">Log de mensajes</h3>
        <div class="card" style="padding:0;overflow:hidden">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Paciente</th><th>Enviado</th><th>Turno</th><th>Tipo</th><th>Estado</th></tr></thead>
              <tbody id="wsp-tbody"><tr><td colspan="5" class="loading">Cargando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`
    this.loadLog()
  },

  async loadLog() {
    try {
      const data = await API.get('wsp_log')
      const tb   = document.getElementById('wsp-tbody')
      if (!tb) return
      if (!data.length) {
        tb.innerHTML = '<tr><td colspan="5" class="loading">Sin mensajes aún.</td></tr>'
        return
      }
      tb.innerHTML = data.map(m => `<tr>
        <td style="font-weight:500">${m.paciente_nombre||'—'}</td>
        <td class="text-xs font-mono text-3">${m.created_at ? new Date(m.created_at).toLocaleString('es-AR') : ''}</td>
        <td class="text-sm">${m.turno_fecha ? D.short(m.turno_fecha)+' '+D.hora(m.turno_hora) : '—'}</td>
        <td><span class="badge badge-neutral">${m.tipo||'recordatorio'}</span></td>
        <td><span class="badge ${m.estado==='enviado'?'badge-success':'badge-warning'}">${m.estado}</span></td>
      </tr>`).join('')
    } catch(e) {}
  },

  async enviarTurno(turno) {
    let tel = turno.telefono
    if (!tel) {
      try {
        const pacs = await API.get('pacientes')
        tel = pacs.find(p => p.id === turno.paciente_id)?.telefono
      } catch(e) {}
    }
    if (!tel) { UI.error(`Sin teléfono registrado: ${turno.paciente_nombre}`); return }

    const texto = this.plantilla({
      nombre:      turno.paciente_nombre,
      fecha:       D.format(turno.fecha, { weekday:'long', day:'numeric', month:'long' }),
      hora:        D.hora(turno.hora),
      tratamiento: turno.tratamiento || 'consulta',
    })

    try {
      await API.post('wsp_log', {
        paciente_id:     turno.paciente_id,
        paciente_nombre: turno.paciente_nombre,
        turno_fecha:     turno.fecha,
        turno_hora:      turno.hora,
        tipo:            'recordatorio',
        telefono:        tel,
        mensaje:         texto,
        estado:          'enviado',
      })
    } catch(e) {}

    const num = tel.replace(/\D/g, '')
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, '_blank')
    UI.ok(`WhatsApp abierto para ${turno.paciente_nombre}`)
  },

  async masivo() {
    const hoy = D.today()
    try {
      const turnos = await API.get('turnos', { fecha: hoy })
      const pend   = turnos.filter(t => t.estado === 'pendiente')
      if (!pend.length) { UI.warning('No hay turnos pendientes hoy'); return }
      for (const t of pend) await this.enviarTurno(t)
      UI.ok(`Abiertos ${pend.length} chats de WhatsApp`)
    } catch(e) { UI.error(e.message) }
  }
}
