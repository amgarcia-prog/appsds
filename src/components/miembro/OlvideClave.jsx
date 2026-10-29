import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'
import API_URL from '../../config.js'

export default function OlvideClave() {
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/olvide-clave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroIdentificacion }),
      })
      const data = await res.json()
      if (data.ok) {
        setMensaje(data.mensaje)
        setEnviado(true)
      } else {
        setError(data.mensaje)
      }
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover mb-3" />
          <h1 className="text-xl font-bold text-blue-800">¿Olvidaste tu clave?</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Te enviaremos un enlace a tu correo registrado para crear una nueva.</p>
        </div>

        {enviado ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 text-sm">{mensaje}</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de identificación</label>
              <input type="text" value={numeroIdentificacion}
                onChange={e => setNumeroIdentificacion(e.target.value)}
                placeholder="Ej: 1234567890"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={cargando}
              className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 text-sm">
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center text-sm text-blue-700 underline mt-6">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
