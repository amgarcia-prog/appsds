import { useState, useEffect, useRef } from 'react'
import API_URL from '../../config.js'

const VACIO = { titulo: '', extracto: '', imagen_url: '', enlace: '' }
const H = () => ({ 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id })
const HJ = () => ({ ...H(), 'Content-Type': 'application/json' })

export default function PanelPublicaciones() {
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const inputArchivo = useRef(null)
  const inputDocumento = useRef(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/publicaciones`, { headers: H() })
      const data = await res.json()
      setPublicaciones(data)
    } catch (e) { console.error(e) }
    setCargando(false)
  }

  const mostrarMensaje = (msg) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  const subirImagen = async (archivo) => {
    if (!archivo) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('bucket', 'Publicaciones')
      fd.append('carpeta', 'noticias')
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd }).then(r => r.json())
      if (res.ok) setForm(f => ({ ...f, imagen_url: res.url }))
      else mostrarMensaje('❌ No se pudo subir la imagen')
    } catch { mostrarMensaje('❌ Error subiendo la imagen') }
    setSubiendo(false)
  }

  const subirDocumento = async (archivo) => {
    if (!archivo) return
    setSubiendoDoc(true)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('bucket', 'Publicaciones')
      fd.append('carpeta', 'documentos')
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd }).then(r => r.json())
      if (res.ok) setForm(f => ({ ...f, enlace: res.url }))
      else mostrarMensaje('❌ No se pudo subir el documento')
    } catch { mostrarMensaje('❌ Error subiendo el documento') }
    setSubiendoDoc(false)
  }

  const guardar = async () => {
    if (!form.titulo || !form.extracto) {
      mostrarMensaje('⚠️ Título y extracto son obligatorios')
      return
    }
    setGuardando(true)
    try {
      const url = editandoId
        ? `${API_URL}/api/admin/publicaciones/${editandoId}`
        : `${API_URL}/api/admin/publicaciones`
      const method = editandoId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: HJ(), body: JSON.stringify(form) }).then(r => r.json())
      if (res.ok) {
        mostrarMensaje(editandoId ? '✅ Publicación actualizada' : '✅ Publicación agregada')
        setForm(VACIO)
        setEditandoId(null)
        cargar()
      } else {
        mostrarMensaje('❌ Error al guardar')
      }
    } catch { mostrarMensaje('❌ Error de conexión') }
    setGuardando(false)
  }

  const editar = (pub) => {
    setForm({ titulo: pub.titulo, extracto: pub.extracto, imagen_url: pub.imagen_url || '', enlace: pub.enlace || '' })
    setEditandoId(pub.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminar = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/publicaciones/${id}`, { method: 'DELETE', headers: H() }).then(r => r.json())
      if (res.ok) { mostrarMensaje('✅ Publicación eliminada'); cargar() }
      else mostrarMensaje('❌ Error al eliminar')
    } catch { mostrarMensaje('❌ Error de conexión') }
    setConfirmEliminar(null)
  }

  const cancelar = () => { setForm(VACIO); setEditandoId(null) }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-1">Publicaciones</h2>
      <p className="text-xs text-gray-500 mb-4">Lo que agregues aquí aparece automáticamente en el inicio de la página web.</p>

      {mensaje && (
        <div className="mb-4 text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">
          {editandoId ? 'Editar publicación' : 'Nueva publicación'}
        </h3>
        <div className="grid grid-cols-[120px_1fr] gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Imagen</label>
            <div
              onClick={() => inputArchivo.current?.click()}
              className="w-full h-[90px] border border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50"
            >
              {form.imagen_url ? (
                <img src={form.imagen_url} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-1">{subiendo ? 'Subiendo...' : 'Subir imagen'}</span>
              )}
            </div>
            <input
              ref={inputArchivo}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => subirImagen(e.target.files?.[0])}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
              <input type="text" value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Título de la publicación"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Extracto *</label>
              <textarea value={form.extracto}
                onChange={e => setForm(f => ({ ...f, extracto: e.target.value }))}
                placeholder="Resumen corto"
                rows={2}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Enlace (opcional)</label>
              <div className="flex gap-2">
                <input type="text" value={form.enlace}
                  onChange={e => setForm(f => ({ ...f, enlace: e.target.value }))}
                  placeholder="https://... o sube un documento"
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="button" onClick={() => inputDocumento.current?.click()} disabled={subiendoDoc}
                  className="shrink-0 border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-xs hover:bg-gray-50 disabled:opacity-50">
                  {subiendoDoc ? 'Subiendo...' : 'Subir documento'}
                </button>
                <input
                  ref={inputDocumento}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => subirDocumento(e.target.files?.[0])}
                />
              </div>
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
          {publicaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-lg border border-gray-200">No hay publicaciones</div>
          ) : publicaciones.map(pub => (
            <div key={pub.id} className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3">
              <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {pub.imagen_url && <img src={pub.imagen_url} alt="" className="w-full h-full object-contain" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{pub.titulo}</p>
                <p className="text-xs text-gray-500 truncate">{pub.extracto}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(pub.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => editar(pub)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                {confirmEliminar === pub.id ? (
                  <span className="flex items-center gap-2">
                    <button onClick={() => eliminar(pub.id)} className="text-red-600 hover:underline text-xs font-medium">Confirmar</button>
                    <button onClick={() => setConfirmEliminar(null)} className="text-gray-400 hover:underline text-xs">Cancelar</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmEliminar(pub.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
