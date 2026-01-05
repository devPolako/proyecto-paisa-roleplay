// Importar Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuración de Supabase
const supabaseUrl = 'TU_SUPABASE_URL'     // <-- Poné tu URL de Supabase
const supabaseKey = 'TU_ANON_KEY'         // <-- Poné tu ANON KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// LOGIN CON DISCORD
const loginBtn = document.getElementById('login-btn')
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'discord' })
    if (error) console.log('Error login:', error)
    else console.log('Redirigiendo a Discord...', data)
  })
}

// ENVÍO DE REPORTES DESDE reportar.html
const form = document.getElementById('report-form')
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const reporte = Object.fromEntries(formData)

    // Agregar fecha automáticamente
    reporte.fecha = new Date().toISOString()
    reporte.estado = 'pendiente'

    const { data, error } = await supabase.from('reportes').insert([reporte])
    if (error) alert('Error al enviar el reporte: ' + error.message)
    else {
      alert('Reporte enviado correctamente!')
      form.reset()
    }
  })
}

// MOSTRAR REPORTES EN panel.html
const reportesList = document.getElementById('reportes-list')
if (reportesList) {
  const fetchReportes = async () => {
    const { data: reportes, error } = await supabase.from('reportes').select('*')
    if (error) reportesList.innerHTML = `<p>Error cargando reportes: ${error.message}</p>`
    else if (reportes.length === 0) reportesList.innerHTML = '<p>No hay reportes por mostrar.</p>'
    else {
      reportesList.innerHTML = reportes.map(r => `
        <div class="reporte">
          <p><strong>Usuario:</strong> ${r.usuario_reportado}</p>
          <p><strong>Motivo:</strong> ${r.motivo}</p>
          <p><strong>Descripción:</strong> ${r.descripcion}</p>
          <p><strong>Evidencia:</strong> ${r.evidencia || 'N/A'}</p>
          <p><strong>Estado:</strong> ${r.estado}</p>
          <p><strong>Fecha:</strong> ${new Date(r.fecha).toLocaleString()}</p>
        </div>
        <hr>
      `).join('')
    }
  }

  // Cargar reportes al iniciar
  fetchReportes()
}
