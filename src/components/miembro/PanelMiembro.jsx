import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'
import SelectorCiudad from '../ui/SelectorCiudad'
import API_URL from '../../config.js'

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'España', 'Estados Unidos', 'México',
  'Paraguay', 'Perú', 'Uruguay', 'Venezuela'
]

const ESTADOS_LABELS = {
  pendiente_formacion: 'Pendiente verificación de requisitos',
  no_cumple_requisitos: 'No cumple requisitos',
  cumple_requisitos: 'Cumple requisitos para formación',
  formacion_no_aprobada: 'Formación no aprobada',
  formacion_aprobada: 'Formación aprobada',
  pendiente_aprobacion: 'Pendiente por aprobación de junta',
  no_avalado_consejo: 'No avalado por el consejo',
  aprobado_consagracion: 'Aprobado para consagración',
  no_aprobado_junta: 'No aprobado por la junta',
  consagrado_paciente: 'Consagrado como hermano paciente',
  consagrado_servita: 'Consagrado como hermano servita',
  consagrado_pilar: 'Consagrado como hermano pilar',
}

const ESTADOS_COLORES = {
  pendiente_formacion: 'bg-yellow-100 text-yellow-800',
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

const TIPOS_IDENTIFICACION = ['Tarjeta de identidad', 'Cédula de ciudadanía (Colombia)', 'Cédula extranjería o documento de extranjero']
const ESTADOS_CIVILES = ['Casado por la iglesia', 'Casado por lo civil', 'Casado por ambas', 'Divorciado', 'Separado', 'Soltero', 'Unión libre', 'Viudo']
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const NIVELES_ACADEMICOS = ['Enseñanza básica - Primaria', 'Enseñanza media - Secundaria - Bachillerato', 'Técnico - Tecnólogo', 'Profesional universitario', 'Especialización', 'Maestría', 'Doctorado', 'Post-Doctorado', 'Ninguna']
const OCUPACIONES = ['Ama de casa', 'Desempleado', 'Empleado', 'Empresario', 'Estudiante', 'Independiente', 'Pensionado o jubilado']

function Campo({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function Selector({ label, value, onChange, opciones }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">Selecciona...</option>
        {opciones.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function PanelMiembro() {
  const [datos, setDatos] = useState(null)
  const [editados, setEditados] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pestaña, setPestaña] = useState('perfil')
  const [pasoConsagracion, setPasoConsagracion] = useState('inicio') // 'inicio' | 'motivacion' | 'enviado'
  const [motivacion, setMotivacion] = useState('')
  const [otraComunidad, setOtraComunidad] = useState('')
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [modoCamara, setModoCamara] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const navigate = useNavigate()

  const sesion = JSON.parse(localStorage.getItem('miembro_sesion') || '{}')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/miembro/perfil`, {
        headers: { 'x-miembro-id': sesion.id }
      })
      const data = await res.json()
      if (data.ok) setDatos(data.datos)
    } catch { }
    setCargando(false)
  }

  const actualizar = (campo, valor) => setEditados(prev => ({ ...prev, [campo]: valor }))
  const val = (campo) => editados[campo] !== undefined ? editados[campo] : (datos?.[campo] || '')

  const guardar = async () => {
    if (Object.keys(editados).length === 0) return
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/miembro/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-miembro-id': sesion.id },
        body: JSON.stringify(editados),
      })
      const data = await res.json()
      if (data.ok) {
        setDatos(prev => ({ ...prev, ...editados }))
        setEditados({})
        setMensaje('✅ Datos actualizados correctamente')
      } else {
        setMensaje('❌ Error al guardar')
      }
    } catch {
      setMensaje('❌ Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 3000)
  }

  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setModoCamara(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch { alert('No se pudo acceder a la cámara.') }
  }

  const cerrarCamara = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setModoCamara(false)
  }

  const tomarFoto = useCallback(async () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      cerrarCamara()
      const archivo = new File([blob], 'foto.jpg', { type: 'image/jpeg' })
      await subirFotoArchivo(archivo)
    }, 'image/jpeg', 0.9)
  }, [])

  const subirFotoArchivo = async (archivo) => {
    setSubiendoFoto(true)
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      formData.append('bucket', 'fotos-miembros')
      formData.append('carpeta', 'perfil')
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) actualizar('foto_url', data.url)
    } catch { }
    setSubiendoFoto(false)
  }

  const cerrarSesion = () => { localStorage.removeItem('miembro_sesion'); navigate('/login') }

  const hayEdiciones = Object.keys(editados).length > 0

  const enviarSolicitudConsagracion = async () => {
    if (!motivacion.trim()) return
    setEnviandoSolicitud(true)
    try {
      const res = await fetch(`${API_URL}/api/miembro/solicitar-consagracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-miembro-id': sesion.id },
        body: JSON.stringify({ motivacion, otra_comunidad: otraComunidad.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setPasoConsagracion('enviado')
        setDatos(prev => ({ ...prev, estado_proceso: 'pendiente_formacion' }))
      } else {
        setMensaje('❌ Error al enviar la solicitud')
        setTimeout(() => setMensaje(''), 3000)
      }
    } catch {
      setMensaje('❌ Error de conexión')
      setTimeout(() => setMensaje(''), 3000)
    }
    setEnviandoSolicitud(false)
  }

  const ESTADOS_ACTIVOS = ['pendiente_formacion', 'no_cumple_requisitos', 'cumple_requisitos', 'formacion_no_aprobada', 'formacion_aprobada', 'pendiente_aprobacion', 'no_avalado_consejo', 'aprobado_consagracion', 'no_aprobado_junta']

  if (cargando) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  if (!datos) return <div className="min-h-screen flex items-center justify-center text-gray-400">No se pudo cargar el perfil.</div>

  const nombre = [datos.primer_nombre, datos.segundo_nombre, datos.primer_apellido, datos.segundo_apellido].filter(Boolean).join(' ')
  const estadoLabel = ESTADOS_LABELS[datos.estado_proceso] || datos.estado_proceso
  const estadoColor = ESTADOS_COLORES[datos.estado_proceso] || 'bg-gray-100 text-gray-700'

  const esLaborioso = datos.estado_consagracion === 'laborioso'
  const esPacienteConsagrado = datos.estado_consagracion === 'paciente'
  const mostrarTabConsagracion = esLaborioso || esPacienteConsagrado
  const nivelLabel = esPacienteConsagrado ? 'hermano servita' : 'hermano paciente'
  const enProcesoActivo = ESTADOS_ACTIVOS.includes(datos.estado_proceso)

  const calcularAnosDesdeConsagracion = () => {
    if (!datos.fecha_consagracion) return null
    const hoy = new Date()
    const fc = new Date(datos.fecha_consagracion + 'T12:00:00')
    return (hoy.getFullYear() - fc.getFullYear()) * 12 + (hoy.getMonth() - fc.getMonth())
  }
  const mesesDesdeConsagracionPaciente = esPacienteConsagrado ? calcularAnosDesdeConsagracion() : null
  const cumple3Anos = mesesDesdeConsagracionPaciente !== null && mesesDesdeConsagracionPaciente >= 36

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-3 px-4 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
            <h1 className="text-base font-bold">Mi perfil</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-blue-200">{sesion.nombre}</span>
            {sesion.roles?.includes('responsable_formacion') && (
              <div className="flex bg-blue-900 rounded-lg overflow-hidden">
                <button onClick={() => navigate('/formacion')} className="text-xs px-3 py-1.5 text-blue-200 hover:text-white hover:bg-blue-700">Panel de formación</button>
                <button className="text-xs px-3 py-1.5 text-white font-medium bg-blue-600">Mi perfil</button>
              </div>
            )}
            <button onClick={cerrarSesion} className="text-xs text-blue-200 hover:text-white">Cerrar sesión</button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Estado del proceso */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Estado en la comunidad</p>
            <p className="font-semibold text-gray-800 mt-0.5">{nombre}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${estadoColor}`}>{estadoLabel}</span>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 mb-4 bg-gray-200 rounded-lg p-1 w-fit">
          {[
            { key: 'perfil', label: 'Datos personales' },
            { key: 'contacto', label: 'Contacto' },
            { key: 'academico', label: 'Académico / Laboral' },
            { key: 'medico', label: 'Información médica' },
            ...(mostrarTabConsagracion ? [{ key: 'consagracion', label: `Consagración como ${nivelLabel}` }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setPestaña(t.key)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${pestaña === t.key ? 'bg-white text-blue-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {mensaje && <div className="mb-4 text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>}

        <div className="bg-white rounded-lg border border-gray-200 p-5">

          {/* Sección 1 — Datos personales */}
          {pestaña === 'perfil' && (
            <div>
              {/* Foto */}
              <div className="mb-5 flex flex-col items-center gap-3">
                {val('foto_url') ? (
                  <img src={val('foto_url')} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-blue-200" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400 text-3xl">👤</div>
                )}
                {modoCamara ? (
                  <div className="space-y-2 w-full">
                    <video ref={videoRef} autoPlay playsInline className="w-full max-w-xs rounded-lg border border-gray-300 bg-black mx-auto block" style={{ aspectRatio: '4/3' }} />
                    <div className="flex gap-2 justify-center">
                      <button type="button" onClick={tomarFoto} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">📸 Tomar foto</button>
                      <button type="button" onClick={cerrarCamara} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={abrirCamara} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 border border-blue-200">📷 Cámara</button>
                    <label className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 border border-gray-200 cursor-pointer">
                      🖼 Subir
                      <input type="file" accept="image/*" onChange={e => subirFotoArchivo(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                )}
                {subiendoFoto && <p className="text-xs text-blue-500">Subiendo foto...</p>}
              </div>

              <Campo label="Primer nombre" value={val('primer_nombre')} onChange={v => actualizar('primer_nombre', v)} />
              <Campo label="Segundo nombre" value={val('segundo_nombre')} onChange={v => actualizar('segundo_nombre', v)} />
              <Campo label="Primer apellido" value={val('primer_apellido')} onChange={v => actualizar('primer_apellido', v)} />
              <Campo label="Segundo apellido" value={val('segundo_apellido')} onChange={v => actualizar('segundo_apellido', v)} />

              <Selector label="Tipo de identificación" value={val('tipo_identificacion')} onChange={v => actualizar('tipo_identificacion', v)} opciones={TIPOS_IDENTIFICACION} />
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Número de identificación</label>
                <input type="text" value={datos.numero_identificacion || ''} readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>

              <Campo label="Fecha de nacimiento" value={val('fecha_nacimiento')} onChange={v => actualizar('fecha_nacimiento', v)} type="date" />
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Sexo</label>
                <div className="flex gap-4">
                  {['Femenino', 'Masculino'].map(op => (
                    <label key={op} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={val('sexo') === op} onChange={() => actualizar('sexo', op)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{op}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Selector label="Estado civil" value={val('estado_civil')} onChange={v => actualizar('estado_civil', v)} opciones={ESTADOS_CIVILES} />
            </div>
          )}

          {/* Sección 2 — Contacto */}
          {pestaña === 'contacto' && (
            <div>
              <Campo label="Correo electrónico" value={val('correo_electronico')} onChange={v => actualizar('correo_electronico', v)} type="email" />
              <Campo label="Teléfono móvil" value={val('telefono_movil')} onChange={v => actualizar('telefono_movil', v)} />
              <Campo label="Teléfono fijo" value={val('telefono_fijo')} onChange={v => actualizar('telefono_fijo', v)} />
              <Campo label="Otro teléfono" value={val('otro_telefono')} onChange={v => actualizar('otro_telefono', v)} />

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">País de residencia</label>
                <select value={val('pais_residencia')} onChange={e => { actualizar('pais_residencia', e.target.value); actualizar('departamento_servicio', ''); actualizar('ciudad_servicio', '') }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Selecciona...</option>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {val('pais_residencia') && (
                <div className="mb-4">
                  <SelectorCiudad
                    pais={val('pais_residencia')}
                    departamento={val('departamento_servicio')}
                    ciudad={val('ciudad_servicio')}
                    onChangeDepartamento={v => { actualizar('departamento_servicio', v); actualizar('ciudad_servicio', '') }}
                    onChangeCiudad={v => actualizar('ciudad_servicio', v)}
                  />
                </div>
              )}

              <Campo label="Dirección de residencia" value={val('direccion_residencia')} onChange={v => actualizar('direccion_residencia', v)} />
            </div>
          )}

          {/* Sección 3 — Académico / Laboral */}
          {pestaña === 'academico' && (
            <div>
              <Selector label="Nivel académico" value={val('nivel_academico')} onChange={v => actualizar('nivel_academico', v)} opciones={NIVELES_ACADEMICOS} />
              <Campo label="Profesión" value={val('profesion')} onChange={v => actualizar('profesion', v)} />
              <Selector label="Ocupación" value={val('ocupacion')} onChange={v => actualizar('ocupacion', v)} opciones={OCUPACIONES} />
            </div>
          )}

          {/* Sección 4 — Médica */}
          {pestaña === 'medico' && (
            <div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de sangre</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIPOS_SANGRE.map(t => (
                    <label key={t} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer text-sm font-medium transition-colors
                      ${val('tipo_sangre') === t ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="tipoSangre" value={t} checked={val('tipo_sangre') === t}
                        onChange={() => actualizar('tipo_sangre', t)} className="hidden" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <Campo label="EPS o sistema de salud" value={val('eps_servicio')} onChange={v => actualizar('eps_servicio', v)} />
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Indicaciones médicas</label>
                <textarea value={val('indicaciones_medicas') || ''} onChange={e => actualizar('indicaciones_medicas', e.target.value)} rows={3}
                  placeholder="Alergias, condiciones especiales, medicamentos..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {/* Pestaña Consagración */}
          {pestaña === 'consagracion' && (
            <div>
              <h2 className="text-base font-bold text-blue-800 mb-1">Consagración como {nivelLabel}</h2>
              <p className="text-sm text-gray-500 mb-5">
                {esPacienteConsagrado
                  ? 'Si deseas iniciar el proceso de consagración como hermano servita, completa la solicitud a continuación.'
                  : 'Si deseas iniciar el proceso de consagración como hermano paciente, completa la solicitud a continuación.'}
              </p>

              {/* Aviso de tiempo para pacientes que quieren ser servitas */}
              {esPacienteConsagrado && !enProcesoActivo && pasoConsagracion === 'inicio' && (
                <div className={`rounded-lg p-4 mb-4 border ${cumple3Anos ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <p className={`text-sm font-medium mb-1 ${cumple3Anos ? 'text-green-800' : 'text-amber-800'}`}>
                    {cumple3Anos ? '✓ Cumples el tiempo requerido' : '⚠️ Requisito de tiempo'}
                  </p>
                  <p className={`text-xs ${cumple3Anos ? 'text-green-700' : 'text-amber-700'}`}>
                    Para consagrarte como hermano servita se requieren al menos 3 años desde tu consagración como paciente.
                    {mesesDesdeConsagracionPaciente !== null
                      ? ` Llevas ${mesesDesdeConsagracionPaciente} meses (${Math.floor(mesesDesdeConsagracionPaciente / 12)} año${Math.floor(mesesDesdeConsagracionPaciente / 12) !== 1 ? 's' : ''} y ${mesesDesdeConsagracionPaciente % 12} mes${mesesDesdeConsagracionPaciente % 12 !== 1 ? 'es' : ''}).`
                      : ' No se encontró fecha de consagración registrada.'}
                  </p>
                  {!cumple3Anos && (
                    <p className="text-xs text-amber-600 mt-2">Puedes enviar la solicitud de todas formas — el responsable de formación verificará el requisito.</p>
                  )}
                </div>
              )}

              {enProcesoActivo && pasoConsagracion !== 'enviado' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-blue-800 mb-1">Ya tienes un proceso en curso</p>
                  <p className="text-xs text-blue-600">Tu solicitud de consagración como {nivelLabel} está siendo tramitada. Puedes hacer seguimiento con tu responsable de formación.</p>
                </div>
              ) : pasoConsagracion === 'enviado' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-2">✝</p>
                  <p className="text-sm font-medium text-green-800 mb-1">¡Solicitud enviada!</p>
                  <p className="text-xs text-green-700">Tu solicitud de consagración como {nivelLabel} fue recibida. El responsable de formación de tu ciudad la revisará próximamente.</p>
                </div>
              ) : pasoConsagracion === 'inicio' ? (
                <div className="text-center">
                  <p className="text-4xl mb-4">✝</p>
                  <p className="text-sm text-gray-700 mb-6">
                    Al enviar esta solicitud, el responsable de formación de tu ciudad podrá iniciar el proceso de consagración contigo.
                  </p>
                  <button
                    onClick={() => setPasoConsagracion('motivacion')}
                    className="bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-800">
                    Quiero consagrarme como {nivelLabel}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-800 font-medium">¿Estás seguro de que deseas consagrarte como {nivelLabel}?</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Perteneces a otra comunidad o congregación religiosa?
                    </label>
                    <input
                      type="text"
                      value={otraComunidad}
                      onChange={e => setOtraComunidad(e.target.value)}
                      placeholder="Si perteneces a otra, escribe cuál. Si no, deja en blanco."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                    />
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Por qué deseas consagrarte como {nivelLabel}? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motivacion}
                    onChange={e => setMotivacion(e.target.value)}
                    rows={4}
                    placeholder="Comparte el motivo de tu deseo de consagración..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setPasoConsagracion('inicio')}
                      className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button
                      onClick={enviarSolicitudConsagracion}
                      disabled={enviandoSolicitud || !motivacion.trim()}
                      className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                      {enviandoSolicitud ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {hayEdiciones && pestaña !== 'consagracion' && (
            <button onClick={guardar} disabled={guardando}
              className="w-full mt-4 bg-blue-700 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {guardando ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
