// Importar Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuración de Supabase
const supabaseUrl = 'https://wgimbwzhxwxmcneekuen.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaW1id3poeHd4bWNuZWVrdWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODk2NjEsImV4cCI6MjA4MzE2NTY2MX0.79xbkg9rhDdIZoThUvB5IMpT0rqXag1wjzNmoSvR62E'
const supabase = createClient(supabaseUrl, supabaseKey)

// LOGIN CON DISCORD
const loginBtn = document.getElementById('login-btn')
const reportanteInput = document.getElementById('reportante') // input oculto en reportar.html

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'discord' })
    if (error) console.log('Error login:', error)
    else {
      console.log('Redirigiendo a Discord...', data)

      // Obtener información del usuario logueado
      const { data: { session } } = await supabase.auth.getSession()
      if (session && session.user) {
        // Usamos email o nombre del usuario como reportante
        const username = session.user.user_metadata.full_name || session.user.email
        if (reportanteInput) reportanteInput.value = username
      }
    }
  })
}

// ENVÍO DE REPORTES DESDE reportar.html
const form = document.getElementById('report-form')
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const reporte = Object.fromEntries(formData)

    // Agregar fecha y estado automáticamente
    reporte.fecha = new Date().toISOString()
    reporte.estado = 'pendiente'

    // Enviar a Supabase
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
    try {
      // Traer reportes
      const { data: reportes, error: reportesError } = await supabase.from('reportes').select('*').order('fecha', { ascending: false })
      if (reportesError) throw reportesError

      if (reportes.length === 0) {
        reportesList.innerHTML = '<p>No hay reportes por mostrar.</p>'
        return
      }

      // Mapear y mostrar reportes
      reportesList.innerHTML = reportes.map(r => `
        <div class="reporte">
          <p><strong>Usuario que reporta:</strong> ${r.reportante || 'N/A'}</p>
          <p><strong>Usuario reportado:</strong> ${r.usuario_reportado}</p>
          <p><strong>Motivo:</strong> ${r.motivo}</p>
          <p><strong>Contexto:</strong> ${r.contexto || 'N/A'}</p>
          <p><strong>Descripción:</strong> ${r.descripcion}</p>
          <p><strong>Evidencia:</strong> ${r.evidencia || 'N/A'}</p>
          <p><strong>Estado:</strong> ${r.estado}</p>
          <p><strong>Fecha:</strong> ${new Date(r.fecha).toLocaleString()}</p>
        </div>
        <hr>
      `).join('')
    } catch (error) {
      console.log('Error cargando reportes:', error)
      reportesList.innerHTML = '<p>Error cargando reportes.</p>'
    }
  }

  // Cargar reportes al iniciar
  fetchReportes()
}



