import { useState } from 'react'
import API_URL from '../../config.js'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const ESTADO_LABEL = {
  consagrado_paciente: 'Paciente',
  consagrado_servita: 'Servita',
  consagrado_pilar: 'Pilar',
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

export default function PanelCumpleanos({ ciudad }) {
  const [desde, setDesde] = useState(hoy())
  const [hasta, setHasta] = useState(hoy())
  const [resultados, setResultados] = useState(null)
  const [cargando, setCargando] = useState(false)

  const consultar = async () => {
    setCargando(true)
    const res = await fetch(`${API_URL}/api/miembro/cumpleanos?desde=${desde}&hasta=${hasta}&ciudad=${encodeURIComponent(ciudad)}`)
    const data = await res.json()
    setResultados(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return ''
    const [, m, d] = fecha.split('-').map(Number)
    return `${d} de ${MESES[m - 1]}`
  }

  const nombre = (r) => [r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido].filter(Boolean).join(' ')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-5">Cumpleaños</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={consultar} disabled={cargando}
          className="w-full bg-blue-800 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-900 disabled:opacity-50">
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {resultados !== null && (
        resultados.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay cumpleaños en este periodo.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">{resultados.length} hermano{resultados.length !== 1 ? 's' : ''}</p>
            {resultados.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                {r.foto_url
                  ? <img src={r.foto_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">{r.primer_nombre?.[0]}{r.primer_apellido?.[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{nombre(r)}</p>
                  {ESTADO_LABEL[r.estado_consagracion] && (
                    <p className="text-xs text-gray-400">{ESTADO_LABEL[r.estado_consagracion]}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-blue-700 flex-shrink-0">{formatFecha(r.fecha_nacimiento)}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
