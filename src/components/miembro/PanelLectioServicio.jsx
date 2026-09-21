import { useState, useEffect, useRef } from 'react'
import API_URL from '../../config.js'

const VACIO = { titulo: '', archivo_url: '' }
const H = () => ({ 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id })
const HJ = () => ({ ...H(), 'Content-Type': 'application/json' })

function TabLectio() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const inputArchivo = useRef(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/lectio-servicio`, { headers: H() })
      const data = await res.json()
      setItems(data)
    } catch (e) { console.error(e) }
    setCargando(false)
  }

  const mostrarMensaje = (msg) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  const subirArchivo = async (archivo) => {
    if (!archivo) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('bucket', 'Biblioteca')
      fd.append('carpeta', 'lectio-servicio')
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd }).then(r => r.json())
      if (res.ok) setForm(f => ({ ...f, archivo_url: res.url }))
      else mostrarMensaje('❌ No se pudo subir el archivo')
    } catch { mostrarMensaje('❌ Error subiendo el archivo') }
    setSubiendo(false)
  }

  const guardar = async () => {
    if (!form.titulo || !form.archivo_url) {
      mostrarMensaje('⚠️ Título y archivo son obligatorios')
      return
    }
    setGuardando(true)
    try {
      const url = editandoId
        ? `${API_URL}/api/comunicaciones/lectio-servicio/${editandoId}`
        : `${API_URL}/api/comunicaciones/lectio-servicio`
      const method = editandoId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: HJ(), body: JSON.stringify(form) }).then(r => r.json())
      if (res.ok) {
        mostrarMensaje(editandoId ? '✅ Lectio actualizada' : '✅ Lectio agregada')
        setForm(VACIO)
        setEditandoId(null)
        cargar()
      } else {
        mostrarMensaje('❌ Error al guardar')
      }
    } catch { mostrarMensaje('❌ Error de conexión') }
    setGuardando(false)
  }

  const editar = (item) => {
    setForm({ titulo: item.titulo, archivo_url: item.archivo_url })
    setEditandoId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminar = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/comunicaciones/lectio-servicio/${id}`, { method: 'DELETE', headers: H() }).then(r => r.json())
      if (res.ok) { mostrarMensaje('✅ Lectio eliminada'); cargar() }
      else mostrarMensaje('❌ Error al eliminar')
    } catch { mostrarMensaje('❌ Error de conexión') }
    setConfirmEliminar(null)
  }

  const cancelar = () => { setForm(VACIO); setEditandoId(null) }

  return (
    <div>
      {mensaje && (
        <div className="mb-4 text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">
          {editandoId ? 'Editar Lectio' : 'Nueva Lectio'}
        </h3>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
            <input type="text" value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Lectio Servicio Septiembre 20-2026"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Archivo *</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => inputArchivo.current?.click()} disabled={subiendo}
                className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-xs hover:bg-gray-50 disabled:opacity-50">
                {subiendo ? 'Subiendo...' : form.archivo_url ? 'Cambiar archivo' : 'Subir archivo'}
              </button>
              {form.archivo_url && <span className="text-xs text-green-600">Archivo listo</span>}
              <input
                ref={inputArchivo}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => subirArchivo(e.target.files?.[0])}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={guardar} disabled={guardando || subiendo}
            className="bg-blue-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-900 disabled:opacity-50">
            {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Publicar'}
          </button>
          {editandoId && (
            <button onClick={cancelar}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-8 text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-lg border border-gray-200">No hay Lectios todavía</div>
          ) : items.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.titulo}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => editar(item)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                {confirmEliminar === item.id ? (
                  <span className="flex items-center gap-2">
                    <button onClick={() => eliminar(item.id)} className="text-red-600 hover:underline text-xs font-medium">Confirmar</button>
                    <button onClick={() => setConfirmEliminar(null)} className="text-gray-400 hover:underline text-xs">Cancelar</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmEliminar(item.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabEquipo() {
  const [equipo, setEquipo] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [mensaje, setMensaje] = useState('')

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }
  const nombre = (r) => [r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido].filter(Boolean).join(' ')

  const cargar = async () => {
    const data = await fetch(`${API_URL}/api/comunicaciones/equipo`, { headers: H() }).then(r => r.json()).catch(() => [])
    setEquipo(Array.isArray(data) ? data : [])
  }

  useEffect(() => { cargar() }, [])

  const buscar = async (q) => {
    setBusqueda(q)
    if (!q) return setResultados([])
    const data = await fetch(`${API_URL}/api/comunicaciones/buscar-servidor?q=${encodeURIComponent(q)}`, { headers: H() }).then(r => r.json()).catch(() => [])
    setResultados(Array.isArray(data) ? data.filter(r => !(r.roles || []).includes('responsable_comunicaciones')) : [])
  }

  const asignar = async (id) => {
    const res = await fetch(`${API_URL}/api/comunicaciones/asignar-rol/${id}`, { method: 'PUT', headers: H() }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { setBusqueda(''); setResultados([]); await cargar(); msg('✅ Acceso otorgado') }
    else msg('❌ Error al asignar')
  }

  const quitar = async (id) => {
    if (!confirm('¿Quitar el acceso de Lectio del Servicio a este servidor?')) return
    const res = await fetch(`${API_URL}/api/comunicaciones/quitar-rol/${id}`, { method: 'PUT', headers: H() }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { await cargar(); msg('✅ Acceso retirado') }
    else msg('❌ Error')
  }

  return (
    <div>
      <h3 className="font-bold text-blue-800 text-base mb-4">Equipo de comunicaciones</h3>
      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Agregar servidor al equipo</label>
        <input value={busqueda} onChange={e => buscar(e.target.value)}
          placeholder="Buscar por nombre o cédula..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {resultados.length > 0 && (
          <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden">
            {resultados.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-800">{nombre(r)}</p>
                  <p className="text-xs text-gray-400">{r.numero_identificacion}</p>
                </div>
                <button onClick={() => asignar(r.id)} className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700">Agregar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h4 className="font-semibold text-gray-700 text-sm mb-2">Con acceso actual</h4>
      {equipo.length === 0 ? (
        <p className="text-sm text-gray-400">Solo tú tienes acceso por ahora</p>
      ) : (
        <div className="space-y-2">
          {equipo.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{nombre(r)}</p>
                <p className="text-xs text-gray-400">{r.numero_identificacion}</p>
              </div>
              <button onClick={() => quitar(r.id)} className="text-xs text-red-400 hover:text-red-600">Quitar acceso</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PanelLectioServicio() {
  const [tab, setTab] = useState('lectio')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-1">Lectio del Servicio</h2>
      <p className="text-xs text-gray-500 mb-4">Lo que agregues aquí aparece automáticamente en la Biblioteca de la página web.</p>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('lectio')}
          className={`text-sm px-3 py-2 border-b-2 ${tab === 'lectio' ? 'border-blue-600 text-blue-800 font-medium' : 'border-transparent text-gray-500'}`}>
          Lectios
        </button>
        <button onClick={() => setTab('equipo')}
          className={`text-sm px-3 py-2 border-b-2 ${tab === 'equipo' ? 'border-blue-600 text-blue-800 font-medium' : 'border-transparent text-gray-500'}`}>
          Equipo
        </button>
      </div>

      {tab === 'lectio' && <TabLectio />}
      {tab === 'equipo' && <TabEquipo />}
    </div>
  )
}
