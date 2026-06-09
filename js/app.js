// =============================================
//  App — un solo odontólogo, sin consultorios
// =============================================
const App = {

  async init() {
    try {
      // Verificar que la API esté configurada
      await API.get('stats')
    } catch(e) {
      document.getElementById('page').innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:80vh">
          <div style="text-align:center;max-width:400px">
            <div style="font-size:48px;margin-bottom:1rem">⚙️</div>
            <h2 style="margin-bottom:.75rem">Configuración pendiente</h2>
            <p style="color:var(--text-2);font-size:14px;line-height:1.6">
              Abrí <code style="background:var(--surface-2);padding:2px 6px;border-radius:4px">js/utils/api.js</code>
              y reemplazá <code style="background:var(--surface-2);padding:2px 6px;border-radius:4px">TU_WEB_APP_URL_AQUI</code>
              con la URL de tu Web App de Apps Script.
            </p>
            <p style="margin-top:1rem;font-size:13px;color:var(--text-3)">Ver INSTRUCCIONES.md para el paso a paso.</p>
          </div>
        </div>`
      return
    }
    Router.init()
  }
}

document.addEventListener('DOMContentLoaded', () => App.init())
