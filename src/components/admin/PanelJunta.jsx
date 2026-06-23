import { useState, useEffect } from 'react'
import API_URL from '../../config.js'

export default function PanelJunta() {
  const [aspirantes, setAspirantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [notas, setNotas] = useState('')
  const [fechaJunta, setFechaJunta] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/junta/pendientes`, {
        headers: { 'x-admin-key': 'SDS2026admin' }
      })
      const data = await res.json()
      setAspirantes(data)
    } catch { }
    setCargando(false)
  }

  const calcularEdad = (fecha) => {
    if (!fecha) return '—'
    const hoy = new Date()
    const nac = new Date(fecha + 'T12:00:00')
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  const calcularMeses = (fecha) => {
    if (!fecha) return null
    const hoy = new Date()
    const inicio = new Date(fecha + 'T12:00:00')
    return (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth())
  }

  const tomarDecision = async (id, decision) => {
    if (!fechaJunta) { setMensaje('❌ La fecha de reunión de la junta es obligatoria'); setTimeout(() => setMensaje(''), 3000); return }
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/junta/decision/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'SDS2026admin' },
        body: JSON.stringify({ decision, notas: notas.trim(), fecha_junta: fechaJunta }),
      })
      const data = await res.json()
      if (data.ok) {
        setMensaje(decision === 'aprobado_consagracion' ? '✅ Aprobado para consagración' : '✅ No aprobado por la junta')
        setSeleccionado(null)
        setNotas('')
        setFechaJunta('')
        cargar()
      } else {
        setMensaje('❌ Error al guardar la decisión')
      }
    } catch {
      setMensaje('❌ Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 4000)
  }

  // Agrupar por ciudad
  const porCiudad = aspirantes.reduce((acc, a) => {
    const ciudad = a.ciudad_donde_sirve || 'Sin ciudad'
    if (!acc[ciudad]) acc[ciudad] = []
    acc[ciudad].push(a)
    return acc
  }, {})

  if (cargando) return <div className="text-center py-16 text-gray-400">Cargando...</div>

  // Vista detalle
  if (seleccionado) {
    const edad = calcularEdad(seleccionado.fecha_nacimiento)
    const meses = calcularMeses(seleccionado.fecha_inicio_servicio)
    const nombre = [seleccionado.primer_nombre, seleccionado.segundo_nombre, seleccionado.primer_apellido, seleccionado.segundo_apellido].filter(Boolean).join(' ')
    const avaladoConsejo = seleccionado.estado_proceso === 'pendiente_aprobacion'

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button onClick={() => { setSeleccionado(null); setNotas('') }} className="text-sm text-blue-600 hover:underline">
          ← Volver a la lista
        </button>

        {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</p>}

        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-4">
            {seleccionado.foto_url ? (
              <img src={seleccionado.foto_url} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl text-gray-400">👤</span>
              </div>
            )}
            <div>
              <h2 className="font-bold text-blue-800 text-xl">{nombre}</h2>
              <p className="text-sm text-gray-500">{seleccionado.numero_identificacion} · {seleccionado.ciudad_donde_sirve}{seleccionado.pais_servicio ? `, ${seleccionado.pais_servicio}` : ''}</p>
            </div>
          </div>

          {/* Requisitos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Verificación de requisitos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${typeof edad === 'number' && edad < 18 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className="text-xs text-gray-500">Edad</p>
                <p className="font-bold text-sm">{edad} años</p>
                <p className={`text-xs mt-1 ${typeof edad === 'number' && edad < 18 ? 'text-red-600' : 'text-green-600'}`}>
                  {typeof edad === 'number' && edad < 18 ? '✗ Menor de edad' : '✓ Mayor de edad'}
                </p>
              </div>
              <div className={`p-3 rounded-lg border ${meses !== null && meses < 6 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className="text-xs text-gray-500">Tiempo de servicio</p>
                <p className="font-bold text-sm">{meses !== null ? `${meses} meses` : '—'}</p>
                <p className={`text-xs mt-1 ${meses === null ? 'text-gray-500' : meses < 6 ? 'text-red-600' : 'text-green-600'}`}>
                  {meses === null ? 'Sin fecha' : meses < 6 ? '✗ Menos de 6 meses' : '✓ 6 meses o más'}
                </p>
              </div>
            </div>
          </div>

          {/* Motivación */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Por qué desea consagrarse?</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed">{seleccionado.por_que_consagrarse || '—'}</p>
            </div>
          </div>

          {/* Historial de formación */}
          {(seleccionado.historial_formacion || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Historial de formación</p>
              <div className="space-y-2">
                {(seleccionado.historial_formacion || []).map((h, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-sm ${h.resultado === 'Aprobada' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{new Date(h.fecha).toLocaleDateString('es-CO')}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.resultado === 'Aprobada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {h.resultado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{h.concepto}</p>
                    {h.responsable && <p className="text-xs text-gray-400 mt-1">Por: {h.responsable}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concepto del consejo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Concepto del consejo</p>
            <div className={`p-4 rounded-lg border ${avaladoConsejo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold ${avaladoConsejo ? 'text-green-700' : 'text-red-700'}`}>
                  {avaladoConsejo ? '✓ Avalado por el consejo' : '✗ No avalado por el consejo'}
                </span>
                {seleccionado.fecha_reunion_consejo && (
                  <span className="text-xs text-gray-400 ml-auto">
                    Reunión: {new Date(seleccionado.fecha_reunion_consejo + 'T12:00:00').toLocaleDateString('es-CO')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{seleccionado.concepto_consejo || '—'}</p>
            </div>
          </div>

          {/* Decisión de la junta */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Decisión de la junta</p>
            <label className="block text-xs font-medium text-gray-600 mb-2">Fecha de reunión de la junta <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={fechaJunta}
              onChange={e => setFechaJunta(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <label className="block text-xs font-medium text-gray-600 mb-2">Notas u observaciones (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Observaciones de la junta sobre este aspirante..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => tomarDecision(seleccionado.id, 'aprobado_consagracion')}
                disabled={guardando}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                ✓ Aprobado para consagración
              </button>
              <button
                onClick={() => tomarDecision(seleccionado.id, 'no_aprobado_junta')}
                disabled={guardando}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                ✗ No aprobado
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista lista agrupada por ciudad
  if (Object.keys(porCiudad).length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-sm">No hay aspirantes pendientes por aprobación de junta.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {mensaje && <div className="text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>}

      {Object.entries(porCiudad).map(([ciudad, lista]) => (
        <div key={ciudad} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-blue-800">{ciudad}</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{lista.length} aspirante{lista.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {lista.map(a => {
              const nombre = [a.primer_nombre, a.primer_apellido].filter(Boolean).join(' ')
              const edad = calcularEdad(a.fecha_nacimiento)
              const meses = calcularMeses(a.fecha_inicio_servicio)
              const avalado = a.estado_proceso === 'pendiente_aprobacion'
              return (
                <div key={a.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{nombre}</p>
                    <p className="text-xs text-gray-400">{a.numero_identificacion}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{edad} años · {meses !== null ? `${meses} meses servicio` : 'sin fecha'}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${avalado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {avalado ? '✓ Avalado por consejo' : '✗ No avalado por consejo'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { setSeleccionado(a); setNotas(''); setFechaJunta('') }}
                    className="text-xs font-medium px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex-shrink-0">
                    Ver información
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
