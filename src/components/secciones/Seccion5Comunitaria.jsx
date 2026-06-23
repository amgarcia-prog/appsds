import { useState, useEffect } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'
import SelectorCiudad from '../ui/SelectorCiudad'

const COMO_LLEGO = ['Redes sociales', 'Invitación Directa', 'Vi a los servidores y me acerqué', 'Otro']

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'España', 'Estados Unidos', 'México',
  'Paraguay', 'Perú', 'Uruguay', 'Venezuela'
]

export default function Seccion5Comunitaria({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})
  const [puntosBD, setPuntosBD] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (datos.ciudadDondeSirve) {
      cargarPuntos()
    }
  }, [datos.ciudadDondeSirve])

  const cargarPuntos = async () => {
    setCargando(true)
    try {
      const res = await fetch(`http://localhost:3001/api/puntos-servicio?ciudad=${encodeURIComponent(datos.ciudadDondeSirve)}`)
      const data = await res.json()
      setPuntosBD(data)
    } catch (e) {
      console.error(e)
    }
    setCargando(false)
  }

  const validar = () => {
    const e = {}
    if (!datos.comoLlegoComunitad) e.comoLlegoComunitad = 'Campo requerido'
    if (!datos.paisServicio) e.paisServicio = 'Campo requerido'
    if (!datos.ciudadDondeSirve) e.ciudadDondeSirve = 'Campo requerido'
    if (datos.puntosServicio.length === 0) e.puntosServicio = 'Selecciona al menos un punto de servicio'
    if (!datos.esCoordinador) e.esCoordinador = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const togglePunto = (punto) => {
    const actual = datos.puntosServicio
    if (actual.includes(punto)) {
      actualizar({ puntosServicio: actual.filter(p => p !== punto) })
    } else {
      actualizar({ puntosServicio: [...actual, punto] })
    }
  }

  const handleSiguiente = () => {
    if (!validar()) return
    if (datos.esCoordinador === 'Sí') {
      siguiente(6)
    } else {
      siguiente(7)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Información Comunitaria</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 5 de 13</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cómo llegaste a la comunidad? <CampoObligatorio />
        </label>
        <div className="space-y-2">
          {COMO_LLEGO.map(op => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="comoLlego" value={op}
                checked={datos.comoLlegoComunitad === op}
                onChange={e => actualizar({ comoLlegoComunitad: e.target.value })}
                className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
        {errores.comoLlegoComunitad && <p className="text-red-500 text-xs mt-1">{errores.comoLlegoComunitad}</p>}
      </div>

      {/* Ciudad donde sirve */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Ciudad donde sirves <CampoObligatorio /></p>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
          <select value={datos.paisServicio || ''}
            onChange={e => actualizar({ paisServicio: e.target.value, departamentoDondeSirve: '', ciudadDondeSirve: '', puntosServicio: [] })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Selecciona un país...</option>
            {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errores.paisServicio && <p className="text-red-500 text-xs mt-1">{errores.paisServicio}</p>}
        </div>
        {datos.paisServicio && (
          <SelectorCiudad
            pais={datos.paisServicio}
            departamento={datos.departamentoDondeSirve}
            ciudad={datos.ciudadDondeSirve}
            onChangeDepartamento={depto => actualizar({ departamentoDondeSirve: depto, ciudadDondeSirve: '', puntosServicio: [] })}
            onChangeCiudad={ciudad => actualizar({ ciudadDondeSirve: ciudad, puntosServicio: [] })}
          />
        )}
        {errores.ciudadDondeSirve && <p className="text-red-500 text-xs mt-1">Selecciona departamento y ciudad</p>}
      </div>

      {/* Puntos de servicio */}
      {datos.ciudadDondeSirve && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿En cuál o cuáles puntos de servicio participas? <CampoObligatorio />
          </label>
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando puntos de servicio...</p>
          ) : puntosBD.length === 0 ? (
            <p className="text-sm text-gray-400">No hay puntos de servicio registrados para esta ciudad.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {puntosBD.map(punto => (
                <label key={punto.id} className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0
                  ${datos.puntosServicio.includes(punto.nombre) ? 'bg-blue-50' : ''}`}>
                  <input type="checkbox"
                    checked={datos.puntosServicio.includes(punto.nombre)}
                    onChange={() => togglePunto(punto.nombre)}
                    className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs">{punto.nombre}</span>
                </label>
              ))}
            </div>
          )}
          {datos.puntosServicio.length > 0 && (
            <p className="text-blue-600 text-xs mt-1">{datos.puntosServicio.length} punto(s) seleccionado(s)</p>
          )}
          {errores.puntosServicio && <p className="text-red-500 text-xs mt-1">{errores.puntosServicio}</p>}
          <p className="text-xs text-gray-500 mt-2 italic">Si no ves tu punto de servicio en la lista, por favor comunícate con tu coordinador.</p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Eres coordinador de uno o más puntos de servicio? <CampoObligatorio />
        </label>
        <div className="flex gap-4">
          {['Sí', 'No'].map(op => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="esCoordinador" value={op}
                checked={datos.esCoordinador === op}
                onChange={e => actualizar({ esCoordinador: e.target.value })}
                className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
        {errores.esCoordinador && <p className="text-red-500 text-xs mt-1">{errores.esCoordinador}</p>}
      </div>

      <BotonSiguiente onClick={handleSiguiente} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
