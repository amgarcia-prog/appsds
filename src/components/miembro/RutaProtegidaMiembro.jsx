import { Navigate } from 'react-router-dom'

export default function RutaProtegidaMiembro({ children, roles = [] }) {
  const sesionRaw = localStorage.getItem('miembro_sesion')
  if (!sesionRaw) return <Navigate to="/login" />

  try {
    const sesion = JSON.parse(sesionRaw)
    if (roles.length > 0 && !roles.some(r => sesion.roles?.includes(r))) {
      return <Navigate to="/login" />
    }
    return children
  } catch {
    return <Navigate to="/login" />
  }
}
