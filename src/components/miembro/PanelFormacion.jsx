import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-servidores.jpg'
import API_URL from '../../config.js'

export default function PanelFormacion() {
  const [pendientes, setPendientes] = useState([])
  const [cumpleRequisitos, setCumpleRequisitos] = useState([])
  const [aprobadosFormacion, setAprobadosFormacion] = useState([])
  const [aprobadosConsagracion, setAprobadosConsagracion] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pestaña, setPestaña] = useState('pendientes')
  const [seleccionado, setSeleccionado] = useState(null)
  const [modo, setModo] = useState(null) // 'requisitos' | 'formacion' | 'consejo'
  const [concepto, setConcepto] = useState('')
  const [fechaReunion, setFechaReunion] = useState('')
  const [seleccionadosConsagracion, setSeleccionadosConsagracion] = useState([])
  const [fechaCeremonia, setFechaCeremonia] = useState('')
  const [actaUrl, setActaUrl] = useState('')
  const [subiendoActa, setSubiendoActa] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const sesion = JSON.parse(localStorage.getItem('miembro_sesion') || '{}')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`${API_URL}/api/formacion/pendientes?ciudad=${encodeURIComponent(sesion.ciudad)}`).then(r => r.json()),
        fetch(`${API_URL}/api/formacion/cumple-requisitos?ciudad=${encodeURIComponent(sesion.ciudad)}`).then(r => r.json()),
        fetch(`${API_URL}/api/formacion/aprobados-formacion?ciudad=${encodeURIComponent(sesion.ciudad)}`).then(r => r.json()),
        fetch(`${API_URL}/api/formacion/aprobados-consagracion?ciudad=${encodeURIComponent(sesion.ciudad)}`).then(r => r.json()),
      ])
      setPendientes(r1)
      setCumpleRequisitos(r2)
      setAprobadosFormacion(r3)
      setAprobadosConsagracion(r4)
    } catch { }
    setCargando(false)
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '—'
    const hoy = new Date()
    const nac = new Date(fechaNacimiento + 'T12:00:00')
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  const calcularMeses = (fechaInicio) => {
    if (!fechaInicio) return null
    const hoy = new Date()
    const inicio = new Date(fechaInicio + 'T12:00:00')
    return (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth())
  }

  const cambiarEstado = async (id, estado, conceptoFormacion) => {
    setGuardando(true)
    try {
      const body = { estado }
      if (conceptoFormacion !== undefined) body.concepto_formacion = conceptoFormacion
      const res = await fetch(`${API_URL}/api/formacion/estado/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-miembro-id': sesion.id },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.ok) {
        const labels = {
          cumple_requisitos: '✅ Marcado como cumple requisitos',
          no_cumple_requisitos: '✅ Marcado como no cumple requisitos',
          formacion_aprobada: '✅ Formación aprobada — pasa al consejo',
          formacion_no_aprobada: '✅ Formación no aprobada — puede repetirla',
        }
        setMensaje(labels[estado] || '✅ Actualizado')
        setSeleccionado(null)
        setConcepto('')
        cargar()
      } else {
        setMensaje('❌ Error al actualizar')
      }
    } catch {
      setMensaje('❌ Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 3000)
  }

  const toggleSeleccionConsagracion = (id) => {
    setSeleccionadosConsagracion(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const subirActa = async (archivo) => {
    if (!archivo) return
    setSubiendoActa(true)
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      formData.append('bucket', 'actas-consagracion')
      formData.append('carpeta', sesion.ciudad || 'general')
      const res = await fetch(`${API_URL}/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) setActaUrl(data.url)
    } catch (e) { console.error(e) }
    setSubiendoActa(false)
  }

  const registrarConsagracion = async () => {
    if (!seleccionadosConsagracion.length) { setMensaje('❌ Selecciona al menos un aspirante'); setTimeout(() => setMensaje(''), 3000); return }
    if (!fechaCeremonia) { setMensaje('❌ La fecha de la ceremonia es obligatoria'); setTimeout(() => setMensaje(''), 3000); return }
    if (!actaUrl) { setMensaje('❌ El acta firmada de consagración es obligatoria'); setTimeout(() => setMensaje(''), 3000); return }
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/formacion/consagrar-pacientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-miembro-id': sesion.id },
        body: JSON.stringify({ ids: seleccionadosConsagracion, fecha_consagracion: fechaCeremonia, acta_url: actaUrl }),
      })
      const data = await res.json()
      if (data.ok) {
        setMensaje(`✅ ${seleccionadosConsagracion.length} hermano${seleccionadosConsagracion.length !== 1 ? 's' : ''} consagrado${seleccionadosConsagracion.length !== 1 ? 's' : ''} correctamente`)
        setSeleccionadosConsagracion([])
        setFechaCeremonia('')
        setActaUrl('')
        cargar()
      } else {
        setMensaje('❌ Error al registrar consagración')
      }
    } catch {
      setMensaje('❌ Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 5000)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('miembro_sesion')
    navigate('/login')
  }

  const cambiarConsejoEstado = async (id, avala) => {
    if (!concepto.trim()) { setMensaje('❌ El concepto del consejo es obligatorio'); setTimeout(() => setMensaje(''), 3000); return }
    if (!fechaReunion) { setMensaje('❌ La fecha de reunión es obligatoria'); setTimeout(() => setMensaje(''), 3000); return }
    setGuardando(true)
    try {
      const res = await fetch(`${API_URL}/api/formacion/concepto-consejo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-miembro-id': sesion.id },
        body: JSON.stringify({ concepto_consejo: concepto.trim(), fecha_reunion_consejo: fechaReunion, avala }),
      })
      const data = await res.json()
      if (data.ok) {
        setMensaje(avala ? '✅ Aspirante avalado — pasa a pendiente de aprobación' : '✅ No avalado por el consejo')
        setSeleccionado(null)
        setConcepto('')
        setFechaReunion('')
        cargar()
      } else {
        setMensaje('❌ Error al guardar')
      }
    } catch {
      setMensaje('❌ Error de conexión')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 4000)
  }

  const abrirDetalle = (r, modoVista) => {
    setSeleccionado(r)
    setModo(modoVista)
    setConcepto(modoVista === 'consejo' ? (r.concepto_consejo || '') : (r.concepto_formacion || ''))
    setFechaReunion(r.fecha_reunion_consejo || '')
  }

  // Vista detalle
  if (seleccionado) {
    const edad = calcularEdad(seleccionado.fecha_nacimiento)
    const meses = calcularMeses(seleccionado.fecha_inicio_servicio)
    const esMenorEdad = typeof edad === 'number' && edad < 18
    const pocosM = meses !== null && meses < 6
    const nombre = [seleccionado.primer_nombre, seleccionado.segundo_nombre, seleccionado.primer_apellido, seleccionado.segundo_apellido].filter(Boolean).join(' ')

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-800 text-white py-3 px-4 shadow-md sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={() => { setSeleccionado(null); setConcepto('') }} className="text-sm hover:text-blue-200">
              ← Volver
            </button>
            <h1 className="text-base font-bold">
              {modo === 'formacion' ? 'Registro de formación' : modo === 'consejo' ? 'Concepto del consejo' : 'Revisión de requisitos'}
            </h1>
            <span className="text-xs text-blue-200">{sesion.nombre}</span>
          </div>
        </div>

        {mensaje && (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            <p className="text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</p>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-bold text-blue-800 text-lg mb-4">{nombre}</h2>

            {/* Edad */}
            <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${esMenorEdad ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div>
                <p className="text-xs font-medium text-gray-600">Edad</p>
                <p className="text-sm font-bold">{edad} años</p>
                <p className="text-xs text-gray-500">Nacimiento: {seleccionado.fecha_nacimiento ? new Date(seleccionado.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-CO') : '—'}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${esMenorEdad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {esMenorEdad ? '✗ Menor de edad' : '✓ Mayor de edad'}
              </span>
            </div>

            {/* Tiempo de servicio */}
            <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${pocosM ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div>
                <p className="text-xs font-medium text-gray-600">Tiempo de servicio</p>
                <p className="text-sm font-bold">{meses !== null ? `${meses} meses` : '—'}</p>
                <p className="text-xs text-gray-500">Inicio: {seleccionado.fecha_inicio_servicio ? new Date(seleccionado.fecha_inicio_servicio + 'T12:00:00').toLocaleDateString('es-CO') : '—'}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${meses === null ? 'bg-gray-100 text-gray-500' : pocosM ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {meses === null ? 'Sin fecha' : pocosM ? '✗ Menos de 6 meses' : '✓ 6 meses o más'}
              </span>
            </div>

            {/* Motivación */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">¿Por qué desea consagrarse?</p>
              <p className="text-sm text-gray-700 leading-relaxed">{seleccionado.por_que_consagrarse || '—'}</p>
            </div>

            {(esMenorEdad || pocosM) && modo === 'requisitos' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800 font-medium">⚠️ Este aspirante no cumple todos los requisitos mínimos.</p>
              </div>
            )}

            {/* Modo: revisión de requisitos */}
            {modo === 'requisitos' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => cambiarEstado(seleccionado.id, 'cumple_requisitos')}
                  disabled={guardando}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  ✓ Cumple requisitos
                </button>
                <button onClick={() => cambiarEstado(seleccionado.id, 'no_cumple_requisitos')}
                  disabled={guardando}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  ✗ No cumple requisitos
                </button>
              </div>
            )}

            {/* Modo: registro de formación */}
            {modo === 'formacion' && (
              <div className="pt-2">
                {(seleccionado.historial_formacion || []).length > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-800 mb-2">⚠️ Intentos anteriores de formación:</p>
                    {(seleccionado.historial_formacion || []).map((h, i) => (
                      <div key={i} className="mb-2 last:mb-0 text-xs border-t border-amber-100 pt-2 first:border-0 first:pt-0">
                        <p className="font-medium text-amber-900">{new Date(h.fecha).toLocaleDateString('es-CO')} — <span className={h.resultado === 'Aprobada' ? 'text-green-700' : 'text-red-700'}>{h.resultado}</span></p>
                        <p className="text-amber-800 mt-1">{h.concepto}</p>
                      </div>
                    ))}
                  </div>
                )}

                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Concepto del responsable de formación <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  rows={4}
                  placeholder="Escribe tu concepto sobre el aspirante durante la formación..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!concepto.trim()) { setMensaje('❌ El concepto es obligatorio'); setTimeout(() => setMensaje(''), 3000); return }
                      cambiarEstado(seleccionado.id, 'formacion_aprobada', concepto.trim())
                    }}
                    disabled={guardando}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    ✓ Formación aprobada
                  </button>
                  <button
                    onClick={() => {
                      if (!concepto.trim()) { setMensaje('❌ El concepto es obligatorio'); setTimeout(() => setMensaje(''), 3000); return }
                      cambiarEstado(seleccionado.id, 'formacion_no_aprobada', concepto.trim())
                    }}
                    disabled={guardando}
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    ✗ Formación no aprobada
                  </button>
                </div>
              </div>
            )}

            {/* Modo: concepto del consejo */}
            {modo === 'consejo' && (
              <div className="pt-2">
                {/* Concepto de formación emitido por el responsable */}
                {seleccionado.concepto_formacion && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-800 mb-1">Concepto del responsable de formación:</p>
                    <p className="text-sm text-blue-900 leading-relaxed">{seleccionado.concepto_formacion}</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Fecha de reunión del consejo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaReunion}
                    onChange={e => setFechaReunion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Concepto del consejo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  rows={4}
                  placeholder="Escribe el concepto del consejo sobre este aspirante..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => cambiarConsejoEstado(seleccionado.id, true)}
                    disabled={guardando}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    ✓ Avala
                  </button>
                  <button
                    onClick={() => cambiarConsejoEstado(seleccionado.id, false)}
                    disabled={guardando}
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    ✗ No avala
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vista lista
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-800 text-white py-3 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <h1 className="text-base font-bold">Responsable de Formación</h1>
              <p className="text-xs text-blue-200">{sesion.ciudad}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-blue-200">{sesion.nombre}</span>
            <div className="flex bg-blue-900 rounded-lg overflow-hidden">
              <button className="text-xs px-3 py-1.5 text-white font-medium bg-blue-600">Panel de formación</button>
              <button onClick={() => navigate('/mi-perfil')} className="text-xs px-3 py-1.5 text-blue-200 hover:text-white hover:bg-blue-700">Mi perfil</button>
            </div>
            <button onClick={cerrarSesion} className="text-xs text-blue-200 hover:text-white">Cerrar sesión</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {mensaje && <div className="mb-4 text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>}

        {/* Pestañas */}
        <div className="flex gap-1 mb-4 bg-gray-200 rounded-lg p-1 w-fit">
          <button onClick={() => setPestaña('pendientes')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pestaña === 'pendientes' ? 'bg-white text-blue-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
            Verificación de requisitos
            {pendientes.length > 0 && <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{pendientes.length}</span>}
          </button>
          <button onClick={() => setPestaña('formacion')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pestaña === 'formacion' ? 'bg-white text-blue-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
            Pendientes por formación
            {cumpleRequisitos.length > 0 && <span className="ml-2 bg-blue-400 text-white text-xs px-1.5 py-0.5 rounded-full">{cumpleRequisitos.length}</span>}
          </button>
          <button onClick={() => setPestaña('consejo')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pestaña === 'consejo' ? 'bg-white text-blue-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
            Pendiente Concepto Consejo
            {aprobadosFormacion.length > 0 && <span className="ml-2 bg-purple-400 text-white text-xs px-1.5 py-0.5 rounded-full">{aprobadosFormacion.length}</span>}
          </button>
          <button onClick={() => { setPestaña('consagracion'); setSeleccionadosConsagracion([]); setFechaCeremonia('') }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pestaña === 'consagracion' ? 'bg-white text-blue-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
            Pendiente Consagración
            {aprobadosConsagracion.length > 0 && <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{aprobadosConsagracion.length}</span>}
          </button>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <>
            {pestaña === 'pendientes' && (
              <TablaAspirantes
                registros={pendientes}
                ciudad={sesion.ciudad}
                calcularEdad={calcularEdad}
                calcularMeses={calcularMeses}
                onSeleccionar={r => abrirDetalle(r, 'requisitos')}
                textoVacio="No hay aspirantes pendientes por verificación de requisitos"
                textoBoton={r => {
                  const edad = calcularEdad(r.fecha_nacimiento)
                  const meses = calcularMeses(r.fecha_inicio_servicio)
                  const alerta = (typeof edad === 'number' && edad < 18) || (meses !== null && meses < 6)
                  return { texto: alerta ? '⚠️ Revisar' : 'Revisar', alerta }
                }}
              />
            )}
            {pestaña === 'formacion' && (
              <TablaAspirantes
                registros={cumpleRequisitos}
                ciudad={sesion.ciudad}
                calcularEdad={calcularEdad}
                calcularMeses={calcularMeses}
                onSeleccionar={r => abrirDetalle(r, 'formacion')}
                textoVacio="No hay aspirantes listos para formación"
                textoBoton={r => ({
                  texto: 'Registrar formación',
                  alerta: false,
                  repite: r.estado_proceso === 'formacion_no_aprobada',
                })}
              />
            )}
            {pestaña === 'consejo' && (
              <TablaAspirantes
                registros={aprobadosFormacion}
                ciudad={sesion.ciudad}
                calcularEdad={calcularEdad}
                calcularMeses={calcularMeses}
                onSeleccionar={r => abrirDetalle(r, 'consejo')}
                textoVacio="No hay aspirantes con formación aprobada pendientes de concepto del consejo"
                textoBoton={() => ({ texto: 'Dar concepto', alerta: false })}
              />
            )}
            {pestaña === 'consagracion' && (
              <div className="space-y-4">
                {aprobadosConsagracion.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <p className="text-gray-400 text-sm">No hay aspirantes pendientes de consagración en {sesion.ciudad}.</p>
                  </div>
                ) : (
                  <>
                    {/* Aprobados para consagración */}
                    {aprobadosConsagracion.filter(a => a.estado_proceso === 'aprobado_consagracion').length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-green-50 border-b border-green-100 px-5 py-3">
                        <p className="text-sm font-medium text-green-800">Selecciona los aspirantes que participarán en la ceremonia</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {aprobadosConsagracion.filter(a => a.estado_proceso === 'aprobado_consagracion').map(a => {
                          const nombre = [a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido].filter(Boolean).join(' ')
                          const meses = calcularMeses(a.fecha_inicio_servicio)
                          const selec = seleccionadosConsagracion.includes(a.id)
                          return (
                            <label key={a.id} className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${selec ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                              <input
                                type="checkbox"
                                checked={selec}
                                onChange={() => toggleSeleccionConsagracion(a.id)}
                                className="w-5 h-5 text-green-600 rounded flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{nombre}</p>
                                <p className="text-xs text-gray-400">{a.numero_identificacion} · {meses !== null ? `${meses} meses de servicio` : '—'}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${a.estado_consagracion === 'paciente' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                → {a.estado_consagracion === 'paciente' ? 'Servita' : 'Paciente'}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                      <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
                        <button
                          onClick={() => setSeleccionadosConsagracion(aprobadosConsagracion.filter(a => a.estado_proceso === 'aprobado_consagracion').map(a => a.id))}
                          className="text-xs text-blue-600 hover:underline">
                          Seleccionar todos
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={() => setSeleccionadosConsagracion([])}
                          className="text-xs text-gray-500 hover:underline">
                          Limpiar selección
                        </button>
                        {seleccionadosConsagracion.length > 0 && (
                          <span className="ml-auto text-xs text-green-700 font-medium">
                            {seleccionadosConsagracion.length} seleccionado{seleccionadosConsagracion.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {/* No aprobados por la junta */}
                    {aprobadosConsagracion.filter(a => a.estado_proceso === 'no_aprobado_junta').length > 0 && (
                    <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
                      <div className="bg-red-50 border-b border-red-100 px-5 py-3">
                        <p className="text-sm font-medium text-red-800">No aprobados para consagración por la junta</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {aprobadosConsagracion.filter(a => a.estado_proceso === 'no_aprobado_junta').map(a => {
                          const nombre = [a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido].filter(Boolean).join(' ')
                          const meses = calcularMeses(a.fecha_inicio_servicio)
                          return (
                            <div key={a.id} className="px-5 py-4 flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{nombre}</p>
                                <p className="text-xs text-gray-400">{a.numero_identificacion} · {meses !== null ? `${meses} meses de servicio` : '—'}</p>
                              </div>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex-shrink-0">✗ No aprobado</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* Formulario de consagración — solo si hay aprobados */}
                    {aprobadosConsagracion.filter(a => a.estado_proceso === 'aprobado_consagracion').length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de la ceremonia de consagración <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={fechaCeremonia}
                        onChange={e => setFechaCeremonia(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acta firmada de consagración (PDF) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={e => subirActa(e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 mb-1"
                      />
                      {subiendoActa && <p className="text-xs text-blue-500 mb-2">Subiendo acta...</p>}
                      {actaUrl && <p className="text-xs text-green-600 mb-3">✓ Acta cargada correctamente</p>}
                      <button
                        onClick={registrarConsagracion}
                        disabled={guardando || !seleccionadosConsagracion.length || !fechaCeremonia}
                        className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
                        ✝ Registrar consagración
                      </button>
                    </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TablaAspirantes({ registros, ciudad, calcularEdad, calcularMeses, onSeleccionar, textoVacio, textoBoton }) {
  if (registros.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">{textoVacio} en {ciudad}.</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Edad</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Meses de servicio</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha registro</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {registros.map(r => {
            const edad = calcularEdad(r.fecha_nacimiento)
            const meses = calcularMeses(r.fecha_inicio_servicio)
            const { texto, alerta, repite } = textoBoton(r)
            return (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{[r.primer_nombre, r.primer_apellido].filter(Boolean).join(' ')}</p>
                  <p className="text-xs text-gray-400">{r.numero_identificacion}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${r.estado_consagracion === 'paciente' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    → {r.estado_consagracion === 'paciente' ? 'Servita' : 'Paciente'}
                  </span>
                  {repite && <span className="inline-block mt-1 ml-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠️ No pasó formación anterior</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${typeof edad === 'number' && edad < 18 ? 'text-red-600' : 'text-gray-700'}`}>
                    {edad} años
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${meses !== null && meses < 6 ? 'text-red-600' : 'text-gray-700'}`}>
                    {meses !== null ? `${meses} meses` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onSeleccionar(r)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg ${alerta ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                    {texto}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
