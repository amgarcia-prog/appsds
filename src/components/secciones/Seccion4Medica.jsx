import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

const TIPOS_SANGRE = ['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-']

export default function Seccion4Medica({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.tipoSangre) e.tipoSangre = 'Campo requerido'
    if (!datos.epsServicio) e.epsServicio = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Información Médica</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 4 de 13</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de sangre <CampoObligatorio />
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS_SANGRE.map(t => (
            <label key={t} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer text-sm font-medium transition-colors
              ${datos.tipoSangre === t ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-300 hover:bg-gray-50'}`}>
              <input type="radio" name="tipoSangre" value={t}
                checked={datos.tipoSangre === t}
                onChange={e => actualizar({ tipoSangre: e.target.value })}
                className="hidden" />
              {t}
            </label>
          ))}
        </div>
        {errores.tipoSangre && <p className="text-red-500 text-xs mt-1">{errores.tipoSangre}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">EPS o sistema de salud <CampoObligatorio /></label>
        <input type="text" value={datos.epsServicio}
          onChange={e => actualizar({ epsServicio: e.target.value })}
          placeholder="Ej: Sura, Compensar, IMSS..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.epsServicio && <p className="text-red-500 text-xs mt-1">{errores.epsServicio}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Indicaciones médicas</label>
        <textarea value={datos.indicacionesMedicas}
          onChange={e => actualizar({ indicacionesMedicas: e.target.value })}
          rows={3}
          placeholder="Alergias, condiciones especiales, medicamentos..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <BotonSiguiente onClick={() => { if (validar()) siguiente() }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
