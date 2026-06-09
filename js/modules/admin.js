const Admin = {
  data: [],
  filtro: 'todos',

  render() {
    const mesActual = D.today().substring(0,7)
    document.getElementById('page').innerHTML = `
      <div class="page-header">
        <h1>Administración</h1>
        <div class="header-actions">
          <select id="adm-mes" onchange="Admin.load()" style="padding:7px 11px;border:1px solid var(--border);border-radius:var(--r-md);font-family:var(--font);font-size:13px">
            ${this.mesesOpts()}
          </select>
        </div>
      </div>
      <div class="page-content">
        <div id="adm-stats" class="stats-grid"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
          <h3 style="font-size:14px;font-weight:600">Detalle de cobros</h3>
          <div class="chips" style="margin:0">
            <span class="chip active" onclick="Admin.setFiltro('todos',this)">Todos</span>
            <span class="chip" onclick="Admin.setFiltro('cobrado',this)">Cobrados</span>
            <span class="chip" onclick="Admin.setFiltro('pend',this)">Pendientes de cobro</span>
          </div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Paciente</th><th>Tratamiento</th><th>Estado</th><th>Pago</th><th>Monto</th><th></th></tr></thead>
              <tbody id="adm-tbody"><tr><td colspan="7" class="loading">Cargando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`
    this.load()
  },

  mesesOpts() {
    const opts = []
    const now  = new Date()
    for (let i = 0; i < 12; i++) {
      const d   = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      opts.push(`<option value="${val}" ${i===0?'selected':''}>${D.monthLabel(val+'-01')}</option>`)
    }
    return opts.join('')
  },

  async load() {
    const mes = document.getElementById('adm-mes')?.value
    if (!mes) return
    try {
      this.data  = data
      this.renderStats(mes)
      this.renderTabla()
    } catch(e) { UI.error(e.message) }
  },

  renderStats(mes) {
    const d         = this.data
    const atendidos = d.filter(t => t.estado === 'atendido')
    const cobrados  = d.filter(t => t.estado_pago === 'cobrado')
    const pendCobro = atendidos.filter(t => t.estado_pago !== 'cobrado')
    const ingresos  = cobrados.reduce((s,t)=>s+(parseFloat(t.monto)||0),0)
    const pendMonto = pendCobro.reduce((s,t)=>s+(parseFloat(t.monto)||0),0)
    const cancel    = d.filter(t=>t.estado==='cancelado'||t.estado==='ausente')
    const tasa      = d.length ? Math.round(atendidos.length/d.length*100) : 0

    document.getElementById('adm-stats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Turnos totales</div><div class="stat-value">${d.length}</div></div>
      <div class="stat-card"><div class="stat-label">Atendidos</div><div class="stat-value">${atendidos.length}</div></div>
      <div class="stat-card"><div class="stat-label">Ingresos cobrados</div><div class="stat-value" style="font-size:20px">$${ingresos.toLocaleString('es-AR')}</div></div>
      <div class="stat-card"><div class="stat-label">Pendiente cobro</div><div class="stat-value" style="font-size:20px;color:var(--warning-c)">$${pendMonto.toLocaleString('es-AR')}</div></div>
      <div class="stat-card"><div class="stat-label">Cancelaciones</div><div class="stat-value">${cancel.length}</div></div>
      <div class="stat-card"><div class="stat-label">Tasa asistencia</div><div class="stat-value">${tasa}%</div></div>`
  },

  renderTabla() {
    let lista = this.data
    if (this.filtro === 'cobrado') lista = lista.filter(t => t.estado_pago === 'cobrado')
    if (this.filtro === 'pend')    lista = lista.filter(t => t.estado==='atendido' && t.estado_pago!=='cobrado')
    const tb = document.getElementById('adm-tbody')
    if (!tb) return
    if (!lista.length) { tb.innerHTML = '<tr><td colspan="7" class="loading">Sin registros.</td></tr>'; return }
    tb.innerHTML = lista.map(t => `<tr>
      <td class="text-sm">${D.short(t.fecha)}</td>
      <td style="font-weight:500">${t.paciente_nombre||'—'}</td>
      <td class="text-sm">${t.tratamiento||'—'}</td>
      <td>${UI.badgeTurno(t.estado)}</td>
      <td>${UI.badgePago(t.estado_pago)}</td>
      <td class="text-sm font-mono">${t.monto?'$'+parseFloat(t.monto).toLocaleString('es-AR'):'—'}</td>
      <td>${t.estado==='atendido'&&t.estado_pago!=='cobrado'?`<button class="btn btn-sm btn-success" onclick="Admin.cobrar('${t.id}')">Cobrar</button>`:''}</td>
    </tr>`).join('')
  },

  setFiltro(f, el) {
    this.filtro = f
    document.querySelectorAll('#page .chips .chip').forEach(c=>c.classList.remove('active'))
    el.classList.add('active')
    this.renderTabla()
  },

  async cobrar(id) {
    const monto = prompt('Monto cobrado ($):')
    if (monto === null) return
    try {
      await API.put('turnos', { id, monto: monto||'0', estado_pago: 'cobrado', estado: 'atendido' })
      UI.ok('Cobro registrado'); this.load()
    } catch(e) { UI.error(e.message) }
  }
}
