import { useState } from 'react'
import BotonAnterior from '../ui/BotonAnterior'
import { sha256 } from '../../utils/hash'

const TEXTO_CONTRATO = `CONTRATO DE VOLUNTARIADO
DONUM CHRISTI COMUNIDAD APOSTÓLICA SERVIDORES DEL SERVIDOR HIJOS DI PADRE PÍO

Entre los suscritos: De una parte, la asociación DONUM CHRISTI COMUNIDAD APOSTÓLICA SERVIDORES DEL SERVIDOR HIJOS DI PADRE PÍO, sin ánimo de lucro, con domicilio principal en Bogotá D.C., Colombia, NIT 900.049.867-5, representada legalmente por JOSÉ LEONARDO ESPITIA TOLEDO, C.C. No. 1.098.699.844 de Bucaramanga, que en adelante se denominará SERVIDORES DEL SERVIDOR; y de la otra parte, {NOMBRE}, mayor de edad, identificado(a) con {TIPO_ID} número {NUMERO_ID}, con domicilio en {CIUDAD}, {PAIS}, que en adelante se denominará EL/LA VOLUNTARIO(A). El presente contrato se suscribe en el marco de la Ley 720 de 2001 (Ley del Voluntariado de Colombia) y su decreto reglamentario 2019 de 2006.

PRIMERO — NATURALEZA DEL VÍNCULO: El presente contrato establece un vínculo de voluntariado de naturaleza altruista, solidaria y gratuita. La vinculación de EL/LA VOLUNTARIO(A) a SERVIDORES DEL SERVIDOR no genera relación laboral, contractual remunerada ni obligación económica de ningún tipo entre las partes.

SEGUNDO — OBJETO: EL/LA VOLUNTARIO(A) se compromete a prestar sus servicios de manera libre, voluntaria y gratuita en el desarrollo de las actividades misionales de SERVIDORES DEL SERVIDOR, que incluyen: atención a personas en situación de vulnerabilidad, servicio en comedores, patios y puntos de servicio, actividades de formación, evangelización y misiones.

TERCERO — GRATUIDAD Y RENUNCIA A RETRIBUCIÓN: EL/LA VOLUNTARIO(A) declara expresamente que todos los servicios prestados son completamente gratuitos, sin esperar retribución económica, compensación, indemnización ni contraprestación alguna.

CUARTO — COMPROMISOS DEL VOLUNTARIO(A): Actuar conforme a los principios, valores y reglamentos internos. Cumplir el Código de Conducta y el Manual del Buen Trato. Acatar las instrucciones de los responsables y directivos. Guardar confidencialidad sobre información sensible de beneficiarios y miembros. Representar dignamente a SERVIDORES DEL SERVIDOR.

QUINTO — COMPROMISOS DE SERVIDORES DEL SERVIDOR: Proveer orientación, formación y acompañamiento necesarios. Tratar al/la voluntario(a) con respeto y dignidad. Velar por condiciones seguras en el desarrollo de las actividades.

SEXTO — DURACIÓN Y TERMINACIÓN: El contrato es de duración indefinida y podrá terminarse por decisión libre del/la voluntario(a) o por incumplimiento de compromisos. La terminación no generará derecho a indemnización ni prestación social alguna.

SÉPTIMO — RENUNCIA A ACCIONES LEGALES: EL/LA VOLUNTARIO(A) renuncia expresamente a cualquier acción jurídica, reclamación laboral, indemnización económica o moral contra SERVIDORES DEL SERVIDOR, dada la naturaleza voluntaria y gratuita de su vinculación.

OCTAVO — ACEPTACIÓN DIGITAL: El presente contrato se suscribe digitalmente. La aceptación electrónica junto con el registro de nombre completo, número de identificación, fecha, hora y dirección IP tiene plena validez probatoria equivalente a la firma manuscrita.

NOVENO — LEY APLICABLE: El presente contrato se rige principalmente por la legislación colombiana vigente en materia de voluntariado (Ley 720 de 2001), sin perjuicio de las normas aplicables en el país de residencia del/la voluntario(a).`

export default function Seccion13Contrato({ datos, actualizar, onSubmit, anterior }) {
  const [errores, setErrores] = useState({})

  const nombreCompleto = [datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido]
    .filter(Boolean).join(' ')

  const contratoPersonalizado = TEXTO_CONTRATO
    .replace('{NOMBRE}', nombreCompleto)
    .replace('{TIPO_ID}', datos.tipoIdentificacion)
    .replace('{NUMERO_ID}', datos.numeroIdentificacion)
    .replace('{CIUDAD}', datos.ciudadServicio)
    .replace('{PAIS}', datos.paisResidencia)

  const validar = () => {
    const e = {}
    if (!datos.aceptaContrato) e.aceptaContrato = 'Debes aceptar el contrato de voluntariado para continuar'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-1">Contrato de Voluntariado</h2>
      <p className="text-sm text-gray-500 mb-4">Sección 13 de 13 — Último paso</p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 max-h-72 overflow-y-auto">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
          {contratoPersonalizado}
        </pre>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={datos.aceptaContrato}
            onChange={async e => {
              const acepta = e.target.checked
              const hash = acepta ? await sha256(TEXTO_CONTRATO) : null
              actualizar({
                aceptaContrato: acepta,
                timestampContrato: acepta ? new Date().toISOString() : null,
                versionContrato: 'v1.0-2026',
                hashContrato: hash,
              })
            }}
            className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-700">
            <strong>Acepto libre y voluntariamente</strong> los términos del presente Contrato de Voluntariado,
            declarando que he leído y comprendido su contenido en su totalidad.
            Entiendo que esta aceptación digital, junto con mis datos de identificación, tiene plena validez legal.
          </span>
        </label>
        {errores.aceptaContrato && <p className="text-red-500 text-xs mt-2">{errores.aceptaContrato}</p>}
      </div>

      <button
        onClick={() => { if (validar()) onSubmit() }}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-green-700 active:bg-green-800 transition-colors"
      >
        ✓ Enviar registro
      </button>
      <BotonAnterior onClick={anterior} />
    </div>
  )
}
