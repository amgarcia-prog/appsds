import { useState, useEffect } from 'react'
import API_URL from '../../config.js'
import SelectorCiudad from '../ui/SelectorCiudad'

const RESPONSABILIDADES_PILAR = [
  'Financiero', 'Espiritualidad y eventos', 'Obras y servicios',
  'Comunicaciones', 'Misiones', 'Torreta', 'Formación y consagraciones',
  'Tecnología', 'Organizacional', 'Servidor General', 'Servidor General Suplente'
]

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'España', 'Estados Unidos', 'México',
  'Paraguay', 'Perú', 'Uruguay', 'Venezuela'
]

const nivelLabel = (r) => {
  const map = { 'Organizacional': 'bg-amber-100 text-amber-700', 'Servidor General': 'bg-purple-100 text-purple-700', 'Servidor General Suplente': 'bg-purple-100 text-purple-700' }
  return map[r] || 'bg-blue-100 text-blue-700'
}

export default function PanelResponsabilidadesPilares() {
  const sesion = JSON.parse(localStorage.getItem('miembro_sesion') || '{}')
  const headers = { 'x-miembro-id': sesion.id, 'Content-Type': 'application/json' }

  const [pilares, setPilares] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editandoId, setEditandoId] = useState(null)
  const [responsabilidadesEdit, setResponsabilidadesEdit] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [ciudadesEdit, setCiudadesEdit] = useState([])
  const [nuevaCiudad, setNuevaCiudad] = useState({ pais: '', departamento: '', ciudad: '' })

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    const data = await fetch(`${API_URL}/api/organizacional/pilares`, { headers }).then(r => r.json()).catch(() => [])
    setPilares(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  const abrirEdicion = async (p) => {
    setEditandoId(p.id)
    setResponsabilidadesEdit(p.responsabilidades_pilar || [])
    const ciudades = await fetch(`${API_URL}/api/organizacional/pilar/${p.id}/ciudades`, { headers }).then(r => r.json()).catch(() => [])
    setCiudadesEdit(Array.isArray(ciudades) ? ciudades : [])
    setNuevaCiudad({ pais: '', departamento: '', ciudad: '' })
  }

  const toggleResp = (resp) => {
    setResponsabilidadesEdit(prev => prev.includes(resp) ? prev.filter(r => r !== resp) : [...prev, resp])
  }

  const guardar = async (id) => {
    setGuardando(true)
    const res = await fetch(`${API_URL}/api/organizacional/pilar/${id}/responsabilidades`, {
      method: 'PUT', headers,
      body: JSON.stringify({ responsabilidades: responsabilidadesEdit })
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { setEditandoId(null); await cargar(); msg('✅ Responsabilidades actualizadas') }
    else msg('❌ ' + (res.mensaje || 'Error al guardar'))
    setGuardando(false)
  }

  const agregarCiudad = async (pilarId) => {
    if (!nuevaCiudad.pais || !nuevaCiudad.ciudad) return msg('❌ Selecciona país y ciudad')
    const res = await fetch(`${API_URL}/api/organizacional/pilar/${pilarId}/ciudades`, {
      method: 'POST', headers,
      body: JSON.stringify(nuevaCiudad)
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) {
      const ciudades = await fetch(`${API_URL}/api/organizacional/pilar/${pilarId}/ciudades`, { headers }).then(r => r.json()).catch(() => [])
      setCiudadesEdit(Array.isArray(ciudades) ? ciudades : [])
      setNuevaCiudad({ pais: '', departamento: '', ciudad: '' })
    } else msg('❌ Error al agregar ciudad')
  }

  const eliminarCiudad = async (pilarId, ciudadId) => {
    await fetch(`${API_URL}/api/organizacional/pilar/${pilarId}/ciudades/${ciudadId}`, { method: 'DELETE', headers })
    setCiudadesEdit(prev => prev.filter(c => c.id !== ciudadId))
  }

  const nombre = (p) => [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido].filter(Boolean).join(' ')

  return (
    <div>
      <h2 className="font-bold text-blue-800 text-lg mb-4">Responsabilidades de pilares</h2>
      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      {cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : pilares.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay pilares registrados</p>
      ) : (
        <div className="space-y-3">
          {pilares.map(p => (
            <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{nombre(p)}</p>
                  <p className="text-xs text-gray-400">{p.ciudad_donde_sirve}{p.pais_servicio ? ` · ${p.pais_servicio}` : ''}</p>
                </div>
                {editandoId !== p.id && (
                  <button onClick={() => abrirEdicion(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Editar
                  </button>
                )}
              </div>

              {editandoId === p.id ? (
                <div>
                  {/* Responsabilidades */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Responsabilidades</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    {RESPONSABILIDADES_PILAR.map(resp => (
                      <label key={resp} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${responsabilidadesEdit.includes(resp) ? 'bg-blue-50' : ''}`}>
                        <input type="checkbox" checked={responsabilidadesEdit.includes(resp)} onChange={() => toggleResp(resp)}
                          className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm">{resp}</span>
                      </label>
                    ))}
                  </div>

                  {/* Ciudades responsables */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ciudades responsables</p>
                  {ciudadesEdit.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ciudadesEdit.map(c => (
                        <span key={c.id} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {c.ciudad}{c.departamento ? `, ${c.departamento}` : ''} · {c.pais}
                          <button onClick={() => eliminarCiudad(p.id, c.id)} className="ml-1 text-blue-400 hover:text-red-600">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">Agregar ciudad</p>
                    <div className="mb-2">
                      <select value={nuevaCiudad.pais} onChange={e => setNuevaCiudad({ pais: e.target.value, departamento: '', ciudad: '' })}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="">País...</option>
                        {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    {nuevaCiudad.pais && (
                      <SelectorCiudad
                        pais={nuevaCiudad.pais}
                        departamento={nuevaCiudad.departamento}
                        ciudad={nuevaCiudad.ciudad}
                        onChangeDepartamento={v => setNuevaCiudad(prev => ({ ...prev, departamento: v, ciudad: '' }))}
                        onChangeCiudad={v => setNuevaCiudad(prev => ({ ...prev, ciudad: v }))}
                      />
                    )}
                    {nuevaCiudad.ciudad && (
                      <button onClick={() => agregarCiudad(p.id)}
                        className="mt-2 w-full bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700">
                        + Agregar ciudad
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => guardar(p.id)} disabled={guardando}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      {guardando ? 'Guardando...' : 'Guardar responsabilidades'}
                    </button>
                    <button onClick={() => setEditandoId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(p.responsabilidades_pilar || []).length === 0 ? (
                    <span className="text-xs text-gray-400">Sin responsabilidades asignadas</span>
                  ) : (
                    (p.responsabilidades_pilar || []).map(r => (
                      <span key={r} className={`text-xs px-2 py-0.5 rounded-full ${nivelLabel(r)}`}>{r}</span>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
