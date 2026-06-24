import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

const RESPONSABILIDADES_PILAR = [
  'Financiero',
  'Espiritualidad y eventos',
  'Obras y servicios',
  'Comunicaciones',
  'Misiones',
  'Torreta',
  'Formación y consagraciones',
  'Tecnología',
  'Organizacional',
  'Servidor General',
  'Servidor General Suplente',
]

export default function Seccion12Pilar({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.fechaInicioServicio) e.fechaInicioServicio = 'Campo requerido'
    if (!datos.fechaInicioEncargo) e.fechaInicioEncargo = 'Campo requerido'
    if ((datos.responsabilidadesPilar || []).length === 0) e.responsabilidadesPilar = 'Selecciona al menos una responsabilidad'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const toggleResp = (resp) => {
    const actual = datos.responsabilidadesPilar || []
    if (actual.includes(resp)) {
      actualizar({ responsabilidadesPilar: actual.filter(r => r !== resp) })
    } else {
      actualizar({ responsabilidadesPilar: [...actual, resp] })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Hermano Pilar</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 12 de 13</p>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha en la que iniciaste tu servicio <CampoObligatorio />
        </label>
        <input type="date" value={datos.fechaInicioServicio || ''}
          onChange={e => actualizar({ fechaInicioServicio: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.fechaInicioServicio && <p className="text-red-500 text-xs mt-1">{errores.fechaInicioServicio}</p>}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de inicio de este encargo <CampoObligatorio />
        </label>
        <input type="date" value={datos.fechaInicioEncargo || ''}
          onChange={e => actualizar({ fechaInicioEncargo: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.fechaInicioEncargo && <p className="text-red-500 text-xs mt-1">{errores.fechaInicioEncargo}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cuáles responsabilidades tienes como Hermano Pilar? <CampoObligatorio />
        </label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {RESPONSABILIDADES_PILAR.map(resp => (
            <label key={resp} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0
              ${(datos.responsabilidadesPilar || []).includes(resp) ? 'bg-blue-50' : ''}`}>
              <input type="checkbox"
                checked={(datos.responsabilidadesPilar || []).includes(resp)}
                onChange={() => toggleResp(resp)}
                className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm">{resp}</span>
            </label>
          ))}
        </div>
        {(datos.responsabilidadesPilar || []).length > 0 && (
          <p className="text-blue-600 text-xs mt-1">{datos.responsabilidadesPilar.length} responsabilidad(es) seleccionada(s)</p>
        )}
        {errores.responsabilidadesPilar && <p className="text-red-500 text-xs mt-1">{errores.responsabilidadesPilar}</p>}
      </div>

      <BotonSiguiente onClick={() => { if (validar()) siguiente() }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
