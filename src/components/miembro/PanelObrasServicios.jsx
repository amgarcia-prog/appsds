import { useState, useEffect } from 'react'
import API_URL from '../../config.js'

export default function PanelObrasServicios() {
  const sesion = JSON.parse(localStorage.getItem('miembro_sesion') || '{}')
  const [puntos, setPuntos] = useState([])
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoMiembros, setCargandoMiembros] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)

  const headers = { 'x-miembro-id': sesion.id }

  useEffect(() => { cargarPuntos() }, [])

  const cargarPuntos = async () => {
    setCargando(true)
    try {
      const data = await fetch(`${API_URL}/api/obras/puntos-servicio?ciudad=${encodeURIComponent(sesion.ciudad)}`, { headers }).then(r => r.json())
      setPuntos(data)
    } catch { }
    setCargando(false)
  }

  const abrirPunto = async (punto) => {
    setPuntoSeleccionado(punto)
    setBusqueda('')
    setResultados([])
    setMensaje('')
    setCargandoMiembros(true)
    try {
      const data = await fetch(`${API_URL}/api/obras/miembros-punto?punto=${encodeURIComponent(punto.nombre)}&ciudad=${encodeURIComponent(sesion.ciudad)}`, { headers }).then(r => r.json())
      setMiembros(data)
    } catch { }
    setCargandoMiembros(false)
  }

  const buscarMiembro = async (q) => {
    setBusqueda(q)
    if (q.length < 2) { setResultados([]); return }
    setBuscando(true)
    try {
      const data = await fetch(`${API_URL}/api/obras/buscar-miembro?q=${encodeURIComponent(q)}&ciudad=${encodeURIComponent(sesion.ciudad)}`, { headers }).then(r => r.json())
      setResultados(data.filter(m => !(m.puntos_servicio || []).includes(puntoSeleccionado.nombre)))
    } catch { }
    setBuscando(false)
  }

  const mostrarMensaje = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000) }

  const agregarMiembro = async (miembro) => {
    const res = await fetch(`${API_URL}/api/obras/miembro/${miembro.id}/agregar-punto`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ punto: puntoSeleccionado.nombre })
    }).then(r => r.json())
    if (res.ok) {
      setResultados([])
      setBusqueda('')
      await abrirPunto(puntoSeleccionado)
      await cargarPuntos()
      mostrarMensaje('✅ Miembro agregado al punto de servicio')
    }
  }

  const quitarMiembro = async (miembro) => {
    if (!confirm(`¿Eliminar a ${miembro.primer_nombre} ${miembro.primer_apellido} de ${puntoSeleccionado.nombre}?`)) return
    const res = await fetch(`${API_URL}/api/obras/miembro/${miembro.id}/quitar-punto`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ punto: puntoSeleccionado.nombre })
    }).then(r => r.json())
    if (res.ok) {
      await abrirPunto(puntoSeleccionado)
      await cargarPuntos()
      mostrarMensaje('✅ Miembro retirado del punto de servicio')
    }
  }

  const adicionarCoordinador = async (miembro) => {
    const res = await fetch(`${API_URL}/api/obras/miembro/${miembro.id}/adicionar-coordinador`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ punto: puntoSeleccionado.nombre })
    }).then(r => r.json())
    if (res.ok) { await abrirPunto(puntoSeleccionado); mostrarMensaje('✅ Coordinador adicionado') }
  }

  const quitarCoordinador = async (miembro) => {
    if (!confirm(`¿Eliminar a ${miembro.primer_nombre} ${miembro.primer_apellido} como coordinador de ${puntoSeleccionado.nombre}?`)) return
    const res = await fetch(`${API_URL}/api/obras/miembro/${miembro.id}/quitar-coordinador`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ punto: puntoSeleccionado.nombre })
    }).then(r => r.json())
    if (res.ok) { await abrirPunto(puntoSeleccionado); mostrarMensaje('✅ Coordinador quitado') }
  }

  const crearPunto = async () => {
    if (!nombreNuevo.trim() || !paisNuevo) return
    setGuardandoNuevo(true)
    const res = await fetch(`${API_URL}/api/obras/puntos-servicio`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombreNuevo.trim(), ciudad: sesion.ciudad, pais: sesion.pais, departamento: sesion.departamento || null })
    }).then(r => r.json())
    if (res.ok) { setNombreNuevo(''); setMostrarFormNuevo(false); await cargarPuntos(); mostrarMensaje('✅ Punto de servicio creado') }
    else mostrarMensaje('❌ ' + (res.mensaje || 'Error al crear'))
    setGuardandoNuevo(false)
  }

  const eliminarPunto = async (punto) => {
    if (punto.total_miembros > 0) { mostrarMensaje(`❌ No se puede eliminar: tiene ${punto.total_miembros} miembro(s) asignado(s)`); return }
    if (!confirm(`¿Eliminar el punto "${punto.nombre}"?`)) return
    const res = await fetch(`${API_URL}/api/obras/puntos-servicio/${punto.id}`, { method: 'DELETE', headers }).then(r => r.json())
    if (res.ok) { await cargarPuntos(); mostrarMensaje('✅ Punto de servicio eliminado') }
  }

  const nivelLabel = (nivel) => {
    if (nivel === 'laborioso') return { texto: 'Laborioso', color: 'bg-gray-100 text-gray-600' }
    if (nivel === 'paciente') return { texto: 'Paciente', color: 'bg-blue-100 text-blue-700' }
    if (nivel === 'servita') return { texto: 'Servita', color: 'bg-purple-100 text-purple-700' }
    if (nivel === 'pilar') return { texto: 'Pilar', color: 'bg-amber-100 text-amber-700' }
    return { texto: nivel || '—', color: 'bg-gray-100 text-gray-500' }
  }

  // Vista detalle de un punto
  if (puntoSeleccionado) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPuntoSeleccionado(null)} className="text-sm text-blue-700 hover:text-blue-900 font-medium">
            ← Volver a puntos
          </button>
          <span className="text-xs text-gray-500">{miembros.length} miembro(s)</span>
        </div>

        <h2 className="font-bold text-blue-800 text-lg mb-1">{puntoSeleccionado.nombre}</h2>

        {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

        {/* Buscador para agregar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agregar miembro</p>
          <input
            type="text"
            value={busqueda}
            onChange={e => buscarMiembro(e.target.value)}
            placeholder="Buscar por nombre o identificación..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {buscando && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
          {resultados.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {resultados.map(m => {
                const nivel = nivelLabel(m.estado_consagracion)
                return (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.primer_nombre} {m.segundo_nombre} {m.primer_apellido} {m.segundo_apellido}</p>
                      <p className="text-xs text-gray-500">{m.numero_identificacion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${nivel.color}`}>{nivel.texto}</span>
                      <button onClick={() => agregarMiembro(m)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Agregar miembro</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {busqueda.length >= 2 && !buscando && resultados.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No se encontraron miembros disponibles</p>
          )}
        </div>

        {/* Lista de miembros del punto */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">Miembros en este punto</p>
          {cargandoMiembros ? (
            <p className="text-sm text-gray-400 text-center py-6">Cargando...</p>
          ) : miembros.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Ningún miembro asignado a este punto</p>
          ) : (
            miembros.map(m => {
              const nivel = nivelLabel(m.estado_consagracion)
              const esCoord = (m.puntos_coordina || []).includes(puntoSeleccionado.nombre)
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {m.primer_nombre} {m.segundo_nombre} {m.primer_apellido} {m.segundo_apellido}
                      {esCoord && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Coordinador</span>}
                    </p>
                    <p className="text-xs text-gray-500">{m.numero_identificacion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${nivel.color}`}>{nivel.texto}</span>
                    {esCoord ? (
                      <button onClick={() => quitarCoordinador(m)} className="text-xs text-orange-600 hover:text-orange-800 font-medium">Eliminar coord.</button>
                    ) : (
                      <button onClick={() => adicionarCoordinador(m)} className="text-xs text-green-700 hover:text-green-900 font-medium">Agregar coord.</button>
                    )}
                    <button onClick={() => quitarMiembro(m)} className="text-xs text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Lista de puntos de servicio
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-blue-800 text-lg">Puntos de servicio — {sesion.ciudad}</h2>
        <button onClick={() => { setMostrarFormNuevo(!mostrarFormNuevo); setNombreNuevo('') }}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
          + Nuevo punto
        </button>
      </div>

      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      {mostrarFormNuevo && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nuevo punto de servicio</p>
          <p className="text-xs text-gray-400 mb-2">Ciudad: <strong>{sesion.ciudad}</strong> · {sesion.pais}</p>
          <input type="text" value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)}
            placeholder="Nombre del punto de servicio..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
          <div className="flex gap-2">
            <button onClick={crearPunto} disabled={guardandoNuevo || !nombreNuevo.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {guardandoNuevo ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setMostrarFormNuevo(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : puntos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay puntos de servicio registrados en tu ciudad</p>
      ) : (
        <div className="space-y-2">
          {puntos.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-blue-200 transition-colors">
              <button onClick={() => abrirPunto(p)} className="flex-1 flex items-center justify-between text-left">
                <span className="text-sm font-medium text-gray-800">{p.nombre}</span>
                <div className="flex items-center gap-2 mr-3">
                  <span className="text-xs text-gray-500">{p.total_miembros} miembro(s)</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>
              <button onClick={() => eliminarPunto(p)} className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 flex-shrink-0">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
