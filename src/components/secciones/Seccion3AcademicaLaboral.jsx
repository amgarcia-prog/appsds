import { useState } from 'react'
import CampoObligatorio from '../ui/CampoObligatorio'
import BotonSiguiente from '../ui/BotonSiguiente'
import BotonAnterior from '../ui/BotonAnterior'

const NIVELES = ['Enseñanza básica - Primaria', 'Enseñanza media - Secundaria - Bachillerato',
  'Técnico - Tecnólogo', 'Profesional universitario', 'Especialización',
  'Maestría', 'Doctorado', 'Post-Doctorado', 'Ninguna']

const OCUPACIONES = ['Ama de casa', 'Desempleado', 'Empleado', 'Empresario',
  'Estudiante', 'Independiente', 'Pensionado o jubilado']

export default function Seccion3AcademicaLaboral({ datos, actualizar, siguiente, anterior }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const e = {}
    if (!datos.nivelAcademico) e.nivelAcademico = 'Campo requerido'
    if (!datos.ocupacion) e.ocupacion = 'Campo requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Información Académica y Laboral</h2>
      <p className="text-sm text-gray-500 mb-6">Sección 3 de 13</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nivel académico <CampoObligatorio />
        </label>
        <select value={datos.nivelAcademico}
          onChange={e => actualizar({ nivelAcademico: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Selecciona...</option>
          {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {errores.nivelAcademico && <p className="text-red-500 text-xs mt-1">{errores.nivelAcademico}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
        <input type="text" value={datos.profesion}
          onChange={e => actualizar({ profesion: e.target.value })}
          placeholder="Ej: Ingeniero, Médico, Contador..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ocupación <CampoObligatorio />
        </label>
        <select value={datos.ocupacion}
          onChange={e => actualizar({ ocupacion: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Selecciona...</option>
          {OCUPACIONES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {errores.ocupacion && <p className="text-red-500 text-xs mt-1">{errores.ocupacion}</p>}
      </div>

      <BotonSiguiente onClick={() => { if (validar()) siguiente() }} />
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
