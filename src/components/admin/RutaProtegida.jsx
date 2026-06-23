import { Navigate } from 'react-router-dom'

export default function RutaProtegida({ children }) {
  const sesion = localStorage.getItem('admin_sesion')
  if (!sesion) return <Navigate to="/admin/login" />
  return children
}
