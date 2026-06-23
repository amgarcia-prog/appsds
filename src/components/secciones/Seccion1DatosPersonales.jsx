import { useState, useRef, useCallback } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import API_URL from '../../config.js'

const ESTADOS_CIVILES = [
  'Casado por la iglesia', 'Casado por lo civil', 'Casado por ambas',
  'Divorciado', 'Separado', 'Soltero', 'Unión libre', 'Viudo'
]

const TIPOS_IDENTIFICACION = [
  'Tarjeta de identidad',
  'Cédula de ciudadanía (Colombia)',
  'Cédula extranjería o documento de extranjero'
]

export default function Seccion1DatosPersonales({ datos, actualizar, siguiente }) {
  const [errores, setErrores] = useState({})
  const [cedulaDuplicada, setCedulaDuplicada] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [confirmarClave, setConfirmarClave] = useState('')
  const [modoCamara, setModoCamara] = useState(false)
  const [streamActivo, setStreamActivo] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setModoCamara(true)
      setStreamActivo(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch {
      alert('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    }
  }

  const cerrarCamara = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setModoCamara(false)
    setStreamActivo(false)
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
    if (!archivo) return
    setSubiendoFoto(true)
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      formData.append('bucket', 'fotos-miembros')
      formData.append('carpeta', 'registro')
      const res = await fetch('${API_URL}/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) actualizar({ fotoUrl: data.url })
    } catch (e) { console.error(e) }
    setSubiendoFoto(false)
  }

  const subirFoto = (archivo) => subirFotoArchivo(archivo)

  const verificarCedula = async (numero) => {
    if (!numero) return
    try {
      const res = await fetch(`${API_URL}/api/verificar-cedula?numero=${encodeURIComponent(numero)}`)
      const data = await res.json()
      setCedulaDuplicada(data.existe)
    } catch (e) {
      console.error(e)
    }
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!datos.clave) nuevosErrores.clave = 'Debes crear una clave de acceso'
    else if (datos.clave.length < 6) nuevosErrores.clave = 'La clave debe tener al menos 6 caracteres'
    else if (datos.clave !== confirmarClave) nuevosErrores.confirmarClave = 'Las claves no coinciden'
    if (!datos.aceptaDatos || datos.aceptaDatos !== 'Acepto')
      nuevosErrores.aceptaDatos = 'Debes aceptar el tratamiento de datos para continuar'
    if (!datos.fechaNacimiento) nuevosErrores.fechaNacimiento = 'Campo requerido'
    if (!datos.tipoIdentificacion) nuevosErrores.tipoIdentificacion = 'Campo requerido'
    if (!datos.numeroIdentificacion) nuevosErrores.numeroIdentificacion = 'Campo requerido'
    if (!datos.sexo) nuevosErrores.sexo = 'Campo requerido'
    if (!datos.primerNombre) nuevosErrores.primerNombre = 'Campo requerido'
    if (!datos.primerApellido) nuevosErrores.primerApellido = 'Campo requerido'
    if (!datos.estadoCivil) nuevosErrores.estadoCivil = 'Campo requerido'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSiguiente = () => {
    if (cedulaDuplicada) return
    if (validar()) siguiente()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Datos Personales</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 1 de 13</p>

      {/* Clave de acceso */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">Crea tu clave de acceso</p>
        <p className="text-xs text-gray-500 mb-3">Con esta clave podrás ingresar al portal y actualizar tu información. Mínimo 6 caracteres.</p>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Clave <CampoObligatorio /></label>
          <input type="password" value={datos.clave || ''} onChange={e => actualizar({ clave: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.clave ? 'border-red-400' : 'border-gray-300'}`} />
          {errores.clave && <p className="text-red-500 text-xs mt-1">{errores.clave}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar clave <CampoObligatorio /></label>
          <input type="password" value={confirmarClave} onChange={e => setConfirmarClave(e.target.value)}
            placeholder="Repite tu clave"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.confirmarClave ? 'border-red-400' : 'border-gray-300'}`} />
          {errores.confirmarClave && <p className="text-red-500 text-xs mt-1">{errores.confirmarClave}</p>}
        </div>
      </div>

      {/* Autorización datos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 mb-3">
          Al diligenciar este formulario, declaro que he sido informado sobre la política de
          tratamiento de datos personales de la Asociación privada de fieles laicos Donum
          Christi Comunidad Apostólica Servidores del Servidor hijo di Padre Pío, a quien
          autorizo de manera libre, previa, expresa y voluntaria para recolectar, almacenar,
          utilizar o suprimir mis datos personales en actividades relacionados con la misión
          de la comunidad.
        </p>
        <a
          href="https://servidoresdelservidor.org/wp-content/uploads/2025/05/PoliticaDatosPersonales.pdf"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 text-sm underline block mb-3"
        >
          Ver política completa de tratamiento de datos
        </a>
        <p className="font-medium text-sm mb-2">¿Aceptas el tratamiento de datos personales? <CampoObligatorio /></p>
        <div className="flex gap-4">
          {['Acepto', 'No acepto'].map(op => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="aceptaDatos"
                value={op}
                checked={datos.aceptaDatos === op}
                onChange={e => {
                  const acepta = e.target.value === 'Acepto'
                  actualizar({
                    aceptaDatos: e.target.value,
                    timestampAceptaDatos: acepta ? new Date().toISOString() : null,
                    versionPolitica: 'v1.0-2026',
                    hashPolitica: acepta ? '11F742AA919793C1099D413D4E7B3F0838468EB5584417F583F5DA307EBF7410' : null,
                  })
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
        {errores.aceptaDatos && <p className="text-red-500 text-xs mt-2">{errores.aceptaDatos}</p>}
        {datos.aceptaDatos === 'No acepto' && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm font-medium">No es posible continuar</p>
            <p className="text-red-600 text-xs mt-1">
              Para registrarte en la comunidad es necesario aceptar el tratamiento de datos personales.
              Si tienes dudas, puedes consultar la política completa en el enlace anterior.
            </p>
          </div>
        )}
      </div>

      {datos.aceptaDatos === 'No acepto' ? null : (<>
      {/* Fecha de nacimiento */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de nacimiento <CampoObligatorio />
        </label>
        <input
          type="date"
          value={datos.fechaNacimiento}
          onChange={e => actualizar({ fechaNacimiento: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errores.fechaNacimiento && <p className="text-red-500 text-xs mt-1">{errores.fechaNacimiento}</p>}
      </div>

      {/* Tipo de identificación */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de identificación <CampoObligatorio />
        </label>
        <select
          value={datos.tipoIdentificacion}
          onChange={e => actualizar({ tipoIdentificacion: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona...</option>
          {TIPOS_IDENTIFICACION.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errores.tipoIdentificacion && <p className="text-red-500 text-xs mt-1">{errores.tipoIdentificacion}</p>}
      </div>

      {/* Número de identificación */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de identificación <CampoObligatorio />
        </label>
        <input
          type="text"
          value={datos.numeroIdentificacion}
          onChange={e => { actualizar({ numeroIdentificacion: e.target.value }); setCedulaDuplicada(false) }}
          onBlur={e => verificarCedula(e.target.value)}
          placeholder="Ej: 1234567890"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${cedulaDuplicada ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {errores.numeroIdentificacion && <p className="text-red-500 text-xs mt-1">{errores.numeroIdentificacion}</p>}
        {cedulaDuplicada && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm font-medium">Este número de identificación ya está registrado.</p>
            <p className="text-red-600 text-xs mt-1">Si necesitas actualizar tus datos, contacta al administrador de la comunidad.</p>
          </div>
        )}
      </div>

      {/* Sexo */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sexo <CampoObligatorio />
        </label>
        <div className="flex gap-4">
          {['Femenino', 'Masculino'].map(op => (
            <label key={op} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sexo"
                value={op}
                checked={datos.sexo === op}
                onChange={e => actualizar({ sexo: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
        {errores.sexo && <p className="text-red-500 text-xs mt-1">{errores.sexo}</p>}
      </div>

      {/* Nombres */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primer nombre <CampoObligatorio />
        </label>
        <input
          type="text"
          value={datos.primerNombre}
          onChange={e => actualizar({ primerNombre: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errores.primerNombre && <p className="text-red-500 text-xs mt-1">{errores.primerNombre}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Segundo nombre
        </label>
        <input
          type="text"
          value={datos.segundoNombre}
          onChange={e => actualizar({ segundoNombre: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Apellidos */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primer apellido <CampoObligatorio />
        </label>
        <input
          type="text"
          value={datos.primerApellido}
          onChange={e => actualizar({ primerApellido: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errores.primerApellido && <p className="text-red-500 text-xs mt-1">{errores.primerApellido}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Segundo apellido
        </label>
        <input
          type="text"
          value={datos.segundoApellido}
          onChange={e => actualizar({ segundoApellido: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Foto */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Foto de perfil</label>

        {modoCamara ? (
          <div className="space-y-2">
            <video ref={videoRef} autoPlay playsInline
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-black"
              style={{ aspectRatio: '4/3' }} />
            <div className="flex gap-2">
              <button type="button" onClick={tomarFoto}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                📸 Tomar foto
              </button>
              <button type="button" onClick={cerrarCamara}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-300">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {datos.fotoUrl && (
              <div className="flex items-center gap-3 mb-2">
                <img src={datos.fotoUrl} alt="Foto de perfil" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                <p className="text-xs text-green-600">✓ Foto cargada correctamente</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={abrirCamara}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 border border-blue-200">
                📷 Usar cámara
              </button>
              <label className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200 cursor-pointer">
                🖼 Subir imagen
                <input type="file" accept="image/*" onChange={e => subirFoto(e.target.files[0])} className="hidden" />
              </label>
            </div>
            {subiendoFoto && <p className="text-xs text-blue-500">Subiendo foto...</p>}
          </div>
        )}
      </div>

      {/* Estado civil */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estado civil <CampoObligatorio />
        </label>
        <select
          value={datos.estadoCivil}
          onChange={e => actualizar({ estadoCivil: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona...</option>
          {ESTADOS_CIVILES.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        {errores.estadoCivil && <p className="text-red-500 text-xs mt-1">{errores.estadoCivil}</p>}
      </div>

      <BotonSiguiente onClick={handleSiguiente} />
      </>)}
    </div>
  )
}
