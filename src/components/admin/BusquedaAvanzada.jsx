import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import API_URL from '../../config.js'

const ESTADOS_LABELS = {
  pendiente_formacion: 'Pendiente por formación',
  no_cumple_requisitos: 'No cumple requisitos',
  cumple_requisitos: 'Cumple requisitos para formación',
  formacion_recibida: 'Formación recibida',
  pendiente_aprobacion: 'Pendiente por aprobación de junta',
  aprobado_consagracion: 'Aprobado para consagración',
  consagrado_paciente: 'Consagrado como paciente',
  consagrado_servita: 'Consagrado como servita',
  consagrado_pilar: 'Consagrado como hermano pilar',
}

const PAISES = ['Argentina','Bolivia','Chile','Colombia','Costa Rica','Ecuador','España','Estados Unidos','México','Paraguay','Perú','Uruguay','Venezuela']

const NIVELES = [
  'Enseñanza básica - Primaria','Enseñanza media - Secundaria - Bachillerato',
  'Técnico - Tecnólogo','Profesional universitario','Especialización',
  'Maestría','Doctorado','Post-Doctorado','Ninguna'
]

const RESPONSABILIDADES = [
  'Financiero','Espiritualidad y eventos','Obras y servicios',
  'Comunicaciones','Misiones','Torreta','Formación y consagraciones',
  'Tecnología','Coordinador principal del consejo','Coordinador suplente del consejo'
]

const TODAS_COLUMNAS = [
  { key: 'primer_nombre', label: 'Primer nombre' },
  { key: 'segundo_nombre', label: 'Segundo nombre' },
  { key: 'primer_apellido', label: 'Primer apellido' },
  { key: 'segundo_apellido', label: 'Segundo apellido' },
  { key: 'tipo_identificacion', label: 'Tipo de ID' },
  { key: 'numero_identificacion', label: 'Número de ID' },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'estado_civil', label: 'Estado civil' },
  { key: 'telefono_movil', label: 'Teléfono móvil' },
  { key: 'telefono_fijo', label: 'Teléfono fijo' },
  { key: 'otro_telefono', label: 'Otro teléfono' },
  { key: 'correo_electronico', label: 'Correo electrónico' },
  { key: 'pais_residencia', label: 'País de residencia' },
  { key: 'departamento_servicio', label: 'Departamento de residencia' },
  { key: 'ciudad_servicio', label: 'Ciudad de residencia' },
  { key: 'pais_servicio', label: 'País donde sirve' },
  { key: 'departamento_ciudad_servicio', label: 'Departamento donde sirve' },
  { key: 'ciudad_donde_sirve', label: 'Ciudad donde sirve' },
  { key: 'direccion_residencia', label: 'Dirección' },
  { key: 'nivel_academico', label: 'Nivel académico' },
  { key: 'profesion', label: 'Profesión' },
  { key: 'ocupacion', label: 'Ocupación' },
  { key: 'tipo_sangre', label: 'Tipo de sangre' },
  { key: 'eps_servicio', label: 'EPS / Sistema de salud' },
  { key: 'indicaciones_medicas', label: 'Indicaciones médicas' },
  { key: 'como_llego_comunidad', label: 'Cómo llegó a la comunidad' },
  { key: 'puntos_servicio', label: 'Puntos de servicio' },
  { key: 'es_coordinador', label: 'Es coordinador' },
  { key: 'puntos_coordina', label: 'Puntos que coordina' },
  { key: 'pertenece_consejo', label: 'Pertenece al consejo' },
  { key: 'fecha_inicio_consejo', label: 'Fecha inicio consejo' },
  { key: 'responsabilidades_consejo', label: 'Responsabilidades consejo' },
  { key: 'estado_consagracion', label: 'Tipo de servidor' },
  { key: 'fecha_inicio_servicio', label: 'Fecha inicio servicio' },
  { key: 'fecha_consagracion_paciente', label: 'Fecha consagración paciente' },
  { key: 'fecha_consagracion_servita', label: 'Fecha consagración servita' },
  { key: 'fecha_inicio_encargo', label: 'Fecha inicio encargo (Pilar)' },
  { key: 'motivacion_paciente', label: 'Motivación consagración paciente' },
  { key: 'motivacion_servita', label: 'Motivación consagración servita' },
  { key: 'estado_proceso', label: 'Estado del proceso' },
  { key: 'fecha_estado', label: 'Fecha último cambio de estado' },
  { key: 'created_at', label: 'Fecha de registro' },
]

const COLUMNAS_DEFAULT = [
  'primer_nombre','primer_apellido','numero_identificacion','correo_electronico',
  'pais_residencia','ciudad_donde_sirve','estado_consagracion','estado_proceso','created_at'
]

const FILTROS_VACIO = {
  ciudadDondeSirve: '', paisServicio: '',
  estadoConsagracion: '', estadoProceso: '',
  perteneceConsejo: '', responsabilidadesConsejo: '',
  puntosServicio: '', esCoordinador: '', puntosCoordina: '',
  nivelAcademico: '', profesion: '', tipoSangre: '', epsServicio: '',
  comoLlegoComunidad: '',
  // secundarios
  primerNombre: '', primerApellido: '', numeroIdentificacion: '', correoElectronico: '',
  paisResidencia: '', ciudadServicio: '', fechaDesde: '', fechaHasta: '',
}

export default function BusquedaAvanzada({ authHeaders, esPilar = false }) {
  const headers = authHeaders || { 'x-admin-key': 'SDS2026admin' }
  const [todos, setTodos] = useState([])
  const [resultados, setResultados] = useState([])
  const [buscado, setBuscado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState(FILTROS_VACIO)
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState(COLUMNAS_DEFAULT)
  const [mostrarColumnas, setMostrarColumnas] = useState(false)
  const [ciudades, setCiudades] = useState([])
  const [puntosBD, setPuntosBD] = useState([])
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensajeCorreo, setMensajeCorreo] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/admin/registros`, {
      headers: { 'x-admin-key': 'SDS2026admin' }
    })
      .then(r => r.json())
      .then(data => {
        setTodos(data)
        setCargando(false)
        const ciudadesUnicas = [...new Set(data.map(r => r.ciudad_donde_sirve).filter(Boolean))].sort()
        setCiudades(ciudadesUnicas)
      })
      .catch(() => setCargando(false))

    fetch(`${API_URL}/api/admin/puntos-servicio`, {
      headers: { 'x-admin-key': 'SDS2026admin' }
    })
      .then(r => r.json())
      .then(data => setPuntosBD(data.map(p => p.nombre).sort()))
      .catch(() => {})
  }, [])

  const actualizar = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }))

  const buscar = () => {
    const res = todos.filter(r => {
      if (filtros.ciudadDondeSirve && !r.ciudad_donde_sirve?.toLowerCase().includes(filtros.ciudadDondeSirve.toLowerCase())) return false
      if (filtros.paisServicio && r.pais_servicio !== filtros.paisServicio) return false
      if (filtros.estadoConsagracion && r.estado_consagracion?.toLowerCase() !== filtros.estadoConsagracion) return false
      if (filtros.estadoProceso && r.estado_proceso !== filtros.estadoProceso) return false
      if (filtros.perteneceConsejo && !r.pertenece_consejo?.toLowerCase().includes(filtros.perteneceConsejo.toLowerCase())) return false
      if (filtros.responsabilidadesConsejo && !(r.responsabilidades_consejo || []).some(x => x.toLowerCase().includes(filtros.responsabilidadesConsejo.toLowerCase()))) return false
      if (filtros.puntosServicio && !(r.puntos_servicio || []).some(x => x.toLowerCase().includes(filtros.puntosServicio.toLowerCase()))) return false
      if (filtros.esCoordinador && r.es_coordinador !== filtros.esCoordinador) return false
      if (filtros.puntosCoordina && !(r.puntos_coordina || []).some(x => x.toLowerCase().includes(filtros.puntosCoordina.toLowerCase()))) return false
      if (filtros.nivelAcademico && !r.nivel_academico?.toLowerCase().includes(filtros.nivelAcademico.toLowerCase())) return false
      if (filtros.profesion && !r.profesion?.toLowerCase().includes(filtros.profesion.toLowerCase())) return false
      if (filtros.tipoSangre && r.tipo_sangre !== filtros.tipoSangre) return false
      if (filtros.epsServicio && !r.eps_servicio?.toLowerCase().includes(filtros.epsServicio.toLowerCase())) return false
      if (filtros.comoLlegoComunidad && r.como_llego_comunidad !== filtros.comoLlegoComunidad) return false
      if (filtros.primerNombre && !r.primer_nombre?.toLowerCase().includes(filtros.primerNombre.toLowerCase())) return false
      if (filtros.primerApellido && !r.primer_apellido?.toLowerCase().includes(filtros.primerApellido.toLowerCase())) return false
      if (filtros.numeroIdentificacion && !r.numero_identificacion?.includes(filtros.numeroIdentificacion)) return false
      if (filtros.correoElectronico && !r.correo_electronico?.toLowerCase().includes(filtros.correoElectronico.toLowerCase())) return false
      if (filtros.paisResidencia && r.pais_residencia !== filtros.paisResidencia) return false
      if (filtros.ciudadServicio && !r.ciudad_servicio?.toLowerCase().includes(filtros.ciudadServicio.toLowerCase())) return false
      if (filtros.fechaDesde && new Date(r.created_at) < new Date(filtros.fechaDesde)) return false
      if (filtros.fechaHasta && new Date(r.created_at) > new Date(filtros.fechaHasta + 'T23:59:59')) return false
      return true
    })
    setResultados(res)
    setBuscado(true)
  }

  const limpiar = () => {
    setFiltros(FILTROS_VACIO)
    setResultados([])
    setBuscado(false)
  }

  const toggleColumna = (key) => {
    setColumnasSeleccionadas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const seleccionarTodas = () => setColumnasSeleccionadas(TODAS_COLUMNAS.map(c => c.key))
  const deseleccionarTodas = () => setColumnasSeleccionadas([])

  const formatearValor = (r, key) => {
    if (key === 'estado_proceso') return ESTADOS_LABELS[r[key]] || r[key] || ''
    if (key === 'estado_consagracion') {
      const v = r[key] || ''
      return v.charAt(0).toUpperCase() + v.slice(1)
    }
    if (['puntos_servicio','puntos_coordina','responsabilidades_consejo'].includes(key)) {
      return (r[key] || []).join(', ')
    }
    if (['fecha_nacimiento','fecha_inicio_servicio','fecha_consagracion_paciente','fecha_consagracion_servita','fecha_inicio_encargo','fecha_inicio_consejo'].includes(key)) {
      return r[key] ? new Date(r[key] + 'T12:00:00').toLocaleDateString('es-CO') : ''
    }
    if (['fecha_estado','created_at'].includes(key)) {
      return r[key] ? new Date(r[key]).toLocaleDateString('es-CO') : ''
    }
    return r[key] || ''
  }

  const exportarExcel = () => {
    const columnas = TODAS_COLUMNAS.filter(c => columnasSeleccionadas.includes(c.key))
    const datos = resultados.map(r => {
      const fila = {}
      columnas.forEach(c => { fila[c.label] = formatearValor(r, c.key) })
      return fila
    })
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registros')
    XLSX.writeFile(wb, `registros_sds_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const enviarCorreo = async () => {
    if (!asunto.trim() || !cuerpo.trim()) return setMensajeCorreo('❌ Completa el asunto y el cuerpo del mensaje')
    const correos = resultados.map(r => r.correo_electronico).filter(Boolean)
    if (correos.length === 0) return setMensajeCorreo('❌ Ningún miembro de los resultados tiene correo registrado')
    if (!confirm(`¿Enviar correo a ${correos.length} miembro(s)?`)) return
    setEnviando(true)
    setMensajeCorreo('')
    try {
      const res = await fetch(`${API_URL}/api/admin/enviar-correo-masivo`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ asunto, cuerpo, correos })
      }).then(r => r.json())
      if (res.ok) {
        setMensajeCorreo(`✅ Correo enviado a ${res.enviados} miembro(s)${res.errores > 0 ? `, ${res.errores} con error` : ''}`)
        setAsunto('')
        setCuerpo('')
      } else setMensajeCorreo('❌ ' + (res.mensaje || 'Error al enviar'))
    } catch { setMensajeCorreo('❌ No se pudo conectar con el servidor') }
    setEnviando(false)
  }

  const columnasVisibles = TODAS_COLUMNAS.filter(c => columnasSeleccionadas.includes(c.key))

  const Input = ({ label, campo, tipo = 'text' }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={tipo} value={filtros[campo]} onChange={e => actualizar(campo, e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  )

  const Select = ({ label, campo, opciones }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={filtros[campo]} onChange={e => actualizar(campo, e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="">Todos</option>
        {opciones.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
      </select>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-4">Búsqueda avanzada</h2>

      {/* Filtros principales */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Filtros principales</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad donde sirve</label>
            <select value={filtros.ciudadDondeSirve} onChange={e => actualizar('ciudadDondeSirve', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Todos</option>
              {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Select label="País donde sirve" campo="paisServicio" opciones={PAISES.map(p => [p, p])} />
          <Select label="Tipo de servidor" campo="estadoConsagracion" opciones={[
            ['laborioso','Laborioso'],['paciente','Paciente'],['servita','Servita'],['pilar','Hermano Pilar']
          ]} />
          <Select label="Estado del proceso" campo="estadoProceso" opciones={Object.entries(ESTADOS_LABELS)} />
          <Select label="Pertenece al consejo" campo="perteneceConsejo" opciones={[['si','Sí pertenece'],['no','No pertenece']]} />
          <Select label="Responsabilidad en el consejo" campo="responsabilidadesConsejo" opciones={RESPONSABILIDADES.map(r => [r, r])} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Punto de servicio</label>
            <select value={filtros.puntosServicio} onChange={e => actualizar('puntosServicio', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Todos</option>
              {puntosBD.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Select label="Es coordinador" campo="esCoordinador" opciones={[['Sí','Sí'],['No','No']]} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Punto que coordina</label>
            <select value={filtros.puntosCoordina} onChange={e => actualizar('puntosCoordina', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Todos</option>
              {puntosBD.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Select label="Nivel académico" campo="nivelAcademico" opciones={NIVELES.map(n => [n, n])} />
          <Input label="Profesión" campo="profesion" />
          <Select label="Tipo de sangre" campo="tipoSangre" opciones={[
            ['A+','A+'],['A-','A-'],['B+','B+'],['B-','B-'],
            ['AB+','AB+'],['AB-','AB-'],['O+','O+'],['O-','O-']
          ]} />
          <Input label="EPS / Sistema de salud" campo="epsServicio" />
          <Select label="Cómo llegó a la comunidad" campo="comoLlegoComunidad" opciones={[
            ['Redes sociales','Redes sociales'],
            ['Invitación Directa','Invitación Directa'],
            ['Vi a los servidores y me acerqué','Vi a los servidores y me acerqué'],
            ['Otro','Otro'],
          ]} />
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-2">Otros filtros</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Input label="Nombre" campo="primerNombre" />
          <Input label="Apellido" campo="primerApellido" />
          <Input label="Número de identificación" campo="numeroIdentificacion" />
          <Input label="Correo electrónico" campo="correoElectronico" />
          <Select label="País de residencia" campo="paisResidencia" opciones={PAISES.map(p => [p, p])} />
          <Input label="Ciudad de residencia" campo="ciudadServicio" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Registrado desde" campo="fechaDesde" tipo="date" />
            <Input label="Hasta" campo="fechaHasta" tipo="date" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={buscar} disabled={cargando}
            className="bg-blue-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-900 disabled:opacity-50">
            Buscar
          </button>
          <button onClick={limpiar}
            className="border border-gray-300 text-gray-600 px-6 py-2 rounded text-sm hover:bg-gray-50">
            Limpiar
          </button>
        </div>
      </div>

      {buscado && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-wrap gap-2">
            <p className="text-sm text-gray-600 font-medium">{resultados.length} resultado(s) · {resultados.filter(r => r.correo_electronico).length} con correo</p>
            <div className="flex items-center gap-3">
              {/* Selector de columnas */}
              <div className="relative">
                <button onClick={() => setMostrarColumnas(!mostrarColumnas)}
                  className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
                  Columnas para Excel
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                    {columnasSeleccionadas.length}
                  </span>
                </button>
                {mostrarColumnas && (
                  <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-72 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 sticky top-0 bg-white">
                      <span className="text-xs font-medium text-gray-600">Selecciona columnas</span>
                      <div className="flex gap-2">
                        <button onClick={seleccionarTodas} className="text-xs text-blue-600 hover:underline">Todas</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={deseleccionarTodas} className="text-xs text-gray-500 hover:underline">Ninguna</button>
                      </div>
                    </div>
                    {TODAS_COLUMNAS.map(col => (
                      <label key={col.key} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                        <input type="checkbox"
                          checked={columnasSeleccionadas.includes(col.key)}
                          onChange={() => toggleColumna(col.key)}
                          className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="text-xs text-gray-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {resultados.length > 0 && columnasSeleccionadas.length > 0 && (
                <button onClick={exportarExcel}
                  className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">
                  Exportar a Excel
                </button>
              )}
            </div>
          </div>

          {/* Tabla de resultados */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columnasVisibles.map(col => (
                    <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultados.length === 0 ? (
                  <tr><td colSpan={columnasVisibles.length || 1} className="text-center py-8 text-gray-400">No hay resultados</td></tr>
                ) : resultados.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    {columnasVisibles.map(col => (
                      <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-xs truncate">
                        {col.key === 'estado_proceso' ? (
                          <span className="text-xs">{ESTADOS_LABELS[r[col.key]] || r[col.key]}</span>
                        ) : formatearValor(r, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {buscado && resultados.length > 0 && (
        <div className="bg-white rounded-lg border border-blue-200 p-5 mt-4">
          <p className="text-sm font-bold text-blue-800 mb-1">Enviar correo a estos {resultados.filter(r => r.correo_electronico).length} miembro(s)</p>
          <p className="text-xs text-gray-400 mb-4">Se enviará a todos los que tengan correo registrado en los resultados actuales.</p>
          {mensajeCorreo && <p className="text-sm text-center py-2 bg-gray-50 border rounded-lg mb-3">{mensajeCorreo}</p>}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Asunto</label>
            <input type="text" value={asunto} onChange={e => setAsunto(e.target.value)}
              placeholder="Asunto del correo..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje</label>
            <textarea value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={5}
              placeholder="Escribe el mensaje aquí..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <button onClick={enviarCorreo} disabled={enviando || !asunto.trim() || !cuerpo.trim()}
            className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
            {enviando ? 'Enviando...' : '✉️ Enviar correo'}
          </button>
        </div>
      )}
    </div>
  )
}
