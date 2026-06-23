import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'
import API_URL from '../../config.js'
import DetalleRegistro from './DetalleRegistro'
import BusquedaAvanzada from './BusquedaAvanzada'
import PuntosServicio from './PuntosServicio'
import PanelJunta from './PanelJunta'

const ESTADOS_PROCESO = [
  'pendiente_formacion',
  'laborioso_no_consagrar',
  'no_cumple_requisitos',
  'cumple_requisitos',
  'formacion_no_aprobada',
  'formacion_aprobada',
  'pendiente_aprobacion',
  'no_avalado_consejo',
  'aprobado_consagracion',
  'no_aprobado_junta',
  'consagrado_paciente',
  'consagrado_servita',
  'consagrado_pilar',
]
const ESTADOS_LABELS = {
  pendiente_formacion: 'Pendiente verificación de requisitos',
  laborioso_no_consagrar: 'Laborioso — no desea consagrarse',
  no_cumple_requisitos: 'No cumple requisitos',
  cumple_requisitos: 'Cumple requisitos para formación',
  formacion_no_aprobada: 'Formación no aprobada',
  formacion_aprobada: 'Formación aprobada',
  pendiente_aprobacion: 'Pendiente por aprobación de junta',
  no_avalado_consejo: 'No avalado por el consejo',
  aprobado_consagracion: 'Aprobado para consagración',
  no_aprobado_junta: 'No aprobado por la junta',
  consagrado_paciente: 'Consagrado como paciente',
  consagrado_servita: 'Consagrado como servita',
  consagrado_pilar: 'Consagrado como hermano pilar',
}
const ESTADOS_COLORES = {
  pendiente_formacion: 'bg-yellow-100 text-yellow-800',
  laborioso_no_consagrar: 'bg-gray-100 text-gray-700',
  no_cumple_requisitos: 'bg-red-100 text-red-800',
  cumple_requisitos: 'bg-blue-100 text-blue-800',
  formacion_no_aprobada: 'bg-orange-100 text-orange-800',
  formacion_aprobada: 'bg-indigo-100 text-indigo-800',
  pendiente_aprobacion: 'bg-orange-100 text-orange-800',
  no_avalado_consejo: 'bg-red-100 text-red-800',
  aprobado_consagracion: 'bg-purple-100 text-purple-800',
  no_aprobado_junta: 'bg-red-100 text-red-800',
  consagrado_paciente: 'bg-green-100 text-green-800',
  consagrado_servita: 'bg-green-100 text-green-800',
  consagrado_pilar: 'bg-green-100 text-green-800',
}

export default function PanelAdmin() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroPais, setFiltroPais] = useState('')
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroConsagracion, setFiltroConsagracion] = useState('')
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
  const [pendientesJunta, setPendientesJunta] = useState(0)
  const [vista, setVista] = useState('lista')
  const navigate = useNavigate()

  useEffect(() => {
    cargarRegistros()
  }, [])

  const cargarRegistros = async () => {
    setCargando(true)
    try {
      const [resRegistros, resJunta] = await Promise.all([
        fetch('${API_URL}/api/admin/registros', { headers: { 'x-admin-key': 'SDS2026admin' } }),
        fetch('${API_URL}/api/junta/pendientes', { headers: { 'x-admin-key': 'SDS2026admin' } }),
      ])
      const data = await resRegistros.json()
      const junta = await resJunta.json()
      setRegistros(data)
      setPendientesJunta(Array.isArray(junta) ? junta.length : 0)
    } catch (e) {
      console.error(e)
    }
    setCargando(false)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('admin_sesion')
    navigate('/admin/login')
  }

  const registrosFiltrados = registros.filter(r => {
    const nombre = `${r.primer_nombre} ${r.segundo_nombre} ${r.primer_apellido} ${r.segundo_apellido}`.toLowerCase()
    const coincideBusqueda = !busqueda || nombre.includes(busqueda.toLowerCase()) ||
      r.numero_identificacion?.includes(busqueda) ||
      r.correo_electronico?.toLowerCase().includes(busqueda.toLowerCase())
    const coincidePais = !filtroPais || r.pais_residencia === filtroPais
    const coincideCiudad = !filtroCiudad || r.ciudad_servicio?.toLowerCase().includes(filtroCiudad.toLowerCase())
    const coincideEstado = !filtroEstado || r.estado_proceso === filtroEstado
    const coincideConsagracion = !filtroConsagracion || r.estado_consagracion === filtroConsagracion
    return coincideBusqueda && coincidePais && coincideCiudad && coincideEstado && coincideConsagracion
  })

  const paises = [...new Set(registros.map(r => r.pais_residencia).filter(Boolean))]

  if (registroSeleccionado) {
    return (
      <DetalleRegistro
        registro={registroSeleccionado}
        onVolver={() => { setRegistroSeleccionado(null); cargarRegistros() }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-3 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <h1 className="text-base font-bold">Panel de Administración</h1>
              <p className="text-xs text-blue-200">Servidores del Servidor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setVista('lista')}
              className={`text-sm ${vista === 'lista' ? 'text-white font-medium' : 'text-blue-200 hover:text-white'}`}>
              Lista
            </button>
            <button onClick={() => setVista('busqueda')}
              className={`text-sm ${vista === 'busqueda' ? 'text-white font-medium' : 'text-blue-200 hover:text-white'}`}>
              Búsqueda avanzada
            </button>
            <button onClick={() => setVista('puntos')}
              className={`text-sm ${vista === 'puntos' ? 'text-white font-medium' : 'text-blue-200 hover:text-white'}`}>
              Puntos de servicio
            </button>
            <button onClick={() => setVista('junta')}
              className={`text-sm ${vista === 'junta' ? 'text-white font-medium' : 'text-blue-200 hover:text-white'}`}>
              Aprobación consagraciones
              {pendientesJunta > 0 && <span className="ml-2 bg-orange-400 text-white text-xs px-1.5 py-0.5 rounded-full">{pendientesJunta}</span>}
            </button>
            <button onClick={cerrarSesion} className="text-xs text-blue-200 hover:text-white ml-4">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {vista === 'busqueda' && <BusquedaAvanzada />}
      {vista === 'puntos' && <PuntosServicio />}
      {vista === 'junta' && <PanelJunta />}
      {vista !== 'busqueda' && vista !== 'puntos' && vista !== 'junta' && <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total registros', valor: registros.length, color: 'blue' },
            { label: 'Pendientes por formación', valor: registros.filter(r => r.estado_proceso === 'pendiente_formacion').length, color: 'yellow' },
            { label: 'En proceso', valor: registros.filter(r => ['cumple_requisitos','formacion_recibida','pendiente_aprobacion','aprobado_consagracion'].includes(r.estado_proceso)).length, color: 'blue' },
            { label: 'Consagrados', valor: registros.filter(r => ['consagrado_paciente','consagrado_servita','consagrado_pilar'].includes(r.estado_proceso)).length, color: 'green' },
          ].map(({ label, valor, color }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold text-${color}-700`}>{valor}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre, ID o correo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los países</option>
              {paises.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los estados</option>
              {ESTADOS_PROCESO.map(e => <option key={e} value={e}>{ESTADOS_LABELS[e]}</option>)}
            </select>
            <select value={filtroConsagracion} onChange={e => setFiltroConsagracion(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los niveles</option>
              <option value="laborioso">Laborioso</option>
              <option value="paciente">Paciente</option>
              <option value="servita">Servita</option>
              <option value="pilar">Pilar</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">{registrosFiltrados.length} resultado(s)</p>
            <button onClick={() => { setBusqueda(''); setFiltroPais(''); setFiltroCiudad(''); setFiltroEstado(''); setFiltroConsagracion('') }}
              className="text-xs text-blue-600 hover:underline">
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="text-center py-12 text-gray-500">Cargando registros...</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ciudad / País donde sirve</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo de servidor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha registro</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay registros que coincidan</td></tr>
                  ) : registrosFiltrados.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {[r.primer_nombre, r.primer_apellido].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-xs text-gray-400">{r.correo_electronico}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{r.ciudad_donde_sirve || r.ciudad_servicio}</p>
                        <p className="text-xs text-gray-400">{r.pais_servicio || r.pais_residencia}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-700">{r.estado_consagracion}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_COLORES[r.estado_proceso]}`}>
                          {ESTADOS_LABELS[r.estado_proceso]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(r.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setRegistroSeleccionado(r)}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>}
    </div>
  )
}
