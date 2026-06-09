const Historial = {
  pacId: null,

  render() {
    document.getElementById('page').innerHTML = `
      <div class="page-header">
        <h1>Historial clínico</h1>
        <div class="header-actions">
          <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar paciente..." oninput="Historial.buscar(this.value)">
          </div>
        </div>
      </div>
      <div class="page-content"><div id="hist-body">
        <div class="empty-state"><p>Buscá un paciente para ver su historial.</p></div>
      </div></div>`
    if (this.pacId) this.verPaciente(this.pacId)
  },

  async buscar(q) {
    if (!q || q.length < 2) return
    clearTimeout(this._t)
    this._t = setTimeout(async () => {
      try {
        if (!data.length) return
        if (data.length === 1) { this.verPaciente(data[0].id); return }
        document.getElementById('hist-body').innerHTML =
          data.map(p => `<div class="turno-row" onclick="Historial.verPaciente('${p.id}')">
            ${UI.avatar(p.nombre)}<div class="turno-info"><div class="turno-nombre">${p.nombre}</div></div></div>`).join('')
      } catch(e) {}
    }, 350)
  },

  async verPaciente(id) {
    this.pacId = id
    const body = document.getElementById('hist-body')
    if (!body) return
    body.innerHTML = '<div class="loading">Cargando...</div>'
    try {
      const [pacs, turnos, notas] = await Promise.all([
        API.get('turnos', { paciente_id: id }),
        API.get('historial', { paciente_id: id }),
      ])
      const p = pacs.find(x => x.id === id)
      if (!p) { body.innerHTML = '<div class="empty-state"><p>Paciente no encontrado.</p></div>'; return }

      const atendidos  = turnos.filter(t => t.estado === 'atendido')
      const cobrado    = atendidos.filter(t => t.estado_pago === 'cobrado').reduce((s,t)=>s+(parseFloat(t.monto)||0),0)

      body.innerHTML = `
        <div class="card mb-2" style="margin-bottom:1.25rem">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:1rem">
            ${UI.avatar(p.nombre,52)}
            <div style="flex:1">
              <h2 style="font-size:18px;font-weight:600">${p.nombre}</h2>
              <p class="text-xs text-3">${p.dni?'DNI '+p.dni+' · ':''}${D.edad(p.fecha_nac)?D.edad(p.fecha_nac)+' años · ':''}${p.obra_social||''}</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Pacientes.modalEditar('${p.id}')">Editar</button>
            <button class="btn btn-primary btn-sm" onclick="Agenda.modalNuevo('${p.id}');Router.go('agenda')">+ Turno</button>
          </div>
          <div class="form-row-3">
            <div class="stat-card card-sm"><div class="stat-label">Visitas</div><div class="stat-value">${atendidos.length}</div></div>
            <div class="stat-card card-sm"><div class="stat-label">Total cobrado</div><div class="stat-value" style="font-size:18px">$${cobrado.toLocaleString('es-AR')}</div></div>
            <div class="stat-card card-sm"><div class="stat-label">Teléfono</div><div style="font-size:13px;margin-top:4px">${p.telefono||'—'}</div></div>
          </div>
          ${p.alergias?`<div style="margin-top:10px;background:var(--danger-bg);color:var(--danger-c);border-radius:var(--r-md);padding:8px 12px;font-size:13px">⚠ ${p.alergias}</div>`:''}
        </div>
        <div style="display:flex;gap:4px;margin-bottom:1rem">
          <button class="chip active" id="tab-t" onclick="Historial.tab('turnos')">Turnos (${turnos.length})</button>
          <button class="chip"        id="tab-n" onclick="Historial.tab('notas')">Notas clínicas (${notas.length})</button>
        </div>
        <div id="tab-turnos">
          ${!turnos.length ? '<div class="empty-state"><p>Sin turnos.</p></div>' :
            `<div class="card" style="padding:0;overflow:hidden"><div class="table-wrap"><table>
              <thead><tr><th>Fecha</th><th>Hora</th><th>Tratamiento</th><th>Estado</th><th>Pago</th><th>Monto</th></tr></thead>
              <tbody>${turnos.map(t=>`<tr>
                <td class="text-sm">${D.short(t.fecha)}</td>
                <td class="text-sm font-mono">${D.hora(t.hora)}</td>
                <td class="text-sm">${t.tratamiento||'—'}</td>
                <td>${UI.badgeTurno(t.estado)}</td>
                <td>${UI.badgePago(t.estado_pago)}</td>
                <td class="text-sm">${t.monto?'$'+parseFloat(t.monto).toLocaleString('es-AR'):'—'}</td>
              </tr>`).join('')}</tbody>
            </table></div></div>`}
        </div>
        <div id="tab-notas" class="hidden">
          <button class="btn btn-primary btn-sm mb-2" style="margin-bottom:10px" onclick="Historial.modalNota('${p.id}')">+ Nueva nota</button>
          ${!notas.length ? '<div class="empty-state"><p>Sin notas clínicas.</p></div>' :
            notas.map(n=>`<div class="card card-sm mb-2" style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                <span class="text-xs font-mono text-3">${D.short(n.fecha)}</span>
                <span class="badge badge-neutral">${n.tipo}</span>
              </div>
              <p class="text-sm">${n.contenido}</p>
              ${n.adjunto_url?`<a href="${n.adjunto_url}" target="_blank" class="btn btn-sm btn-secondary mt-1">📎 Ver adjunto</a>`:''}
            </div>`).join('')}
        </div>`
    } catch(e) { body.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>` }
  },

  tab(t) {
    document.getElementById('tab-turnos')?.classList.toggle('hidden', t !== 'turnos')
    document.getElementById('tab-notas')?.classList.toggle('hidden', t !== 'notas')
    document.getElementById('tab-t')?.classList.toggle('active', t === 'turnos')
    document.getElementById('tab-n')?.classList.toggle('active', t === 'notas')
  },

  modalNota(pacId) {
    UI.openModal(`
      <div class="modal-header"><h2>Nueva nota clínica</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
      <div class="modal-body">
        <div class="form-row-2">
          <div class="form-group"><label>Fecha</label><input type="date" id="nn-fecha" value="${D.today()}"></div>
          <div class="form-group"><label>Tipo</label>
            <select id="nn-tipo"><option>General</option><option>Diagnóstico</option><option>Tratamiento</option><option>Radiografía</option><option>Receta</option><option>Derivación</option></select>
          </div>
        </div>
        <div class="form-group"><label>Contenido *</label><textarea id="nn-cont" rows="5" placeholder="Diagnóstico, procedimiento, indicaciones..."></textarea></div>
        <div class="form-group"><label>URL adjunto (Drive)</label><input type="url" id="nn-url" placeholder="https://..."></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="Historial.guardarNota('${pacId}')">Guardar nota</button>
      </div>`)
  },

  async guardarNota(pacId) {
    const contenido = document.getElementById('nn-cont').value.trim()
    if (!contenido) { UI.error('El contenido es obligatorio'); return }
    try {
      await API.post('historial', {
        paciente_id: pacId,
        fecha:       document.getElementById('nn-fecha').value,
        tipo:        document.getElementById('nn-tipo').value,
        contenido,
        adjunto_url: document.getElementById('nn-url').value.trim(),
      })
      UI.closeModal(); UI.ok('Nota guardada'); this.verPaciente(pacId)
    } catch(e) { UI.error(e.message) }
  }
}
