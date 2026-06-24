import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'
import API_URL from '../../config.js'

export default function LoginMiembro() {
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroIdentificacion, clave }),
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('miembro_sesion', JSON.stringify(data.miembro))
        navigate('/mi-perfil')
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
          <h1 className="text-xl font-bold text-blue-800">Servidores del Servidor</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresa con tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de identificación</label>
            <input type="text" value={numeroIdentificacion}
              onChange={e => setNumeroIdentificacion(e.target.value)}
              placeholder="Ej: 1234567890"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clave</label>
            <input type="password" value={clave}
              onChange={e => setClave(e.target.value)}
              placeholder="Tu clave de acceso"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={cargando}
            className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 text-sm">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          ¿No tienes clave? Contacta al administrador de tu ciudad.
        </p>
      </div>
    </div>
  )
}
