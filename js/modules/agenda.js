const Agenda = {
  fecha: D.today(),
  turnos: [],
  filtro: 'todos',

  render() {
    document.getElementById('page').innerHTML = `
      <div class="page-header">
        <div><h1>Agenda</h1><div id="ag-sub" class="text-xs text-3"></div></div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" onclick="Agenda.enviarTodos()">💬 Recordatorios pendientes</button>
          <button class="btn btn-primary" onclick="Agenda.modalNuevo()">+ Nuevo turno</button>
        </div>
      </div>
      <div class="page-content">
        <div id="ag-stats" class="stats-grid"></div>
        <div class="cal-nav">
          <button onclick="Agenda.nav(-1)">◀</button>
          <h2 id="ag-titulo"></h2>
          <button onclick="Agenda.goHoy()">Hoy</button>
          <button onclick="Agenda.nav(1)">▶</button>
          <input type="date" id="ag-picker" style="margin-left:8px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-md);font-family:var(--font);font-size:13px" onchange="Agenda.goDate(this.value)">
        </div>
        <div class="chips">
          <span class="chip active" onclick="Agenda.setFiltro('todos',this)">Todos</span>
          <span class="chip" onclick="Agenda.setFiltro('pendiente',this)">Sin confirmar</span>
          <span class="chip" onclick="Agenda.setFiltro('confirmado',this)">Confirmados</span>
          <span class="chip" onclick="Agenda.setFiltro('en_sala',this)">En sala</span>
          <span class="chip" onclick="Agenda.setFiltro('atendido',this)">Atendidos</span>
        </div>
        <div id="ag-list"></div>
      </div>`
    this.actualizarCabecera()
    this.load()
  },

  actualizarCabecera() {
    const t = document.getElementById('ag-titulo')
    const s = document.getElementById('ag-sub')
    const p = document.getElementById('ag-picker')
    if (t) t.textContent = D.format(this.fecha)
    if (s) s.textContent = this.fecha === D.today() ? 'Hoy' : ''
    if (p) p.value = this.fecha
  },

  async load() {
    const list = document.getElementById('ag-list')
    if (list) list.innerHTML = '<div class="loading">Cargando turnos...</div>'
    try {
      this.turnos = await API.get('turnos', {
        
        fecha: this.fecha
      })
      this.renderStats()
      this.renderLista()
    } catch(e) { UI.error(e.message) }
  },

  renderStats() {
    const t  = this.turnos
    const el = document.getElementById('ag-stats')
    if (!el) return
    el.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total hoy</div><div class="stat-value">${t.length}</div></div>
      <div class="stat-card"><div class="stat-label">Sin confirmar</div><div class="stat-value" style="color:var(--warning-c)">${t.filter(x=>x.estado==='pendiente').length}</div></div>
      <div class="stat-card"><div class="stat-label">Confirmados</div><div class="stat-value" style="color:var(--success-c)">${t.filter(x=>x.estado==='confirmado').length}</div></div>
      <div class="stat-card"><div class="stat-label">Atendidos</div><div class="stat-value">${t.filter(x=>x.estado==='atendido').length}</div></div>`
  },

  renderLista() {
    const list = document.getElementById('ag-list')
    if (!list) return
    let rows = this.filtro === 'todos' ? this.turnos : this.turnos.filter(t => t.estado === this.filtro)
    if (!rows.length) {
      list.innerHTML = `<div class="empty-state"><p>No hay turnos para mostrar.</p>
        <button class="btn btn-primary mt-2" onclick="Agenda.modalNuevo()">+ Agregar turno</button></div>`
      return
    }
    list.innerHTML = rows.map(t => `
      <div class="turno-row" onclick="Agenda.modalDetalle('${t.id}')">
        <span class="turno-hora">${D.hora(t.hora)}</span>
        ${UI.avatar(t.paciente_nombre, 36)}
        <div class="turno-info">
          <div class="turno-nombre">${t.paciente_nombre}</div>
          <div class="turno-tipo">${t.tratamiento||'—'}</div>
        </div>
        ${UI.badgeTurno(t.estado)}
        <div class="turno-actions" onclick="event.stopPropagation()">
          ${t.estado==='pendiente'?`<button class="btn btn-sm btn-wsp" onclick="Agenda.enviarWsp('${t.id}')">WhatsApp</button>`:''}
          <button class="btn btn-sm btn-secondary" onclick="Agenda.modalDetalle('${t.id}')">Ver</button>
        </div>
      </div>`).join('')
  },

  setFiltro(f, el) {
    this.filtro = f
    document.querySelectorAll('#page .chips .chip').forEach(c => c.classList.remove('active'))
    el.classList.add('active')
    this.renderLista()
  },

  nav(d) { this.fecha = d < 0 ? D.prevDay(this.fecha) : D.nextDay(this.fecha); this.actualizarCabecera(); this.load() },
  goHoy()  { this.fecha = D.today(); this.actualizarCabecera(); this.load() },
  goDate(v){ this.fecha = v; this.actualizarCabecera(); this.load() },

  async modalNuevo(pacienteId = null) {
    let pacientes = []
    const opts = pacientes.map(p => `<option value="${p.id}" ${p.id===pacienteId?'selected':''}>${p.nombre}</option>`).join('')
    UI.openModal(`
      <div class="modal-header"><h2>Nuevo turno</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
      <div class="modal-body">
        <div class="form-group">
          <label>Paciente *</label>
          <select id="nt-pac"><option value="">— Seleccionar —</option>${opts}</select>
          <button class="btn btn-sm btn-secondary mt-1" onclick="Pacientes.modalNuevo(true)">+ Nuevo paciente</button>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>Fecha *</label><input type="date" id="nt-fecha" value="${this.fecha}"></div>
          <div class="form-group"><label>Hora *</label><input type="time" id="nt-hora"></div>
        </div>
        <div class="form-group"><label>Tratamiento</label>
          <select id="nt-trat">
            <option>Consulta general</option><option>Limpieza dental</option><option>Extracción</option>
            <option>Ortodoncia - control</option><option>Endodoncia</option><option>Implante</option>
            <option>Blanqueamiento</option><option>Radiografía</option><option>Otro</option>
          </select>
        </div>
        <div class="form-group"><label>Notas</label><textarea id="nt-notas" rows="2"></textarea></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="nt-wsp" checked> Enviar recordatorio por WhatsApp
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="Agenda.guardar()">Guardar turno</button>
      </div>`)
  },

  async guardar() {
    const paciente_id = document.getElementById('nt-pac').value
    const fecha       = document.getElementById('nt-fecha').value
    const hora        = document.getElementById('nt-hora').value
    if (!paciente_id) { UI.error('Seleccioná un paciente'); return }
    if (!fecha||!hora){ UI.error('Fecha y hora son obligatorias'); return }
    try {
      const t = await API.post('turnos', {
        
        paciente_id, fecha, hora,
        tratamiento: document.getElementById('nt-trat').value,
        notas: document.getElementById('nt-notas').value,
        estado: 'pendiente', estado_pago: 'pendiente'
      })
      UI.closeModal(); UI.ok('Turno guardado')
      if (document.getElementById('nt-wsp')?.checked) await WhatsApp.enviarTurno(t)
      if (this.fecha === fecha) this.load()
    } catch(e) { UI.error(e.message) }
  },

  async modalDetalle(id) {
    const t = this.turnos.find(x => x.id === id)
    if (!t) return
    UI.openModal(`
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:12px">
          ${UI.avatar(t.paciente_nombre, 44)}
          <div><h2>${t.paciente_nombre}</h2><p class="text-xs text-3">${D.short(t.fecha)} · ${D.hora(t.hora)}</p></div>
        </div>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row-2" style="margin-bottom:1rem">
          <div class="stat-card card-sm"><div class="stat-label">Tratamiento</div><div style="font-size:14px;font-weight:500;margin-top:4px">${t.tratamiento||'—'}</div></div>
          <div class="stat-card card-sm"><div class="stat-label">Estado</div><div style="margin-top:6px">${UI.badgeTurno(t.estado)}</div></div>
        </div>
        <div class="form-group"><label>Cambiar estado</label>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${['pendiente','confirmado','en_sala','atendido','cancelado','ausente'].map(e =>
              `<button class="btn btn-sm btn-secondary" onclick="Agenda.cambiarEstado('${id}','${e}')">${e}</button>`
            ).join('')}
          </div>
        </div>
        <hr class="divider">
        <div class="form-row-2">
          <div class="form-group"><label>Monto ($)</label><input type="number" id="det-monto" value="${t.monto||''}"></div>
          <div class="form-group"><label>Estado pago</label>
            <select id="det-pago">
              <option value="pendiente" ${t.estado_pago==='pendiente'?'selected':''}>Pendiente</option>
              <option value="seña"      ${t.estado_pago==='seña'?'selected':''}>Seña</option>
              <option value="cobrado"   ${t.estado_pago==='cobrado'?'selected':''}>Cobrado</option>
            </select>
          </div>
        </div>
        ${t.notas?`<div class="form-group"><label>Notas</label><p class="text-sm">${t.notas}</p></div>`:''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-wsp btn-sm" onclick="WhatsApp.enviarTurno(${JSON.stringify(t).replace(/"/g,"'")})">💬 WhatsApp</button>
        <button class="btn btn-danger btn-sm" onclick="Agenda.eliminar('${id}')">Eliminar</button>
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cerrar</button>
        <button class="btn btn-primary" onclick="Agenda.guardarDetalle('${id}')">Guardar</button>
      </div>`)
  },

  async cambiarEstado(id, estado) {
    try {
      await API.put('turnos', { id, estado })
      UI.closeModal(); UI.ok('Estado actualizado'); this.load()
    } catch(e) { UI.error(e.message) }
  },

  async guardarDetalle(id) {
    try {
      await API.put('turnos', {
        id,
        monto:       document.getElementById('det-monto').value || '',
        estado_pago: document.getElementById('det-pago').value
      })
      UI.closeModal(); UI.ok('Turno actualizado'); this.load()
    } catch(e) { UI.error(e.message) }
  },

  async eliminar(id) {
    const ok = await UI.confirm('¿Eliminar este turno?')
    if (!ok) return
    try { await API.del('turnos', id); UI.closeModal(); UI.ok('Turno eliminado'); this.load() }
    catch(e) { UI.error(e.message) }
  },

  async enviarWsp(id) {
    const t = this.turnos.find(x => x.id === id)
    if (t) await WhatsApp.enviarTurno(t)
  },

  async enviarTodos() {
    const pend = this.turnos.filter(t => t.estado === 'pendiente')
    if (!pend.length) { UI.warning('No hay turnos pendientes'); return }
    for (const t of pend) await WhatsApp.enviarTurno(t)
    UI.ok(`Recordatorios enviados: ${pend.length}`)
  }
}
