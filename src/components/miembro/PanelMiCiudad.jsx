import { useState, useEffect, useRef } from 'react'
import API_URL from '../../config.js'

const H = () => ({ 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id })
const HJ = () => ({ ...H(), 'Content-Type': 'application/json' })
const VACIO_SERVICIO = { punto_servicio_id: '', nombre: '', nombreOtro: '', horario: '', descripcion: '', direccion: '', telefono: '', fotos: [] }

function FotosMultiples({ fotos, onChange, subiendo, onSubir }) {
  const inputRef = useRef(null)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Fotos</label>
      <div className="flex flex-wrap gap-2">
        {fotos.map((url, i) => (
          <div key={url} className="relative w-20 h-20 rounded overflow-hidden border border-gray-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(fotos.filter((_, j) => j !== i))}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
              ✕
            </button>
          </div>
        ))}
        <div onClick={() => inputRef.current?.click()}
          className="w-20 h-20 border border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer bg-gray-50 text-xs text-gray-400 text-center px-1">
          {subiendo ? 'Subiendo...' : '+ Foto'}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files?.[0]) onSubir(e.target.files[0]); e.target.value = '' }} />
      </div>
    </div>
  )
}

export default function PanelMiCiudad() {
  const [ciudad, setCiudad] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [historia, setHistoria] = useState('')
  const [historiaFotos, setHistoriaFotos] = useState([])
  const [subiendoHistoria, setSubiendoHistoria] = useState(false)
  const [guardandoHistoria, setGuardandoHistoria] = useState(false)

  const [puntos, setPuntos] = useState([])
  const [servicios, setServicios] = useState([])
  const [form, setForm] = useState(VACIO_SERVICIO)
  const [editandoId, setEditandoId] = useState(null)
  const [subiendoServicio, setSubiendoServicio] = useState(false)
  const [guardandoServicio, setGuardandoServicio] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const c = await fetch(`${API_URL}/api/mi-ciudad/contenido`, { headers: H() }).then(r => r.json())
      setCiudad(c.ciudad || '')
      setSubtitulo(c.subtitulo || '')
      setHistoria(c.historia || '')
      setHistoriaFotos(c.historia_fotos || [])

      const s = await fetch(`${API_URL}/api/mi-ciudad/servicios`, { headers: H() }).then(r => r.json())
      setServicios(Array.isArray(s) ? s : [])

      if (c.ciudad) {
        const p = await fetch(`${API_URL}/api/puntos-servicio?ciudad=${encodeURIComponent(c.ciudad)}`).then(r => r.json())
        setPuntos(Array.isArray(p) ? p : [])
      }
    } catch (e) { console.error(e) }
    setCargando(false)
  }

  const subirFotoHistoria = async (archivo) => {
    setSubiendoHistoria(true)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('bucket', 'Publicaciones')
      fd.append('carpeta', 'ciudades/historia')
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd }).then(r => r.json())
      if (res.ok) setHistoriaFotos(f => [...f, res.url])
      else msg('❌ No se pudo subir la foto')
    } catch { msg('❌ Error subiendo la foto') }
    setSubiendoHistoria(false)
  }

  const guardarHistoria = async () => {
    setGuardandoHistoria(true)
    try {
      const res = await fetch(`${API_URL}/api/mi-ciudad/contenido`, {
        method: 'PUT', headers: HJ(),
        body: JSON.stringify({ subtitulo, historia, historia_fotos: historiaFotos }),
      }).then(r => r.json())
      msg(res.ok ? '✅ Historia guardada' : '❌ Error al guardar')
    } catch { msg('❌ Error de conexión') }
    setGuardandoHistoria(false)
  }

  const subirFotoServicio = async (archivo) => {
    setSubiendoServicio(true)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('bucket', 'Publicaciones')
      fd.append('carpeta', 'ciudades/servicios')
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd }).then(r => r.json())
      if (res.ok) setForm(f => ({ ...f, fotos: [...f.fotos, res.url] }))
      else msg('❌ No se pudo subir la foto')
    } catch { msg('❌ Error subiendo la foto') }
    setSubiendoServicio(false)
  }

  const guardarServicio = async () => {
    const puntoSeleccionado = puntos.find(p => p.id === form.punto_servicio_id)
    const nombre = form.punto_servicio_id === 'otro' ? form.nombreOtro.trim() : (puntoSeleccionado?.nombre || form.nombre)
    if (!nombre) return msg('⚠️ Selecciona un punto de servicio o escribe un nombre')
    setGuardandoServicio(true)
    try {
      const body = {
        punto_servicio_id: form.punto_servicio_id && form.punto_servicio_id !== 'otro' ? form.punto_servicio_id : null,
        nombre, horario: form.horario, descripcion: form.descripcion,
        direccion: form.direccion, telefono: form.telefono, fotos: form.fotos,
      }
      const url = editandoId ? `${API_URL}/api/mi-ciudad/servicios/${editandoId}` : `${API_URL}/api/mi-ciudad/servicios`
      const method = editandoId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: HJ(), body: JSON.stringify(body) }).then(r => r.json())
      if (res.ok) {
        msg(editandoId ? '✅ Servicio actualizado' : '✅ Servicio agregado')
        setForm(VACIO_SERVICIO)
        setEditandoId(null)
        cargar()
      } else msg('❌ Error al guardar')
    } catch { msg('❌ Error de conexión') }
    setGuardandoServicio(false)
  }

  const editarServicio = (s) => {
    setForm({
      punto_servicio_id: s.punto_servicio_id || (s.nombre ? 'otro' : ''),
      nombre: s.nombre || '', nombreOtro: s.punto_servicio_id ? '' : (s.nombre || ''),
      horario: s.horario || '', descripcion: s.descripcion || '',
      direccion: s.direccion || '', telefono: s.telefono || '', fotos: s.fotos || [],
    })
    setEditandoId(s.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminarServicio = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/mi-ciudad/servicios/${id}`, { method: 'DELETE', headers: H() }).then(r => r.json())
      if (res.ok) { msg('✅ Servicio eliminado'); cargar() }
      else msg('❌ Error al eliminar')
    } catch { msg('❌ Error de conexión') }
    setConfirmEliminar(null)
  }

  const cancelarServicio = () => { setForm(VACIO_SERVICIO); setEditandoId(null) }

  if (cargando) return <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-400">Cargando...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-1">Ciudad Web{ciudad ? `: ${ciudad}` : ''}</h2>
      <p className="text-xs text-gray-500 mb-4">Lo que escribas aquí aparece en la página pública "Dónde Estamos" de tu ciudad.</p>

      {mensaje && <div className="mb-4 text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>}

      {/* Historia */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-1">Historia de la comunidad en tu ciudad</h3>
        <p className="text-xs text-gray-500 mb-4">Cuenta cómo nació y cómo sirve hoy la comunidad aquí — puede incluir varios párrafos.</p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subtítulo (frase corta bajo el banner)</label>
            <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)}
              placeholder="Ej: Un latido de amor en el corazón de la ciudad"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Historia</label>
            <textarea value={historia} onChange={e => setHistoria(e.target.value)}
              placeholder="Cuenta la historia y la labor de hoy de la comunidad en tu ciudad..."
              rows={8}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <FotosMultiples fotos={historiaFotos} onChange={setHistoriaFotos} subiendo={subiendoHistoria} onSubir={subirFotoHistoria} />
        </div>
        <button onClick={guardarHistoria} disabled={guardandoHistoria}
          className="bg-blue-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-900 disabled:opacity-50">
          {guardandoHistoria ? 'Guardando...' : 'Guardar historia'}
        </button>
      </div>

      {/* Servicios */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">{editandoId ? 'Editar servicio' : 'Nuevo servicio'}</h3>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Punto de servicio *</label>
            <select value={form.punto_servicio_id}
              onChange={e => setForm(f => ({ ...f, punto_servicio_id: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Selecciona...</option>
              {puntos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              <option value="otro">Otro (escribir nombre)</option>
            </select>
            {form.punto_servicio_id === 'otro' && (
              <input type="text" value={form.nombreOtro} onChange={e => setForm(f => ({ ...f, nombreOtro: e.target.value }))}
                placeholder="Nombre del servicio"
                className="w-full mt-2 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Horario</label>
              <input type="text" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                placeholder="Ej: Domingos, 7:30 a.m."
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input type="text" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
            <input type="text" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <FotosMultiples fotos={form.fotos} onChange={fotos => setForm(f => ({ ...f, fotos }))} subiendo={subiendoServicio} onSubir={subirFotoServicio} />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={guardarServicio} disabled={guardandoServicio}
            className="bg-blue-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-900 disabled:opacity-50">
            {guardandoServicio ? 'Guardando...' : editandoId ? 'Actualizar' : 'Agregar servicio'}
          </button>
          {editandoId && (
            <button onClick={cancelarServicio} className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {servicios.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-lg border border-gray-200">Aún no hay servicios agregados</div>
        ) : servicios.map(s => (
          <div key={s.id} className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3">
            <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {s.fotos?.[0] && <img src={s.fotos[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{s.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{s.horario}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => editarServicio(s)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
              {confirmEliminar === s.id ? (
                <span className="flex items-center gap-2">
                  <button onClick={() => eliminarServicio(s.id)} className="text-red-600 hover:underline text-xs font-medium">Confirmar</button>
                  <button onClick={() => setConfirmEliminar(null)} className="text-gray-400 hover:underline text-xs">Cancelar</button>
                </span>
              ) : (
                <button onClick={() => setConfirmEliminar(s.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
