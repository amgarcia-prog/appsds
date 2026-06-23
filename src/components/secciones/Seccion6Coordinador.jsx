import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

export default function Seccion6Coordinador({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})
  const [busqueda, setBusqueda] = useState('')

  const validar = () => {
    const e = {}
    if (datos.puntosCoordina.length === 0) e.puntosCoordina = 'Selecciona al menos un punto'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const togglePunto = (punto) => {
    const actual = datos.puntosCoordina
    if (actual.includes(punto)) {
      actualizar({ puntosCoordina: actual.filter(p => p !== punto) })
    } else {
      actualizar({ puntosCoordina: [...actual, punto] })
    }
  }

  const puntosFiltrados = datos.puntosServicio.filter(p =>
    p.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Puntos de Servicio que Coordinas</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 6 de 13</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cuál o cuáles puntos de servicio coordinas? <CampoObligatorio />
        </label>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
          {puntosFiltrados.length === 0 ? (
            <p className="text-sm text-gray-500 p-3">No hay puntos que coincidan</p>
          ) : puntosFiltrados.map(punto => (
            <label key={punto} className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0
              ${datos.puntosCoordina.includes(punto) ? 'bg-blue-50' : ''}`}>
              <input type="checkbox"
                checked={datos.puntosCoordina.includes(punto)}
                onChange={() => togglePunto(punto)}
                className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span className="text-xs">{punto}</span>
            </label>
          ))}
        </div>
        {errores.puntosCoordina && <p className="text-red-500 text-xs mt-1">{errores.puntosCoordina}</p>}
      </div>

      <BotonSiguiente onClick={() => { if (validar()) siguiente(7) }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
