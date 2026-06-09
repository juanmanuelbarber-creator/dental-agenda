const Router = {
  pages: {
    agenda:    () => Agenda.render(),
    pacientes: () => Pacientes.render(),
    historial: () => Historial.render(),
    whatsapp:  () => WhatsApp.render(),
    admin:     () => Admin.render(),
  },
  init() {
    window.addEventListener('hashchange', () => this.route())
    this.route()
  },
  route() {
    const page = window.location.hash.replace('#','') || 'agenda'
    const fn   = this.pages[page] || this.pages.agenda
    document.querySelectorAll('.nav-item').forEach(el =>
      el.classList.toggle('active', el.dataset.page === (this.pages[page] ? page : 'agenda')))
    fn()
  },
  go(p) { window.location.hash = p }
}
