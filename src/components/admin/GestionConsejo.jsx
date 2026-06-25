import { useState } from 'react'
import API_URL from '../../config.js'
import SelectorCiudad from '../ui/SelectorCiudad'

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'España', 'Estados Unidos', 'México',
  'Paraguay', 'Perú', 'Uruguay', 'Venezuela'
]

const ADMIN_HEADERS = { 'x-admin-key': 'SDS2026admin', 'Content-Type': 'application/json' }

const nivelLabel = (nivel) => {
  if (nivel === 'paciente') return { texto: 'Paciente', color: 'bg-blue-100 text-blue-700' }
  if (nivel === 'servita') return { texto: 'Servita', color: 'bg-purple-100 text-purple-700' }
  if (nivel === 'pilar') return { texto: 'Pilar', color: 'bg-amber-100 text-amber-700' }
  return { texto: 'Laborioso', color: 'bg-gray-100 text-gray-600' }
}

const COORD_ROLES = ['Coordinador principal del consejo', 'Coordinador suplente del consejo']

export default function GestionConsejo() {
  const [pais, setPais] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [consejeros, setConsejeros] = useState([])
  const [cargando, setCargando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [mensaje, setMensaje] = useState('')

  const mostrarMensaje = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000) }

  const cargar = async (c) => {
    if (!c) return
    setCargando(true)
    try {
      const data = await fetch(`${API_URL}/api/admin/consejo/miembros?ciudad=${encodeURIComponent(c)}`, {
        headers: ADMIN_HEADERS
      }).then(r => r.json())
      setConsejeros(data)
    } catch { }
    setCargando(false)
  }

  const seleccionarCiudad = (c) => {
    setCiudad(c)
    setBusqueda('')
    setResultados([])
    setMensaje('')
    setConsejeros([])
    if (c) cargar(c)
  }

  const buscarMiembro = async (q) => {
    setBusqueda(q)
    if (q.length < 2) { setResultados([]); return }
    setBuscando(true)
    try {
      const data = await fetch(`${API_URL}/api/admin/consejo/buscar-miembro?q=${encodeURIComponent(q)}&ciudad=${encodeURIComponent(ciudad)}`, {
        headers: ADMIN_HEADERS
      }).then(r => r.json())
      setResultados(data)
    } catch { }
    setBuscando(false)
  }

  const agregarAlConsejo = async (miembro) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/consejo/miembro/${miembro.id}/agregar`, {
        method: 'PUT', headers: ADMIN_HEADERS
      }).then(r => r.json())
      if (res.ok) {
        setBusqueda('')
        setResultados([])
        await cargar(ciudad)
        mostrarMensaje(`✅ ${miembro.primer_nombre} ${miembro.primer_apellido} agregado al consejo`)
      } else mostrarMensaje('❌ ' + (res.mensaje || 'Error al agregar'))
    } catch { mostrarMensaje('❌ No se pudo conectar con el servidor') }
  }

  const eliminarDelConsejo = async (miembro) => {
    const nombre = `${miembro.primer_nombre} ${miembro.primer_apellido}`
    if (!confirm(`¿Eliminar a ${nombre} del consejo? Se borrarán todas sus responsabilidades.`)) return
    try {
      const res = await fetch(`${API_URL}/api/admin/consejo/miembro/${miembro.id}/eliminar`, {
        method: 'PUT', headers: ADMIN_HEADERS
      }).then(r => r.json())
      if (res.ok) { await cargar(ciudad); mostrarMensaje(`✅ ${nombre} eliminado del consejo`) }
      else mostrarMensaje('❌ ' + (res.mensaje || 'Error al eliminar'))
    } catch { mostrarMensaje('❌ No se pudo conectar con el servidor') }
  }

  const asignarCoordinador = async (miembro, tipo) => {
    const rol = tipo === 'principal' ? 'Coordinador principal del consejo' : 'Coordinador suplente del consejo'
    const nombre = `${miembro.primer_nombre} ${miembro.primer_apellido}`
    try {
      const res = await fetch(`${API_URL}/api/admin/consejo/miembro/${miembro.id}/coordinador`, {
        method: 'PUT', headers: ADMIN_HEADERS,
        body: JSON.stringify({ tipo, ciudadActual: ciudad })
      }).then(r => r.json())
      if (res.ok) { await cargar(ciudad); mostrarMensaje(`✅ ${nombre} asignado como ${rol}`) }
      else mostrarMensaje('❌ ' + (res.mensaje || 'Error al asignar'))
    } catch { mostrarMensaje('❌ No se pudo conectar con el servidor') }
  }

  const quitarCoordinador = async (miembro, tipo) => {
    const rol = tipo === 'principal' ? 'Coordinador principal del consejo' : 'Coordinador suplente del consejo'
    const nombre = `${miembro.primer_nombre} ${miembro.primer_apellido}`
    const respsActuales = miembro.responsabilidades_consejo || []
    try {
      const res = await fetch(`${API_URL}/api/admin/consejo/miembro/${miembro.id}/quitar-coordinador`, {
        method: 'PUT', headers: ADMIN_HEADERS,
        body: JSON.stringify({ rol })
      }).then(r => r.json())
      if (res.ok) { await cargar(ciudad); mostrarMensaje(`✅ Rol de ${rol} quitado a ${nombre}`) }
      else mostrarMensaje('❌ ' + (res.mensaje || 'Error al quitar'))
    } catch { mostrarMensaje('❌ No se pudo conectar con el servidor') }
  }

  const coordActual = (tipo) => {
    const rol = tipo === 'principal' ? 'Coordinador principal del consejo' : 'Coordinador suplente del consejo'
    return consejeros.find(c => (c.responsabilidades_consejo || []).includes(rol))
  }

  const nombreCompleto = (m) =>
    [m.primer_nombre, m.segundo_nombre, m.primer_apellido, m.segundo_apellido].filter(Boolean).join(' ')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="font-bold text-blue-800 text-xl mb-6">Gestión del consejo</h2>

      {/* Selector de ubicación */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Seleccionar ciudad</p>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
          <select value={pais} onChange={e => { setPais(e.target.value); setDepartamento(''); seleccionarCiudad('') }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Selecciona...</option>
            {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {pais && (
          <SelectorCiudad
            pais={pais}
            departamento={departamento}
            ciudad={ciudad}
            onChangeDepartamento={v => { setDepartamento(v); seleccionarCiudad('') }}
            onChangeCiudad={v => seleccionarCiudad(v)}
          />
        )}
      </div>

      {!ciudad && (
        <p className="text-sm text-gray-400 text-center py-8">Selecciona una ciudad para ver su consejo</p>
      )}

      {ciudad && (
        <>
          {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-4">{mensaje}</p>}

          {/* Coordinadores actuales */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Coordinadores — {ciudad}</p>
            <div className="grid grid-cols-2 gap-4">
              {['principal', 'suplente'].map(tipo => {
                const coord = coordActual(tipo)
                return (
                  <div key={tipo} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">{tipo === 'principal' ? 'Coordinador principal' : 'Coordinador suplente'}</p>
                    {coord ? (
                      <p className="text-sm font-semibold text-blue-800">{nombreCompleto(coord)}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Sin asignar</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Buscador para agregar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agregar miembro al consejo</p>
            <input type="text" value={busqueda} onChange={e => buscarMiembro(e.target.value)}
              placeholder="Buscar por nombre o identificación..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {buscando && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
            {resultados.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {resultados.map(m => {
                  const nivel = nivelLabel(m.estado_consagracion)
                  return (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{nombreCompleto(m)}</p>
                        <p className="text-xs text-gray-500">{m.numero_identificacion}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${nivel.color}`}>{nivel.texto}</span>
                        <button onClick={() => agregarAlConsejo(m)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                          Agregar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {busqueda.length >= 2 && !buscando && resultados.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No se encontraron miembros disponibles (ya son consejeros o no pertenecen a esta ciudad)</p>
            )}
          </div>

          {/* Lista de consejeros */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">
              Consejeros actuales {!cargando && `(${consejeros.length})`}
            </p>
            {cargando ? (
              <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
            ) : consejeros.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay consejeros registrados en {ciudad}</p>
            ) : (
              consejeros.map(c => {
                const nivel = nivelLabel(c.estado_consagracion)
                const resps = (c.responsabilidades_consejo || [])
                const respsNormales = resps.filter(r => !COORD_ROLES.includes(r))
                const respsCoord = resps.filter(r => COORD_ROLES.includes(r))
                return (
                  <div key={c.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-gray-800">{nombreCompleto(c)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${nivel.color}`}>{nivel.texto}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{c.numero_identificacion}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {respsCoord.map(r => (
                            <span key={r} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {r} 🔒
                            </span>
                          ))}
                          {respsNormales.map(r => (
                            <span key={r} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                          {resps.length === 0 && (
                            <span className="text-xs text-gray-400 italic">Sin responsabilidades</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => eliminarDelConsejo(c)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium ml-3 flex-shrink-0">
                        Eliminar del consejo
                      </button>
                    </div>
                    {/* Asignación coordinadores */}
                    <div className="flex gap-2 mt-1">
                      {respsCoord.includes('Coordinador principal del consejo') ? (
                        <button onClick={() => quitarCoordinador(c, 'principal')}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium border border-orange-200 px-2 py-0.5 rounded">
                          − Coord. principal
                        </button>
                      ) : (
                        <button onClick={() => asignarCoordinador(c, 'principal')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-0.5 rounded">
                          + Coord. principal
                        </button>
                      )}
                      {respsCoord.includes('Coordinador suplente del consejo') ? (
                        <button onClick={() => quitarCoordinador(c, 'suplente')}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium border border-orange-200 px-2 py-0.5 rounded">
                          − Coord. suplente
                        </button>
                      ) : (
                        <button onClick={() => asignarCoordinador(c, 'suplente')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-0.5 rounded">
                          + Coord. suplente
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
