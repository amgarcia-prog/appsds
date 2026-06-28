import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginCIO() {
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const ingresar = (e) => {
    e.preventDefault()
    if (clave === 'CIO2026') {
      localStorage.setItem('cio_sesion', 'ok')
      navigate('/cio')
    } else {
      setError('Clave incorrecta')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <p className="text-2xl font-bold text-blue-800 tracking-tight">CIO</p>
          <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Business Process Transformation</p>
          <p className="text-sm text-gray-500 mt-2">Control de proyectos y tiempo</p>
        </div>
        <form onSubmit={ingresar} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Clave de acceso</label>
            <input
              type="password"
              value={clave}
              onChange={e => { setClave(e.target.value); setError('') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit"
            className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
