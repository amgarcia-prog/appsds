import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'
import API_URL from '../../config.js'

export default function RestablecerClave() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [clave, setClave] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (clave !== confirmar) return setError('Las claves no coinciden.')
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/restablecer-clave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, claveNueva: clave }),
      })
      const data = await res.json()
      if (data.ok) setListo(true)
      else setError(data.mensaje)
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
          <h1 className="text-xl font-bold text-blue-800">Crear nueva clave</h1>
        </div>

        {!token ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 text-sm">Este enlace no es válido. Solicita uno nuevo desde "¿Olvidaste tu clave?".</p>
          </div>
        ) : listo ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 text-sm mb-3">Tu clave se actualizó correctamente.</p>
            <Link to="/login" className="text-blue-700 text-sm font-medium underline">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clave nueva</label>
              <input type="password" value={clave}
                onChange={e => setClave(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar clave</label>
              <input type="password" value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={cargando}
              className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 text-sm">
              {cargando ? 'Guardando...' : 'Guardar nueva clave'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
