import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

export default function Seccion11PacienteServita({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const esLaboriosoNoConsagrar = datos.estadoConsagracion === 'laborioso_no_consagrar'

  const validar = () => {
    const e = {}
    if (!datos.fechaInicioServicio) e.fechaInicioServicio = 'Campo requerido'
    if (!esLaboriosoNoConsagrar && !datos.fechaConsagracion) e.fechaConsagracion = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Información de Consagración</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 11 de 13</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha en la que iniciaste tu servicio <CampoObligatorio />
        </label>
        <input type="date" value={datos.fechaInicioServicio || ''}
          onChange={e => actualizar({ fechaInicioServicio: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.fechaInicioServicio && <p className="text-red-500 text-xs mt-1">{errores.fechaInicioServicio}</p>}
      </div>

      {!esLaboriosoNoConsagrar && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de consagración (puede ser aproximada) <CampoObligatorio />
          </label>
          <input type="date" value={datos.fechaConsagracion || ''}
            onChange={e => actualizar({ fechaConsagracion: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errores.fechaConsagracion && <p className="text-red-500 text-xs mt-1">{errores.fechaConsagracion}</p>}
        </div>
      )}

      <BotonSiguiente onClick={() => { if (validar()) siguiente() }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
