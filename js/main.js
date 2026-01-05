// Importar Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://wgimbwzhxwxmcneekuen.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaW1id3poeHd4bWNuZWVrdWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODk2NjEsImV4cCI6MjA4MzE2NTY2MX0.79xbkg9rhDdIZoThUvB5IMpT0rqXag1wjzNmoSvR62E' // Reemplazá con tu ANON KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const loginBtn = document.getElementById('login-btn')
const reportanteInput = document.getElementById('reportante')
const sancionesSelect = document.getElementById('sanciones')
const form = document.getElementById('report-form')
const reportesList = document.getElementById('reportes-list')

// LOGIN CON DISCORD
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'discord' })
    if (error) console.log('Error login:', error)
    else {
      console.log('Redirigiendo a Discord...', data)
      const { data: { session } } = await supabase.auth.getSession()
      if (session && session.user) {
        const username = session.user.user_metadata.full_name || session.user.email
        if (reportanteInput) reportanteInput.value = username
      }
    }
  })
}

// CARGAR SANCIONES DESDE SUPABASE
const cargarSanciones = async () => {
  if (!sancionesSelect) return
  try {
    const { data: sanciones, error } = await supabase.from('sanciones').select('*')
    if (error) throw error

    sanciones.forEach(s => {
      const option = document.createElement('option')
      option.value = s.id
      option.textContent = `${s.categoria} - ${s.regla} (${s.tiempo})`
      sancionesSelect.appendChild(option)
    })
  } catch (err) {
    console.log('Error cargando sanciones:', err)
  }
}
cargarSanciones()

// ENVÍO DE REPORTES
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const reporte = Object.fromEntries(formData)

    const selectedOptions = Array.from(sancionesSelect.selectedOptions).map(o => o.value)
    reporte.sanciones = selectedOptions

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

// PANEL STAFF
let lastReportIds = []

const fetchReportes = async () => {
  if (!reportesList) return
  try {
    const { data: reportes, error } = await supabase
      .from('reportes')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) throw error

    if (!reportes || reportes.length === 0) {
      reportesList.innerHTML = '<p>No hay reportes por mostrar.</p>'
      lastReportIds = []
      return
    }

    // Traer todas las sanciones para mapear IDs
    const { data: sancionesData } = await supabase.from('sanciones').select('*')
    const sancionesMap = {}
    sancionesData.forEach(s => sancionesMap[s.id] = `${s.categoria} - ${s.regla} (${s.tiempo})`)

    // Generar HTML
    reportesList.innerHTML = reportes.map(r => {
      const sancionesTexto = (r.sanciones || []).map(id => sancionesMap[id] || id).join(', ')
      const isNew = !lastReportIds.includes(r.id)
      const clase = isNew ? 'reporte nuevo' : 'reporte'

      return `
        <div class="${clase}" data-id="${r.id}">
          <p><strong>Usuario que reporta:</strong> ${r.reportante || 'N/A'}</p>
          <p><strong>Usuario reportado:</strong> ${r.usuario_reportado}</p>
          <p><strong>Motivo:</strong> ${r.motivo}</p>
          <p><strong>Contexto:</strong> ${r.contexto || 'N/A'}</p>
          <p><strong>Descripción:</strong> ${r.descripcion}</p>
          <p><strong>Evidencia:</strong> ${r.evidencia || 'N/A'}</p>
          <p><strong>Sanciones:</strong> ${sancionesTexto || 'N/A'}</p>
          <p><strong>Estado:</strong> ${r.estado}</p>
          <p><strong>Fecha:</strong> ${new Date(r.fecha).toLocaleString()}</p>
        </div>
        <hr>
      `
    }).join('')

    // Actualizar IDs para next fetch
    lastReportIds = reportes.map(r => r.id)

    // Quitar clase "nuevo" después de 30 segundos
    document.querySelectorAll('.reporte.nuevo').forEach(el => {
      setTimeout(() => {
        el.classList.remove('nuevo')
      }, 30000)
    })

  } catch (err) {
    console.log('Error cargando reportes:', err)
    reportesList.innerHTML = '<p>Error cargando reportes.</p>'
  }
}

// Cargar reportes al iniciar
fetchReportes()

// Polling cada 10 segundos para ver reportes nuevos
setInterval(fetchReportes, 10000)







