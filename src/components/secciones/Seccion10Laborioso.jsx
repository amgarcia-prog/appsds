import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

export default function Seccion10Laborioso({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.perteneceOtraComunidad) e.perteneceOtraComunidad = 'Campo requerido'
    if (datos.perteneceOtraComunidad === 'No') {
      if (!datos.fechaInicioServicio) e.fechaInicioServicio = 'Campo requerido'
      if (!datos.porQueConsagrarse) e.porQueConsagrarse = 'Campo requerido'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Aspirante a Hermano Paciente</h2>
      <p className="text-sm text-gray-500 mb-2">Sección 10 de 13</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
        <p className="text-xs text-amber-800">
          Recuerda que para iniciar el proceso de formación debes tener mínimo <strong>6 meses continuos de servicio</strong> y no ser miembro activo de otras comunidades laicales.
        </p>
      </div>

      {/* Pregunta sobre otra comunidad */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Perteneces, tienes responsabilidad o estás consagrado en otra comunidad o movimiento de la Iglesia? <CampoObligatorio />
        </label>
        <div className="flex gap-4">
          {['Sí', 'No'].map(op => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="perteneceOtraComunidad" value={op}
                checked={datos.perteneceOtraComunidad === op}
                onChange={e => actualizar({ perteneceOtraComunidad: e.target.value })}
                className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
        {errores.perteneceOtraComunidad && <p className="text-red-500 text-xs mt-1">{errores.perteneceOtraComunidad}</p>}
      </div>

      {/* Bloqueo si pertenece a otra comunidad */}
      {datos.perteneceOtraComunidad === 'Sí' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 leading-relaxed">
            Para poder consagrarte en nuestra comunidad no debes pertenecer, estar consagrado o tener responsabilidad en otra comunidad o movimiento de la Iglesia. Te invitamos a seguir sirviendo como laborioso, y si más adelante consideras que ya es el momento de pertenecer solo a nuestra comunidad, podrás iniciar nuevamente el proceso.
          </p>
        </div>
      )}

      {/* Resto del formulario solo si respondió No */}
      {datos.perteneceOtraComunidad === 'No' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha en la que iniciaste tu servicio <CampoObligatorio />
            </label>
            <input type="date" value={datos.fechaInicioServicio}
              onChange={e => actualizar({ fechaInicioServicio: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errores.fechaInicioServicio && <p className="text-red-500 text-xs mt-1">{errores.fechaInicioServicio}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explica detalladamente por qué deseas consagrarte en la comunidad <CampoObligatorio />
            </label>
            <textarea value={datos.porQueConsagrarse}
              onChange={e => actualizar({ porQueConsagrarse: e.target.value })}
              rows={5}
              placeholder="Comparte desde el corazón tu motivación para consagrarte..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            {errores.porQueConsagrarse && <p className="text-red-500 text-xs mt-1">{errores.porQueConsagrarse}</p>}
          </div>
        </>
      )}

      {datos.perteneceOtraComunidad !== 'Sí' && (
        <BotonSiguiente onClick={() => { if (validar()) siguiente() }} />
      )}
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
