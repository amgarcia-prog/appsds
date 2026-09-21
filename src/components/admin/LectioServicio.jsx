import { useState, useEffect, useRef } from 'react'
import API_URL from '../../config.js'

const VACIO = { titulo: '', archivo_url: '' }

export default function LectioServicio() {
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
      const res = await fetch(`${API_URL}/api/lectio-servicio`, { headers: { 'x-admin-key': 'SDS2026admin' } })
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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'SDS2026admin' },
        body: JSON.stringify(form),
      }).then(r => r.json())
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
      const res = await fetch(`${API_URL}/api/comunicaciones/lectio-servicio/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'SDS2026admin' },
      }).then(r => r.json())
      if (res.ok) { mostrarMensaje('✅ Lectio eliminada'); cargar() }
      else mostrarMensaje('❌ Error al eliminar')
    } catch { mostrarMensaje('❌ Error de conexión') }
    setConfirmEliminar(null)
  }

  const cancelar = () => { setForm(VACIO); setEditandoId(null) }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-1">Lectio del Servicio</h2>
      <p className="text-xs text-gray-500 mb-4">Lo que agregues aquí aparece automáticamente en la Biblioteca de la página web.</p>

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
