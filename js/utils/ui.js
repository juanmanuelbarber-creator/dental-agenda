const UI = {
  toast(msg, type = '', ms = 3500) {
    const a = document.getElementById('toast-area')
    const t = document.createElement('div')
    t.className = `toast ${type}`
    t.textContent = msg
    a.appendChild(t)
    setTimeout(() => t.remove(), ms)
  },
  ok(msg)      { this.toast('✓ ' + msg, 'ok') },
  error(msg)   { this.toast('✗ ' + msg, 'error') },
  warning(msg) { this.toast('⚠ ' + msg, 'warning') },

  openModal(html) {
    document.getElementById('modal-box').innerHTML = html
    document.getElementById('modal-overlay').classList.remove('hidden')
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden')
    document.getElementById('modal-box').innerHTML = ''
  },

  avatarColor(n) {
    const cls = ['av-teal','av-blue','av-amber','av-pink','av-purple']
    let h = 0; for (const c of (n||'')) h += c.charCodeAt(0)
    return cls[h % cls.length]
  },
  initials(n) {
    if (!n) return '?'
    const p = n.trim().split(' ')
    return (p[0][0] + (p[1]?.[0]||'')).toUpperCase()
  },
  avatar(n, s = 36) {
    return `<div class="avatar ${this.avatarColor(n)}" style="width:${s}px;height:${s}px;font-size:${s<40?'13px':'15px'}">${this.initials(n)}</div>`
  },

  badgeTurno(e) {
    const m = {
      pendiente:  ['badge-warning','Sin confirmar'],
      confirmado: ['badge-success','Confirmado'],
      en_sala:    ['badge-info','En sala'],
      atendido:   ['badge-neutral','Atendido'],
      cancelado:  ['badge-danger','Cancelado'],
      ausente:    ['badge-danger','Ausente'],
    }
    const [cls, label] = m[e] || ['badge-neutral', e]
    return `<span class="badge ${cls}">${label}</span>`
  },
  badgePago(e) {
    const m = { cobrado:['badge-success','Cobrado'], pendiente:['badge-warning','Pendiente'], seña:['badge-info','Seña'] }
    const [cls, label] = m[e] || ['badge-neutral', e]
    return `<span class="badge ${cls}">${label}</span>`
  },

  async confirm(msg) {
    return new Promise(resolve => {
      this.openModal(`
        <div class="modal-header"><h2>Confirmar acción</h2></div>
        <div class="modal-body"><p>${msg}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="UI.closeModal();window.__cr(false)">Cancelar</button>
          <button class="btn btn-danger"    onclick="UI.closeModal();window.__cr(true)">Confirmar</button>
        </div>`)
      window.__cr = resolve
    })
  }
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) UI.closeModal()
})
