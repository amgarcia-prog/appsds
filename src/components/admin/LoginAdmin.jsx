import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'

const USUARIO = 'amgarcia'
const CLAVE = 'SDS2026admin'

export default function LoginAdmin() {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (usuario === USUARIO && clave === CLAVE) {
      localStorage.setItem('admin_sesion', 'activa')
      navigate('/admin')
    } else {
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
          <h1 className="text-xl font-bold text-blue-800">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Servidores del Servidor</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-900 transition-colors"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">Servido sea Jesucristo</p>
      </div>
    </div>
  )
}
