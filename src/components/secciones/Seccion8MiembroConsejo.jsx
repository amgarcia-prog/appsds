import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

const RESPONSABILIDADES = [
  'Financiero', 'Espiritualidad y eventos', 'Obras y servicios',
  'Comunicaciones', 'Misiones', 'Torreta', 'Formación y consagraciones',
  'Tecnología', 'Coordinador principal del consejo', 'Coordinador suplente del consejo'
]

export default function Seccion8MiembroConsejo({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.fechaInicioConsejo) e.fechaInicioConsejo = 'Campo requerido'
    if (datos.responsabilidadesConsejo.length === 0) e.responsabilidadesConsejo = 'Selecciona al menos una responsabilidad'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const toggleResponsabilidad = (resp) => {
    const actual = datos.responsabilidadesConsejo
    if (actual.includes(resp)) {
      actualizar({ responsabilidadesConsejo: actual.filter(r => r !== resp) })
    } else {
      actualizar({ responsabilidadesConsejo: [...actual, resp] })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Información del Consejo</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 8 de 13</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de inicio en el consejo (puede ser aproximada) <CampoObligatorio />
        </label>
        <input type="date" value={datos.fechaInicioConsejo}
          onChange={e => actualizar({ fechaInicioConsejo: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.fechaInicioConsejo && <p className="text-red-500 text-xs mt-1">{errores.fechaInicioConsejo}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cuáles responsabilidades tienes en el consejo? <CampoObligatorio />
        </label>
        <div className="space-y-2">
          {RESPONSABILIDADES.map(resp => (
            <label key={resp} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={datos.responsabilidadesConsejo.includes(resp)}
                onChange={() => toggleResponsabilidad(resp)}
                className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{resp}</span>
            </label>
          ))}
        </div>
        {errores.responsabilidadesConsejo && <p className="text-red-500 text-xs mt-1">{errores.responsabilidadesConsejo}</p>}
      </div>

      <BotonSiguiente onClick={() => { if (validar()) siguiente(9) }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
