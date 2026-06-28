import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RegistroForm from './components/RegistroForm'
import LoginAdmin from './components/admin/LoginAdmin'
import PanelAdmin from './components/admin/PanelAdmin'
import RutaProtegida from './components/admin/RutaProtegida'
import LoginMiembro from './components/miembro/LoginMiembro'
import PanelFormacion from './components/miembro/PanelFormacion'
import PanelMiembro from './components/miembro/PanelMiembro'
import RutaProtegidaMiembro from './components/miembro/RutaProtegidaMiembro'
import LoginCIO from './components/cio/LoginCIO'
import PanelCIO from './components/cio/PanelCIO'

const RutaCIO = ({ children }) => {
  return localStorage.getItem('cio_sesion') === 'ok' ? children : <Navigate to="/cio/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistroForm />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/admin" element={
          <RutaProtegida>
            <PanelAdmin />
          </RutaProtegida>
        } />
        <Route path="/login" element={<LoginMiembro />} />
        <Route path="/formacion" element={
          <RutaProtegidaMiembro roles={['responsable_formacion']}>
            <PanelFormacion />
          </RutaProtegidaMiembro>
        } />
        <Route path="/mi-perfil" element={
          <RutaProtegidaMiembro>
            <PanelMiembro />
          </RutaProtegidaMiembro>
        } />
        <Route path="/cio/login" element={<LoginCIO />} />
        <Route path="/cio" element={<RutaCIO><PanelCIO /></RutaCIO>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
