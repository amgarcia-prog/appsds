import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'
import SelectorCiudad from '../ui/SelectorCiudad'

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'España', 'Estados Unidos', 'México',
  'Paraguay', 'Perú', 'Uruguay', 'Venezuela'
]

export default function Seccion2Contacto({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.telefonoMovil) e.telefonoMovil = 'Campo requerido'
    if (!datos.correoElectronico) e.correoElectronico = 'Campo requerido'
    if (!datos.paisResidencia) e.paisResidencia = 'Campo requerido'
    if (!datos.ciudadServicio) e.ciudadServicio = 'Campo requerido'
    if (!datos.direccionResidencia) e.direccionResidencia = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Información de Contacto</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 2 de 13</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono móvil <CampoObligatorio />
        </label>
        <input type="tel" value={datos.telefonoMovil}
          onChange={e => actualizar({ telefonoMovil: e.target.value })}
          placeholder="Ej: +57 300 000 0000"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.telefonoMovil && <p className="text-red-500 text-xs mt-1">{errores.telefonoMovil}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono fijo</label>
        <input type="tel" value={datos.telefonoFijo}
          onChange={e => actualizar({ telefonoFijo: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Otro teléfono</label>
        <input type="tel" value={datos.otroTelefono}
          onChange={e => actualizar({ otroTelefono: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico <CampoObligatorio />
        </label>
        <input type="email" value={datos.correoElectronico}
          onChange={e => actualizar({ correoElectronico: e.target.value })}
          placeholder="ejemplo@correo.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.correoElectronico && <p className="text-red-500 text-xs mt-1">{errores.correoElectronico}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          País de residencia <CampoObligatorio />
        </label>
        <select value={datos.paisResidencia}
          onChange={e => actualizar({ paisResidencia: e.target.value, departamentoServicio: '', ciudadServicio: '' })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Selecciona un país...</option>
          {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {errores.paisResidencia && <p className="text-red-500 text-xs mt-1">{errores.paisResidencia}</p>}
      </div>

      {datos.paisResidencia && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Ciudad de residencia <CampoObligatorio /></p>
          <SelectorCiudad
            pais={datos.paisResidencia}
            departamento={datos.departamentoServicio}
            ciudad={datos.ciudadServicio}
            onChangeDepartamento={depto => actualizar({ departamentoServicio: depto, ciudadServicio: '' })}
            onChangeCiudad={ciudad => actualizar({ ciudadServicio: ciudad })}
          />
          {errores.ciudadServicio && <p className="text-red-500 text-xs mt-1">Selecciona departamento y ciudad de residencia</p>}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección de residencia <CampoObligatorio />
        </label>
        <input type="text" value={datos.direccionResidencia}
          onChange={e => actualizar({ direccionResidencia: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errores.direccionResidencia && <p className="text-red-500 text-xs mt-1">{errores.direccionResidencia}</p>}
      </div>

      <BotonSiguiente onClick={() => { if (validar()) siguiente() }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
