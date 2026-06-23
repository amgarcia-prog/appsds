import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

export default function Seccion7Consejo({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.perteneceConsejo) e.perteneceConsejo = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSiguiente = () => {
    if (!validar()) return
    if (datos.perteneceConsejo === 'Si pertenezco') {
      siguiente(8)
    } else {
      siguiente(9)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Consejo de Ciudad</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 7 de 13</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ¿Perteneces al consejo de tu ciudad? <CampoObligatorio />
        </label>
        <div className="space-y-2">
          {['Si pertenezco', 'No pertenezco'].map(op => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="perteneceConsejo" value={op}
                checked={datos.perteneceConsejo === op}
                onChange={e => actualizar({ perteneceConsejo: e.target.value })}
                className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
        {errores.perteneceConsejo && <p className="text-red-500 text-xs mt-1">{errores.perteneceConsejo}</p>}
      </div>

      <BotonSiguiente onClick={handleSiguiente} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
