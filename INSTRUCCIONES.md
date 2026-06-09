# DentaAgenda — Instrucciones de setup

## Paso 1 — Apps Script (backend)

1. Ir a [script.google.com](https://script.google.com) → **Nuevo proyecto**
2. Borrar el código por defecto y pegar el contenido de `Code.gs`
3. Guardar el proyecto (ej: "DentaAgenda")
4. **Ejecutar → `setupSpreadsheet`**
   - La primera vez pedirá permisos → Permitir
   - Crea la Spreadsheet automáticamente con las 4 hojas
5. **Implementar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - Click **Implementar**
6. **Copiar la URL** que aparece

## Paso 2 — Configurar datos del dentista

Abrir `js/utils/config.js` y completar:

```js
const CONFIG = {
  nombre_dentista:    'Dr. Juan García',
  nombre_consultorio: 'Consultorio García',
  telefono:           '+54 9 351 123-4567',
}
```

## Paso 3 — Conectar la API

Abrir `js/utils/api.js` y reemplazar `TU_WEB_APP_URL_AQUI` con la URL copiada en el paso 1.

## Paso 4 — GitHub Pages

1. Crear repo en GitHub (ej: `dental-agenda`)
2. Subir todos los archivos
3. **Settings → Pages → Branch: main → / (root)** → Save
4. La app queda en `https://TU-USUARIO.github.io/dental-agenda`

---

## Hojas de la Spreadsheet

| Hoja | Contenido |
|------|-----------|
| Pacientes | Ficha completa de cada paciente |
| Turnos | Todos los turnos con estado y cobro |
| Historial | Notas clínicas por paciente |
| WspLog | Registro de mensajes de WhatsApp |

## Sobre WhatsApp

Los mensajes se abren en WhatsApp Web con el texto ya escrito.
El odontólogo solo presiona "Enviar" dentro de WhatsApp.
No requiere ninguna API paga.

## Para actualizar el script de Apps Script

Si modificás `Code.gs`, hay que hacer una **nueva implementación**
(Implementar → Administrar implementaciones → Nueva versión).
Solo guardar el archivo no actualiza el deploy.
