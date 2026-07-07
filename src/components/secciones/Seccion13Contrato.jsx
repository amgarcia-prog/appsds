import { useState } from 'react'
import BotonAnterior from '../ui/BotonAnterior'
import { sha256 } from '../../utils/hash'

const TEXTO_CONTRATO = `CONTRATO DE VOLUNTARIADO
DONUM CHRISTI COMUNIDAD APOSTÓLICA
SERVIDORES DEL SERVIDOR — HIJOS DI PADRE PÍO

Entre los suscritos: De una parte, la asociación DONUM CHRISTI COMUNIDAD APOSTÓLICA SERVIDORES DEL SERVIDOR HIJOS DI PADRE PÍO, sin ánimo de lucro, con domicilio principal en Bogotá D.C., Colombia, NIT 900.049.867-5, representada legalmente por JOSÉ LEONARDO ESPITIA TOLEDO, C.C. No. 1.098.699.844 de Bucaramanga, que en adelante se denominará SERVIDORES DEL SERVIDOR; y de la otra parte, {NOMBRE}, mayor de edad, identificado(a) con {TIPO_ID} número {NUMERO_ID}, con domicilio en {CIUDAD}, {PAIS}, que en adelante se denominará EL/LA VOLUNTARIO(A).
El presente contrato se suscribe en el marco de la Ley 720 de 2001 (Ley del Voluntariado de Colombia) y su Decreto Reglamentario 2019 de 2006. Para voluntarios residentes fuera de Colombia, las normas del país de residencia aplicarán de manera complementaria, sin desplazar el régimen colombiano como marco principal de esta relación.

PRIMERO — NATURALEZA DEL VÍNCULO
El presente contrato establece un vínculo de voluntariado de naturaleza solidaria y gratuita. La vinculación de EL/LA VOLUNTARIO(A) a SERVIDORES DEL SERVIDOR no genera relación laboral, contractual remunerada ni obligación económica de ningún tipo entre las partes. Las partes declaran expresamente que no concurren los elementos constitutivos de una relación laboral, a saber: (i) no existe subordinación continuada ni dependencia jerárquica en la ejecución de las actividades; (ii) no existe remuneración ni contraprestación económica; (iii) la prestación del servicio es libre, espontánea y altruista. Esta declaración tiene plena validez en los términos del artículo 3.° de la Ley 720 de 2001.

SEGUNDO — AUSENCIA DE SUBORDINACIÓN Y AUTONOMÍA
EL/LA VOLUNTARIO(A) ejerce sus actividades con plena autonomía en cuanto a la forma, el modo y el tiempo de ejecución. No existe horario fijo ni obligatorio, ni vínculo de dependencia permanente frente a SERVIDORES DEL SERVIDOR. Los lineamientos generales impartidos por la Asociación tienen carácter orientador y misional, no de órdenes laborales de ejecución. EL/LA VOLUNTARIO(A) podrá suspender temporalmente o retirarse definitivamente de sus actividades en cualquier momento, con la simple comunicación a la Asociación, sin que ello genere consecuencia alguna de carácter laboral o patrimonial.

TERCERO — OBJETO
EL/LA VOLUNTARIO(A) se compromete a prestar sus servicios de manera libre, voluntaria y gratuita en el desarrollo de las actividades misionales de SERVIDORES DEL SERVIDOR, que incluyen: atención a personas en situación de vulnerabilidad, servicio en comedores, patios y puntos de servicio en calle, actividades de formación, evangelización y misiones, así como cualquier otra actividad afín al objeto social de la Asociación. Para voluntarios residentes en el exterior, el objeto podrá ejecutarse en el país de residencia, conforme a los lineamientos generales de la Asociación y respetando la legislación local aplicable.

CUARTO — GRATUIDAD Y AUSENCIA DE RETRIBUCIÓN
EL/LA VOLUNTARIO(A) declara expresamente que todos los servicios prestados son completamente gratuitos, sin esperar ni recibir retribución económica, compensación, indemnización, salario, honorarios ni contraprestación alguna por parte de SERVIDORES DEL SERVIDOR. Esta gratuidad es elemento esencial y constitutivo del presente contrato; su ausencia desnaturalizaría el vínculo de voluntariado.

QUINTO — COMPROMISOS DEL/LA VOLUNTARIO(A)
EL/LA VOLUNTARIO(A) se compromete a: (i) actuar conforme a los principios, valores y reglamentos internos de la Asociación; (ii) cumplir el Código de Conducta y el Manual del Buen Trato; (iii) orientar su servicio conforme a los lineamientos generales de SERVIDORES DEL SERVIDOR, manteniendo autonomía en la ejecución de las actividades; (iv) guardar confidencialidad sobre información sensible de beneficiarios y miembros; (v) representar dignamente a SERVIDORES DEL SERVIDOR; (vi) informar a la Asociación sobre cualquier circunstancia que le impida continuar prestando el servicio voluntario.

SEXTO — COMPROMISOS DE SERVIDORES DEL SERVIDOR
SERVIDORES DEL SERVIDOR se compromete a: (i) proveer orientación, formación y acompañamiento necesarios para el desarrollo de las actividades; (ii) tratar al/la voluntario(a) con respeto y dignidad en todo momento; (iii) informar al/la voluntario(a) sobre los riesgos inherentes a las actividades a desarrollar, especialmente en contextos de servicio en calle y atención a población vulnerable; (iv) gestionar, en la medida de sus posibilidades y conforme al artículo 10 de la Ley 720 de 2001, mecanismos de cobertura frente a riesgos derivados de la actividad voluntaria, o en su defecto, informar expresamente al/la voluntario(a) sobre la ausencia de dicha cobertura para que pueda tomar las precauciones que considere pertinentes.

SÉPTIMO — RIESGOS INHERENTES A LA ACTIVIDAD
EL/LA VOLUNTARIO(A) declara conocer y aceptar los riesgos propios e inherentes a las actividades de voluntariado en las que participa, en particular aquellas desarrolladas en espacios públicos, puntos de servicio en calle y entornos de atención a población en situación de vulnerabilidad. Esta aceptación se hace de manera informada, libre y voluntaria. SERVIDORES DEL SERVIDOR adoptará los protocolos de seguridad que estén a su alcance para minimizar dichos riesgos.

OCTAVO — DECLARACIÓN DE LIBRE Y ESPONTÁNEA VOLUNTAD
EL/LA VOLUNTARIO(A) declara que su vinculación a SERVIDORES DEL SERVIDOR es completamente libre, espontánea y sin coacción de ningún tipo; que ha leído, comprendido y aceptado el contenido íntegro del presente contrato; que conoce la naturaleza no laboral y gratuita de la relación; y que no ha sido inducido(a) a error sobre las condiciones de su participación. Esta declaración constituye elemento probatorio fundamental de la naturaleza del vínculo.

NOVENO — DURACIÓN Y TERMINACIÓN
El presente contrato es de duración indefinida y podrá terminarse por: (i) decisión libre y unilateral del/la voluntario(a), en cualquier momento y sin necesidad de expresar causa; (ii) decisión de SERVIDORES DEL SERVIDOR ante incumplimiento grave de los compromisos pactados; (iii) mutuo acuerdo de las partes. La terminación del contrato, por cualquier causa, no generará derecho a indemnización, liquidación, prestación social ni reconocimiento económico de ningún tipo.

DÉCIMO — ACEPTACIÓN DIGITAL Y CONSERVACIÓN DE REGISTROS
El presente contrato podrá suscribirse de forma digital. La aceptación electrónica, junto con el registro de nombre completo, número de identificación, fecha, hora y dirección IP, tiene plena validez probatoria equivalente a la firma manuscrita, de conformidad con la Ley 527 de 1999 sobre comercio electrónico en Colombia y sus equivalentes en el país de residencia del/la voluntario(a). SERVIDORES DEL SERVIDOR conservará el registro completo de aceptación digital por un período mínimo de cinco (5) años contados desde la fecha de suscripción o desde la terminación del vínculo, lo que ocurra después.

DÉCIMO PRIMERO — LEY APLICABLE Y JURISDICCIÓN
El presente contrato se rige principalmente por la legislación colombiana vigente en materia de voluntariado, en particular la Ley 720 de 2001 y el Decreto 2019 de 2006. Para los voluntarios residentes fuera de Colombia, las normas del país de residencia aplicarán de manera complementaria en lo que no contraríe el marco colombiano. Cualquier controversia derivada del presente contrato se resolverá preferiblemente mediante diálogo y conciliación entre las partes.

Aprobado en junta el Julio 7 de 2026

JOSÉ LEONARDO ESPITIA TOLEDO
Representante Legal — SERVIDORES DEL SERVIDOR
C.C. 1.098.699.844 — NIT 900.049.867-5`

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
                versionContrato: 'v2.0-2026',
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
