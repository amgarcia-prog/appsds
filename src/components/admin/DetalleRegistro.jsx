import { useState, useEffect } from 'react'
import SelectorCiudad from '../ui/SelectorCiudad'
import API_URL from '../../config.js'

const TIPOS_IDENTIFICACION = [
  'Tarjeta de identidad',
  'Cédula de ciudadanía (Colombia)',
  'Cédula de extranjería',
  'Documento de identidad',
  'DNI',
  'NIE',
  'Pasaporte',
  'Otro',
]
const ESTADOS_CIVILES = [
  'Casado por la iglesia', 'Casado por lo civil', 'Casado por ambas',
  'Divorciado', 'Separado', 'Soltero', 'Unión libre', 'Viudo'
]
const TIPOS_SANGRE = ['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-']
const NIVELES_ACADEMICOS = [
  'Enseñanza básica - Primaria', 'Enseñanza media - Secundaria - Bachillerato',
  'Técnico - Tecnólogo', 'Profesional universitario', 'Especialización',
  'Maestría', 'Doctorado', 'Post-Doctorado', 'Ninguna'
]
const OCUPACIONES = ['Ama de casa', 'Desempleado', 'Empleado', 'Empresario',
  'Estudiante', 'Independiente', 'Pensionado o jubilado']
const COMO_LLEGO = ['Redes sociales', 'Invitación Directa', 'Vi a los servidores y me acerqué', 'Otro']
const TIPOS_CONSAGRACION = ['laborioso', 'paciente', 'servita', 'pilar']
const RESPONSABILIDADES_CONSEJO = [
  'Financiero', 'Espiritualidad y eventos', 'Obras y servicios',
  'Comunicaciones', 'Misiones', 'Torreta', 'Formación y consagraciones',
  'Tecnología', 'Coordinador principal del consejo', 'Coordinador suplente del consejo'
]
const RESPONSABILIDADES_PILAR = [
  'Financiero', 'Espiritualidad y eventos', 'Obras y servicios',
  'Comunicaciones', 'Misiones', 'Torreta', 'Formación y consagraciones',
  'Tecnología', 'Organizacional', 'Servidor General', 'Servidor General Suplente'
]
const PAISES = ['Argentina','Bolivia','Chile','Colombia','Costa Rica','Ecuador','España','Estados Unidos','México','Paraguay','Perú','Uruguay','Venezuela']

const ESTADOS_PROCESO = [
  'pendiente_formacion',
  'laborioso_no_consagrar',
  'no_cumple_requisitos',
  'cumple_requisitos',
  'formacion_no_aprobada',
  'formacion_aprobada',
  'pendiente_aprobacion',
  'no_avalado_consejo',
  'aprobado_consagracion',
  'no_aprobado_junta',
  'consagrado_paciente',
  'consagrado_servita',
  'consagrado_pilar',
]
const ESTADOS_LABELS = {
  pendiente_formacion: 'Pendiente verificación de requisitos',
  laborioso_no_consagrar: 'Laborioso — no desea consagrarse',
  no_cumple_requisitos: 'No cumple requisitos',
  cumple_requisitos: 'Cumple requisitos para formación',
  formacion_no_aprobada: 'Formación no aprobada',
  formacion_aprobada: 'Formación aprobada',
  pendiente_aprobacion: 'Pendiente por aprobación de junta',
  no_avalado_consejo: 'No avalado por el consejo',
  aprobado_consagracion: 'Aprobado para consagración',
  no_aprobado_junta: 'No aprobado por la junta',
  consagrado_paciente: 'Consagrado como paciente',
  consagrado_servita: 'Consagrado como servita',
  consagrado_pilar: 'Consagrado como hermano pilar',
}

export default function DetalleRegistro({ registro, onVolver }) {
  const [datos, setDatos] = useState(registro)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [puntosDisponibles, setPuntosDisponibles] = useState([])

  useEffect(() => {
    const ciudad = datos.ciudad_donde_sirve
    if (!ciudad) { setPuntosDisponibles([]); return }
    fetch(`${API_URL}/api/puntos-servicio?ciudad=${encodeURIComponent(ciudad)}`)
      .then(r => r.json())
      .then(data => setPuntosDisponibles(data.map(p => p.nombre)))
      .catch(() => setPuntosDisponibles([]))
  }, [datos.ciudad_donde_sirve])

  const actualizar = (campo, valor) => {
    if (campo === 'estado_proceso') {
      setDatos(prev => ({ ...prev, [campo]: valor, fecha_estado: new Date().toISOString() }))
    } else {
      setDatos(prev => ({ ...prev, [campo]: valor }))
    }
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/registros/${datos.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'SDS2026admin' },
        body: JSON.stringify(datos),
      })
      const result = await res.json()
      if (result.ok) setMensaje('✅ Cambios guardados correctamente')
      else setMensaje('❌ Error al guardar')
    } catch {
      setMensaje('❌ Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 3000)
  }

  const eliminar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/registros/${datos.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'SDS2026admin' },
      })
      const result = await res.json()
      if (result.ok) onVolver()
    } catch {
      setMensaje('❌ Error al eliminar')
    }
  }

  const Campo = ({ label, campo, tipo = 'text' }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {tipo === 'textarea' ? (
        <textarea value={datos[campo] || ''} onChange={e => actualizar(campo, e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
      ) : (
        <input type={tipo} value={datos[campo] || ''} onChange={e => actualizar(campo, e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
      )}
    </div>
  )

  const Selector = ({ label, campo, opciones, capitalize = false }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={datos[campo] || ''} onChange={e => actualizar(campo, e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="">Selecciona...</option>
        {opciones.map(o => (
          <option key={o} value={o}>{capitalize ? o.charAt(0).toUpperCase() + o.slice(1) : o}</option>
        ))}
      </select>
    </div>
  )

  const Checkboxes = ({ label, campo, opciones }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-1">
        {opciones.map(r => (
          <label key={r} className="flex items-center gap-2 text-xs cursor-pointer py-1">
            <input type="checkbox"
              checked={(datos[campo] || []).includes(r)}
              onChange={() => {
                const actual = datos[campo] || []
                actualizar(campo, actual.includes(r) ? actual.filter(x => x !== r) : [...actual, r])
              }}
              className="w-3.5 h-3.5 text-blue-600" />
            {r}
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-800 text-white py-3 px-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={onVolver} className="flex items-center gap-2 text-sm hover:text-blue-200">
            ← Volver al panel
          </button>
          <h1 className="text-base font-bold">
            {datos.primer_nombre} {datos.primer_apellido}
          </h1>
          <div className="flex gap-2">
            <button onClick={guardar} disabled={guardando}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <p className="text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Estado del proceso */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Estado del proceso</h2>
          <div className="flex gap-3 flex-wrap">
            {ESTADOS_PROCESO.map(e => (
              <label key={e} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm
                ${datos.estado_proceso === e ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium' : 'border-gray-200'}`}>
                <input type="radio" name="estado_proceso" value={e}
                  checked={datos.estado_proceso === e}
                  onChange={() => actualizar('estado_proceso', e)}
                  className="hidden" />
                {ESTADOS_LABELS[e]}
              </label>
            ))}
          </div>
          {datos.fecha_estado && (
            <p className="text-xs text-gray-400 mt-2">
              Último cambio: {new Date(datos.fecha_estado).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Datos personales */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Datos personales</h2>
          <div className="grid grid-cols-2 gap-x-4">
            <Campo label="Primer nombre" campo="primer_nombre" />
            <Campo label="Segundo nombre" campo="segundo_nombre" />
            <Campo label="Primer apellido" campo="primer_apellido" />
            <Campo label="Segundo apellido" campo="segundo_apellido" />
            <Selector label="Tipo de identificación" campo="tipo_identificacion" opciones={TIPOS_IDENTIFICACION} />
            <Campo label="Número de identificación" campo="numero_identificacion" />
            <Campo label="Fecha de nacimiento" campo="fecha_nacimiento" tipo="date" />
            <Selector label="Sexo" campo="sexo" opciones={['Femenino', 'Masculino']} />
            <Selector label="Estado civil" campo="estado_civil" opciones={ESTADOS_CIVILES} />
            <Campo label="Fecha de fallecimiento" campo="fecha_fallecimiento" tipo="date" />
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Contacto</h2>
          <div className="grid grid-cols-2 gap-x-4">
            <Campo label="Teléfono móvil" campo="telefono_movil" />
            <Campo label="Correo electrónico" campo="correo_electronico" tipo="email" />
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">País de residencia</label>
              <select value={datos.pais_residencia || ''} onChange={e => { actualizar('pais_residencia', e.target.value); actualizar('departamento_servicio', ''); actualizar('ciudad_servicio', '') }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Selecciona...</option>
                {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <Campo label="Dirección" campo="direccion_residencia" />
          </div>
          {datos.pais_residencia && (
            <div className="mb-3 [&_label]:text-xs [&_label]:font-medium [&_label]:text-gray-500 [&_select]:border [&_select]:border-gray-300 [&_select]:rounded [&_select]:px-2 [&_select]:py-1.5 [&_select]:text-sm [&_input]:border [&_input]:border-gray-300 [&_input]:rounded [&_input]:px-2 [&_input]:py-1.5 [&_input]:text-sm">
              <SelectorCiudad
                pais={datos.pais_residencia}
                departamento={datos.departamento_servicio || ''}
                ciudad={datos.ciudad_servicio || ''}
                onChangeDepartamento={v => { actualizar('departamento_servicio', v); actualizar('ciudad_servicio', '') }}
                onChangeCiudad={v => actualizar('ciudad_servicio', v)}
              />
            </div>
          )}
        </div>

        {/* Académica y laboral */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Información académica y laboral</h2>
          <div className="grid grid-cols-2 gap-x-4">
            <Selector label="Nivel académico" campo="nivel_academico" opciones={NIVELES_ACADEMICOS} />
            <Campo label="Profesión" campo="profesion" />
            <Selector label="Ocupación" campo="ocupacion" opciones={OCUPACIONES} />
          </div>
        </div>

        {/* Médica */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Información médica</h2>
          <div className="grid grid-cols-2 gap-x-4">
            <Selector label="Tipo de sangre" campo="tipo_sangre" opciones={TIPOS_SANGRE} />
            <Campo label="EPS o sistema de salud" campo="eps_servicio" />
          </div>
          <Campo label="Indicaciones médicas" campo="indicaciones_medicas" tipo="textarea" />
        </div>

        {/* Comunitaria */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Información comunitaria</h2>

          <div className="grid grid-cols-2 gap-x-4">
            <Selector label="Tipo de servidor" campo="estado_consagracion" opciones={TIPOS_CONSAGRACION} capitalize />
            <Selector label="Cómo llegó a la comunidad" campo="como_llego_comunidad" opciones={COMO_LLEGO} />

            {/* País donde sirve */}
            <div className="col-span-2 mb-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">País donde sirve</label>
              <select value={datos.pais_servicio || ''} onChange={e => { actualizar('pais_servicio', e.target.value); actualizar('departamento_ciudad_servicio', ''); actualizar('ciudad_donde_sirve', '') }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Selecciona...</option>
                {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {datos.pais_servicio && (
              <div className="col-span-2 mb-1 [&_label]:text-xs [&_label]:font-medium [&_label]:text-gray-500 [&_select]:border [&_select]:border-gray-300 [&_select]:rounded [&_select]:px-2 [&_select]:py-1.5 [&_select]:text-sm [&_input]:border [&_input]:border-gray-300 [&_input]:rounded [&_input]:px-2 [&_input]:py-1.5 [&_input]:text-sm">
                <SelectorCiudad
                  pais={datos.pais_servicio}
                  departamento={datos.departamento_ciudad_servicio || ''}
                  ciudad={datos.ciudad_donde_sirve || ''}
                  onChangeDepartamento={v => { actualizar('departamento_ciudad_servicio', v); actualizar('ciudad_donde_sirve', '') }}
                  onChangeCiudad={v => actualizar('ciudad_donde_sirve', v)}
                />
              </div>
            )}

            <Campo label="Fecha inicio servicio" campo="fecha_inicio_servicio" tipo="date" />
            <Campo label="Fecha consagración como paciente" campo="fecha_consagracion_paciente" tipo="date" />
            <Campo label="Fecha consagración como servita" campo="fecha_consagracion_servita" tipo="date" />
            <Campo label="Fecha inicio encargo (pilar)" campo="fecha_inicio_encargo" tipo="date" />

            <Selector label="¿Es coordinador de punto de servicio?" campo="es_coordinador" opciones={['Sí', 'No']} />

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">¿Pertenece al consejo?</label>
              <select value={datos.pertenece_consejo || ''} onChange={e => actualizar('pertenece_consejo', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Selecciona...</option>
                <option value="Si pertenezco">Sí pertenece</option>
                <option value="No pertenezco">No pertenece</option>
              </select>
            </div>

            <Campo label="Fecha inicio en el consejo" campo="fecha_inicio_consejo" tipo="date" />
          </div>

          {/* Puntos de servicio */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Puntos de servicio donde participa
              {puntosDisponibles.length === 0 && datos.ciudad_donde_sirve && (
                <span className="ml-2 text-gray-400 font-normal">(no hay puntos registrados para {datos.ciudad_donde_sirve})</span>
              )}
            </label>
            {puntosDisponibles.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 border border-gray-200 rounded p-3 bg-gray-50">
                {puntosDisponibles.map(p => (
                  <label key={p} className="flex items-center gap-2 text-xs cursor-pointer py-1">
                    <input type="checkbox"
                      checked={(datos.puntos_servicio || []).includes(p)}
                      onChange={() => {
                        const actual = datos.puntos_servicio || []
                        const nuevo = actual.includes(p) ? actual.filter(x => x !== p) : [...actual, p]
                        actualizar('puntos_servicio', nuevo)
                        // Si se desmarca un punto, también quitarlo de puntos_coordina
                        if (actual.includes(p)) {
                          const coordina = datos.puntos_coordina || []
                          actualizar('puntos_coordina', coordina.filter(x => x !== p))
                        }
                      }}
                      className="w-3.5 h-3.5 text-blue-600" />
                    {p}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                {datos.ciudad_donde_sirve ? 'Sin puntos disponibles para esta ciudad.' : 'Selecciona primero la ciudad donde sirve.'}
              </p>
            )}
          </div>

          {/* Puntos que coordina — solo los que ya están seleccionados en puntos_servicio */}
          {(datos.puntos_servicio || []).length > 0 && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-2">Puntos que coordina</label>
              <div className="grid grid-cols-2 gap-1 border border-gray-200 rounded p-3 bg-gray-50">
                {(datos.puntos_servicio || []).map(p => (
                  <label key={p} className="flex items-center gap-2 text-xs cursor-pointer py-1">
                    <input type="checkbox"
                      checked={(datos.puntos_coordina || []).includes(p)}
                      onChange={() => {
                        const actual = datos.puntos_coordina || []
                        actualizar('puntos_coordina', actual.includes(p) ? actual.filter(x => x !== p) : [...actual, p])
                      }}
                      className="w-3.5 h-3.5 text-blue-600" />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          )}

          <Checkboxes label="Responsabilidades en el consejo" campo="responsabilidades_consejo" opciones={RESPONSABILIDADES_CONSEJO} />
          <Checkboxes label="Responsabilidades como Hermano Pilar" campo="responsabilidades_pilar" opciones={RESPONSABILIDADES_PILAR} />

          <Campo label="Motivación consagración como paciente" campo="motivacion_paciente" tipo="textarea" />
          <Campo label="Motivación consagración como servita" campo="motivacion_servita" tipo="textarea" />
        </div>

        {/* Historial del proceso */}
        {(datos.historial_proceso || []).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-bold text-blue-800 mb-3">Historial del proceso</h2>
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {[...(datos.historial_proceso || [])].reverse().map((h, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow mt-0.5 shrink-0 z-10" />
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="text-xs font-medium text-gray-800">
                          <span className="text-gray-400">{ESTADOS_LABELS[h.estado_anterior] || h.estado_anterior}</span>
                          {' → '}
                          <span className="text-blue-700">{ESTADOS_LABELS[h.estado_nuevo] || h.estado_nuevo}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(h.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Por: <span className="font-medium">{h.cambiado_por}</span></p>
                      {h.notas && <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-2 italic">"{h.notas}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Acceso al sistema */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-blue-800 mb-3">Acceso al sistema</h2>
          <p className="text-xs text-gray-500 mb-3">Asigna una clave para que este miembro pueda ingresar al sistema con su número de identificación.</p>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Clave de acceso</label>
            <input type="text" value={datos.clave || ''}
              onChange={e => actualizar('clave', e.target.value)}
              placeholder="Asigna una clave..."
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          {datos.clave && (
            <p className="text-xs text-green-600 mt-2">✓ Este miembro tiene clave asignada. Guarda los cambios para actualizar.</p>
          )}
        </div>

        {/* Eliminar */}
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <h2 className="font-bold text-red-700 mb-2">Zona de peligro</h2>
          {!confirmEliminar ? (
            <button onClick={() => setConfirmEliminar(true)}
              className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded hover:bg-red-50">
              Eliminar este registro
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-700">¿Segura que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
              <button onClick={eliminar} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                Sí, eliminar
              </button>
              <button onClick={() => setConfirmEliminar(false)} className="text-sm text-gray-500 hover:underline">
                Cancelar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
