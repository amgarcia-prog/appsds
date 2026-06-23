import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

const ESTADOS = [
  { value: 'laborioso', label: 'Soy laborioso y me quiero consagrar como paciente' },
  { value: 'laborioso_no_consagrar', label: 'Soy laborioso pero por ahora no deseo consagrarme' },
  { value: 'paciente', label: 'Estoy consagrado como hermano paciente' },
  { value: 'servita', label: 'Estoy consagrado como hermano servita' },
  { value: 'pilar', label: 'Soy hermano Pilar' },
]

export default function Seccion9EstadoConsagracion({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.estadoConsagracion) e.estadoConsagracion = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSiguiente = () => {
    if (!validar()) return
    if (datos.estadoConsagracion === 'laborioso') siguiente(10)
    else if (datos.estadoConsagracion === 'laborioso_no_consagrar') siguiente(11)
    else if (datos.estadoConsagracion === 'paciente' || datos.estadoConsagracion === 'servita') siguiente(11)
    else if (datos.estadoConsagracion === 'pilar') siguiente(12)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Estado de Consagración</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 9 de 13</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ¿Qué grado de consagración tienes en la comunidad? <CampoObligatorio />
        </label>
        <div className="space-y-3">
          {ESTADOS.map(op => (
            <label key={op.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
              ${datos.estadoConsagracion === op.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="estadoConsagracion" value={op.value}
                checked={datos.estadoConsagracion === op.value}
                onChange={e => actualizar({ estadoConsagracion: e.target.value })}
                className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span className="text-sm">{op.label}</span>
            </label>
          ))}
        </div>
        {errores.estadoConsagracion && <p className="text-red-500 text-xs mt-1">{errores.estadoConsagracion}</p>}
      </div>

      <BotonSiguiente onClick={handleSiguiente} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
