const Pacientes = {
  render() {
    document.getElementById('page').innerHTML = `
      <div class="page-header">
        <h1>Pacientes</h1>
        <div class="header-actions">
          <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar..." oninput="Pacientes.buscar(this.value)">
          </div>
          <button class="btn btn-primary" onclick="Pacientes.modalNuevo()">+ Nuevo paciente</button>
        </div>
      </div>
      <div class="page-content">
        <div class="card" style="padding:0;overflow:hidden">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Paciente</th><th>Teléfono</th><th>Obra social</th><th>Alergias</th><th></th></tr></thead>
              <tbody id="pac-tbody"><tr><td colspan="5" class="loading">Cargando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`
    this.load()
  },

  async load(q = '') {
    try {
      const params = {}
      if (q) params.q = q
      const data = await API.get('pacientes', params)
      this._data = data
      const tb   = document.getElementById('pac-tbody')
      if (!tb) return
      if (!data.length) {
        tb.innerHTML = `<tr><td colspan="5" class="loading">No hay pacientes.</td></tr>`; return
      }
      tb.innerHTML = data.map(p => `
        <tr onclick="Historial.verPaciente('${p.id}');Router.go('historial')">
          <td><div style="display:flex;align-items:center;gap:10px">${UI.avatar(p.nombre,34)}<div><div style="font-weight:500">${p.nombre}</div><div class="text-xs text-3">${p.dni?'DNI '+p.dni:''}</div></div></div></td>
          <td class="text-sm">${p.telefono||'—'}</td>
          <td class="text-sm">${p.obra_social||'—'}</td>
          <td class="text-sm" style="color:var(--danger-c)">${p.alergias||'—'}</td>
          <td onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-secondary" onclick="Pacientes.modalEditar('${p.id}')">✏</button>
            <button class="btn btn-sm btn-primary" style="margin-left:4px" onclick="Agenda.modalNuevo('${p.id}');Router.go('agenda')">+ Turno</button>
          </td>
        </tr>`).join('')
    } catch(e) { UI.error(e.message) }
  },

  buscar(q) { clearTimeout(this._t); this._t = setTimeout(() => this.load(q), 350) },

  modalNuevo(returnToAgenda = false) {
    UI.openModal(`
      <div class="modal-header"><h2>Nuevo paciente</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
      <div class="modal-body">
        <div class="form-row-2">
          <div class="form-group"><label>Nombre completo *</label><input id="np-nombre" type="text"></div>
          <div class="form-group"><label>DNI</label><input id="np-dni" type="text"></div>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>Teléfono (WhatsApp) *</label><input id="np-tel" type="text" placeholder="+54 9 351..."></div>
          <div class="form-group"><label>Fecha de nacimiento</label><input id="np-nac" type="date"></div>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>Email</label><input id="np-email" type="email"></div>
          <div class="form-group"><label>Obra social</label><input id="np-os" type="text"></div>
        </div>
        <div class="form-group"><label>Alergias / antecedentes</label><textarea id="np-alergias" rows="2" placeholder="Alergias a medicamentos, condiciones relevantes..."></textarea></div>
        <div class="form-group"><label>Notas</label><textarea id="np-notas" rows="2"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pacientes.guardar(${returnToAgenda})">Guardar</button>
      </div>`)
  },

  async guardar(returnToAgenda = false) {
    const nombre   = document.getElementById('np-nombre').value.trim()
    const telefono = document.getElementById('np-tel').value.trim()
    if (!nombre)   { UI.error('El nombre es obligatorio'); return }
    if (!telefono) { UI.error('El teléfono es obligatorio'); return }
    try {
      const p = await API.post('pacientes', {
        nombre, telefono,
        dni:         document.getElementById('np-dni').value.trim(),
        email:       document.getElementById('np-email').value.trim(),
        fecha_nac:   document.getElementById('np-nac').value,
        obra_social: document.getElementById('np-os').value.trim(),
        alergias:    document.getElementById('np-alergias').value.trim(),
        notas:       document.getElementById('np-notas').value.trim(),
      })
      UI.closeModal(); UI.ok('Paciente creado')
      if (returnToAgenda) { Agenda.modalNuevo(p.id); Router.go('agenda'); return }
      this.load()
    } catch(e) { UI.error(e.message) }
  },

  async modalEditar(id) {
    try {
      const p    = (this._data || []).find(x => x.id === id)
      if (!p) { UI.error('No encontrado'); return }
      UI.openModal(`
        <div class="modal-header"><h2>Editar: ${p.nombre}</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group"><label>Nombre *</label><input id="ep-nombre" value="${p.nombre||''}"></div>
            <div class="form-group"><label>DNI</label><input id="ep-dni" value="${p.dni||''}"></div>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>Teléfono *</label><input id="ep-tel" value="${p.telefono||''}"></div>
            <div class="form-group"><label>Fecha nac.</label><input type="date" id="ep-nac" value="${p.fecha_nac||''}"></div>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>Email</label><input id="ep-email" value="${p.email||''}"></div>
            <div class="form-group"><label>Obra social</label><input id="ep-os" value="${p.obra_social||''}"></div>
          </div>
          <div class="form-group"><label>Alergias</label><textarea id="ep-alergias" rows="2">${p.alergias||''}</textarea></div>
          <div class="form-group"><label>Notas</label><textarea id="ep-notas" rows="2">${p.notas||''}</textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger btn-sm" onclick="Pacientes.eliminar('${id}')">Eliminar</button>
          <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="Pacientes.update('${id}')">Guardar cambios</button>
        </div>`)
    } catch(e) { UI.error(e.message) }
  },

  async update(id) {
    try {
      await API.put('pacientes', {
        id,
        nombre:      document.getElementById('ep-nombre').value.trim(),
        dni:         document.getElementById('ep-dni').value.trim(),
        telefono:    document.getElementById('ep-tel').value.trim(),
        fecha_nac:   document.getElementById('ep-nac').value,
        email:       document.getElementById('ep-email').value.trim(),
        obra_social: document.getElementById('ep-os').value.trim(),
        alergias:    document.getElementById('ep-alergias').value.trim(),
        notas:       document.getElementById('ep-notas').value.trim(),
      })
      UI.closeModal(); UI.ok('Paciente actualizado'); this.load()
    } catch(e) { UI.error(e.message) }
  },

  async eliminar(id) {
    const ok = await UI.confirm('¿Eliminar este paciente y todos sus datos?')
    if (!ok) return
    try { await API.del('pacientes', id); UI.closeModal(); UI.ok('Eliminado'); this.load() }
    catch(e) { UI.error(e.message) }
  }
}
