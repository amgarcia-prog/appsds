import { useState, useEffect } from 'react'
import API_URL from '../../config.js'

const RESPONSABILIDADES = [
  'Financiero', 'Espiritualidad y eventos', 'Obras y servicios',
  'Comunicaciones', 'Misiones', 'Torreta', 'Formación y consagraciones'
]

const RESPONSABILIDADES_SOLO_JUNTA = [
  'Coordinador principal del consejo', 'Coordinador suplente del consejo'
]

export default function PanelResponsabilidadesConsejo() {
  const sesion = JSON.parse(localStorage.getItem('miembro_sesion') || '{}')
  const headers = { 'x-miembro-id': sesion.id }

  const [consejeros, setConsejeros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editandoId, setEditandoId] = useState(null)
  const [responsabilidadesEdit, setResponsabilidadesEdit] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const data = await fetch(`${API_URL}/api/consejo/miembros?ciudad=${encodeURIComponent(sesion.ciudad)}`, { headers }).then(r => r.json())
      setConsejeros(data)
    } catch { }
    setCargando(false)
  }

  const mostrarMensaje = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000) }

  const abrirEdicion = (c) => {
    setEditandoId(c.id)
    setResponsabilidadesEdit(c.responsabilidades_consejo || [])
  }

  const toggleResp = (resp) => {
    setResponsabilidadesEdit(prev =>
      prev.includes(resp) ? prev.filter(r => r !== resp) : [...prev, resp]
    )
  }

  const guardar = async (id) => {
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/consejo/miembro/${id}/responsabilidades`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsabilidades: responsabilidadesEdit })
      }).then(r => r.json())
      if (res.ok) {
        setEditandoId(null)
        await cargar()
        mostrarMensaje('✅ Responsabilidades actualizadas')
      } else mostrarMensaje('❌ ' + (res.mensaje || 'Error al guardar'))
    } catch { mostrarMensaje('❌ No se pudo conectar con el servidor') }
    setGuardando(false)
  }

  const nombre = (c) => [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean).join(' ')

  return (
    <div>
      <h2 className="font-bold text-blue-800 text-lg mb-4">Responsabilidades del consejo — {sesion.ciudad}</h2>

      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      {cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : consejeros.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay consejeros registrados en tu ciudad</p>
      ) : (
        <div className="space-y-3">
          {consejeros.map(c => (
            <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{nombre(c)}</p>
                  <p className="text-xs text-gray-400">{c.numero_identificacion}</p>
                </div>
                {editandoId !== c.id && (
                  <button onClick={() => abrirEdicion(c)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Editar
                  </button>
                )}
              </div>

              {editandoId === c.id ? (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Responsabilidades:</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                    {RESPONSABILIDADES.map(resp => (
                      <label key={resp} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${responsabilidadesEdit.includes(resp) ? 'bg-blue-50' : ''}`}>
                        <input type="checkbox" checked={responsabilidadesEdit.includes(resp)} onChange={() => toggleResp(resp)}
                          className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm">{resp}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => guardar(c.id)} disabled={guardando}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditandoId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(c.responsabilidades_consejo || []).length === 0 ? (
                    <span className="text-xs text-gray-400">Sin responsabilidades asignadas</span>
                  ) : (
                    (c.responsabilidades_consejo || []).map(r => (
                      <span key={r} className={`text-xs px-2 py-0.5 rounded-full ${RESPONSABILIDADES_SOLO_JUNTA.includes(r) ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r}{RESPONSABILIDADES_SOLO_JUNTA.includes(r) ? ' 🔒' : ''}
                      </span>
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
