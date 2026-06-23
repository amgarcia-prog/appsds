import { useState } from 'react'
import logo from '../assets/logo-servidores.jpg'
import API_URL from '../config.js'
import Seccion1DatosPersonales from './secciones/Seccion1DatosPersonales'
import Seccion2Contacto from './secciones/Seccion2Contacto'
import Seccion3AcademicaLaboral from './secciones/Seccion3AcademicaLaboral'
import Seccion4Medica from './secciones/Seccion4Medica'
import Seccion5Comunitaria from './secciones/Seccion5Comunitaria'
import Seccion6Coordinador from './secciones/Seccion6Coordinador'
import Seccion7Consejo from './secciones/Seccion7Consejo'
import Seccion8MiembroConsejo from './secciones/Seccion8MiembroConsejo'
import Seccion9EstadoConsagracion from './secciones/Seccion9EstadoConsagracion'
import Seccion10Laborioso from './secciones/Seccion10Laborioso'
import Seccion11PacienteServita from './secciones/Seccion11PacienteServita'
import Seccion12Pilar from './secciones/Seccion12Pilar'
import Seccion13Contrato from './secciones/Seccion13Contrato'
import ConfirmacionRegistro from './ConfirmacionRegistro'

const TOTAL_SECCIONES = 13

export default function RegistroForm() {
  const [seccionActual, setSeccionActual] = useState(1)
  const [registroCompletado, setRegistroCompletado] = useState(false)
  const [datos, setDatos] = useState({
    // Sección 1
    aceptaDatos: '',
    fechaNacimiento: '',
    tipoIdentificacion: '',
    numeroIdentificacion: '',
    sexo: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    estadoCivil: '',
    // Sección 2
    telefonoMovil: '',
    telefonoFijo: '',
    otroTelefono: '',
    correoElectronico: '',
    paisResidencia: '',
    departamentoServicio: '',
    ciudadServicio: '',
    direccionResidencia: '',
    // Sección 3
    nivelAcademico: '',
    profesion: '',
    ocupacion: '',
    // Sección 4
    tipoSangre: '',
    epsServicio: '',
    indicacionesMedicas: '',
    // Sección 10
    perteneceOtraComunidad: '',
    // Sección 12
    responsabilidadesPilar: [],
    // Sección 5
    comoLlegoComunitad: '',
    paisServicio: '',
    departamentoDondeSirve: '',
    ciudadDondeSirve: '',
    puntosServicio: [],
    esCoordinador: '',
    // Sección 6
    puntosCoordina: [],
    // Sección 7
    perteneceConsejo: '',
    // Sección 8
    fechaInicioConsejo: '',
    responsabilidadesConsejo: [],
    // Sección 9
    estadoConsagracion: '',
    // Sección 10
    fechaInicioServicio: '',
    porQueConsagrarse: '',
    // Sección 11
    fechaConsagracion: '',
    // Sección 12
    fechaInicioEncargo: '',
    // Sección 13
    aceptaContrato: false,
  })

  const actualizarDatos = (nuevosDatos) => {
    setDatos(prev => ({ ...prev, ...nuevosDatos }))
  }

  const siguienteSeccion = (seccion) => {
    setSeccionActual(seccion || seccionActual + 1)
  }

  const seccionAnterior = () => {
    setSeccionActual(prev => {
      switch (prev) {
        case 7: return datos.esCoordinador === 'Sí' ? 6 : 5
        case 9: return datos.perteneceConsejo === 'Sí' ? 8 : 7
        case 11: return 9
        case 12: return 9
        case 13: {
          if (datos.estadoConsagracion === 'laborioso') return 10
          if (datos.estadoConsagracion === 'paciente' || datos.estadoConsagracion === 'servita') return 11
          if (datos.estadoConsagracion === 'pilar') return 12
          return 9
        }
        default: return prev - 1
      }
    })
  }

  const calcularProgreso = () => {
    return Math.round((seccionActual / TOTAL_SECCIONES) * 100)
  }

  const handleSubmit = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })
      const resultado = await respuesta.json()
      if (resultado.ok) {
        setRegistroCompletado(true)
      } else {
        alert(resultado.mensaje || 'Hubo un error al enviar el registro. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error)
      alert('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.')
    }
  }

  if (registroCompletado) {
    return <ConfirmacionRegistro datos={datos} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-4 px-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src={logo} alt="Logo Servidores del Servidor" className="w-10 h-10 rounded-full object-cover" />
            <h1 className="text-lg font-bold">Registro Hermanos SDS</h1>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Paso {seccionActual} de {TOTAL_SECCIONES}</span>
              <span>{calcularProgreso()}%</span>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calcularProgreso()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {seccionActual === 1 && (
          <Seccion1DatosPersonales
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
          />
        )}
        {seccionActual === 2 && (
          <Seccion2Contacto
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 3 && (
          <Seccion3AcademicaLaboral
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 4 && (
          <Seccion4Medica
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 5 && (
          <Seccion5Comunitaria
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 6 && (
          <Seccion6Coordinador
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 7 && (
          <Seccion7Consejo
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 8 && (
          <Seccion8MiembroConsejo
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 9 && (
          <Seccion9EstadoConsagracion
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={siguienteSeccion}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 10 && (
          <Seccion10Laborioso
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={() => siguienteSeccion(13)}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 11 && (
          <Seccion11PacienteServita
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={() => siguienteSeccion(13)}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 12 && (
          <Seccion12Pilar
            datos={datos}
            actualizar={actualizarDatos}
            siguiente={() => siguienteSeccion(13)}
            anterior={seccionAnterior}
          />
        )}
        {seccionActual === 13 && (
          <Seccion13Contrato
            datos={datos}
            actualizar={actualizarDatos}
            onSubmit={handleSubmit}
            anterior={seccionAnterior}
          />
        )}
      </div>
    </div>
  )
}
