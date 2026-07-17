import { useState, useEffect, useRef, useCallback } from 'react'
import API_URL from '../../config.js'

const H = () => ({ 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id, 'Content-Type': 'application/json' })

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const anioActual = new Date().getFullYear()
const mesActual = new Date().getMonth() + 1

function fmt(v) { return Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function hoy() { return new Date().toISOString().split('T')[0] }

// ── Selector de archivo (cargar, cámara, pegar) ───────────────────────────────
function SelectorArchivo({ url, onChange, onError }) {
  const [subiendo, setSubiendo] = useState(false)
  const [modoCamara, setModoCamara] = useState(false)
  const inputFileRef = useRef(null)
  const zonaRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const subir = async (archivo) => {
    if (!archivo) return
    setSubiendo(true)
    const fd = new FormData()
    fd.append('archivo', archivo)
    fd.append('bucket', 'Comprobantes')
    fd.append('carpeta', 'soportes')
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id },
      body: fd
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) onChange(res.url)
    else onError(res.mensaje || 'Error al subir el archivo — verifica que el bucket "comprobantes" existe en Supabase Storage')
    setSubiendo(false)
  }

  const onPaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        subir(item.getAsFile())
        return
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [onPaste])

  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setModoCamara(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch {
      onError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    }
  }

  const cerrarCamara = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setModoCamara(false)
  }

  const tomarFoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setModoCamara(false)
    canvas.toBlob(async (blob) => {
      await subir(new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  }

  if (url) {
    return (
      <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
        <span className="text-green-600 text-sm">✓ Soporte adjunto</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver</a>
        <button onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600 ml-auto">Quitar</button>
      </div>
    )
  }

  if (modoCamara) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-t-lg" />
        <div className="flex gap-2 p-2 bg-gray-50">
          <button type="button" onClick={tomarFoto}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            📷 Tomar foto
          </button>
          <button type="button" onClick={cerrarCamara}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={zonaRef} className="border-2 border-dashed border-gray-300 rounded-lg p-3">
      {subiendo ? (
        <p className="text-xs text-gray-400 text-center py-1">Subiendo...</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 text-center mb-2">Adjuntar soporte</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button type="button" onClick={() => inputFileRef.current?.click()}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
              📁 Archivo / Galería
            </button>
            <button type="button" onClick={abrirCamara}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
              📷 Cámara
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">También puedes hacer <strong>Ctrl+V</strong> para pegar una imagen copiada</p>
          <input ref={inputFileRef} type="file" accept="image/*,application/pdf"
            className="hidden" onChange={e => subir(e.target.files[0])} />
        </>
      )}
    </div>
  )
}

// ── Providentes ──────────────────────────────────────────────────────────────
function TabProvidentes() {
  const [lista, setLista] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  const cargar = async (q = '') => {
    const data = await fetch(`${API_URL}/api/financiero/providentes${q ? `?q=${encodeURIComponent(q)}` : ''}`, { headers: H() }).then(r => r.json()).catch(() => [])
    setLista(Array.isArray(data) ? data : [])
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => setForm({ numero_identificacion: '', nombre: '', telefono: '', direccion: '', correo: '' })
  const abrirEditar = (p) => setForm({ ...p })

  const guardar = async () => {
    if (!form.numero_identificacion || !form.nombre) return msg('Cédula y nombre son requeridos')
    setGuardando(true)
    const url = form.id ? `${API_URL}/api/financiero/providentes/${form.id}` : `${API_URL}/api/financiero/providentes`
    const method = form.id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: H(), body: JSON.stringify(form) }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { setForm(null); await cargar(busqueda); msg('✅ Guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
    setGuardando(false)
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este providente?')) return
    const res = await fetch(`${API_URL}/api/financiero/providentes/${id}`, { method: 'DELETE', headers: H() }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { await cargar(busqueda); msg('✅ Eliminado') }
    else msg('❌ No se pudo eliminar')
  }

  const nombre = (p) => p.nombre

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-blue-800 text-base">Providentes</h3>
        <button onClick={abrirNuevo} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">+ Nuevo</button>
      </div>
      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      {form && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="font-semibold text-blue-800 text-sm mb-3">{form.id ? 'Editar providente' : 'Nuevo providente'}</p>
          {[['numero_identificacion','Cédula / Identificación'],['nombre','Nombre completo'],['telefono','Teléfono'],['direccion','Dirección'],['correo','Correo electrónico']].map(([k,l]) => (
            <div key={k} className="mb-2">
              <label className="block text-xs text-gray-500 mb-0.5">{l}</label>
              <input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button onClick={guardar} disabled={guardando} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <input value={busqueda} onChange={e => { setBusqueda(e.target.value); cargar(e.target.value) }}
          placeholder="Buscar por nombre..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No hay providentes registrados</p>
      ) : (
        <div className="space-y-2">
          {lista.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{nombre(p)}</p>
                <p className="text-xs text-gray-400">{p.numero_identificacion}{p.telefono ? ` · ${p.telefono}` : ''}</p>
                {p.correo && <p className="text-xs text-gray-400">{p.correo}</p>}
              </div>
              <div className="flex gap-2 ml-2 flex-shrink-0">
                <button onClick={() => abrirEditar(p)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                <button onClick={() => eliminar(p.id)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal de ingreso ─────────────────────────────────────────────────────────
function ModalIngreso({ onClose, onGuardado, editando, cuentaDefault = 'banco' }) {
  const cuentaInicial = editando ? (editando.cuenta || 'banco') : cuentaDefault
  const tipoDefaultPorCuenta = { banco: 'aporte_consagrado', caja_menor: 'banco_a_caja_menor', consumo_caja_menor: 'caja_menor_a_efectivo', especie: 'donacion_servicio' }
  const [form, setForm] = useState(editando || { fecha: hoy(), tipo: tipoDefaultPorCuenta[cuentaInicial] || 'aporte_consagrado', concepto: '', valor: '', providente_id: '', providente_otro: '', punto_servicio_id: '', punto_servicio_otro: '', mes_aporte: '', comprobante_url: '', numero_recibo: '', forma_donacion: cuentaInicial === 'especie' ? 'especie' : 'dinero', cuenta: cuentaInicial })
  const [providentes, setProvidentes] = useState([])
  const [puntos, setPuntos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/financiero/providentes`, { headers: H() }).then(r => r.json()).then(d => setProvidentes(Array.isArray(d) ? d : []))
    fetch(`${API_URL}/api/financiero/puntos-servicio`, { headers: H() }).then(r => r.json()).then(d => setPuntos(Array.isArray(d) ? d : []))
    if (!editando) {
      fetch(`${API_URL}/api/financiero/proximo-recibo`, { headers: H() }).then(r => r.json()).then(d => {
        if (d.proximo) setForm(p => ({ ...p, numero_recibo: String(d.proximo) }))
      })
    }
  }, [])

  const guardar = async () => {
    if (!form.fecha || !form.concepto || !form.valor) return setMensaje('Completa los campos requeridos')
    setGuardando(true)
    const url = editando ? `${API_URL}/api/financiero/ingresos/${editando.id}` : `${API_URL}/api/financiero/ingresos`
    const method = editando ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: H(), body: JSON.stringify(form) }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) onGuardado()
    else setMensaje('❌ ' + (res.mensaje || 'Error'))
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <h3 className="font-bold text-blue-800 text-base mb-4">{editando ? 'Editar ingreso' : 'Registrar ingreso'}</h3>
        {mensaje && <p className="text-sm text-center py-1.5 bg-red-50 border border-red-200 rounded-lg mb-3 text-red-700">{mensaje}</p>}

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Fecha *</label>
          <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Número de recibo</label>
          <input value={form.numero_recibo} onChange={e => setForm(p => ({ ...p, numero_recibo: e.target.value }))}
            placeholder="Ej: 1770"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Tipo *</label>
          {cuentaInicial === 'caja_menor' ? (
            <p className="text-sm font-medium text-blue-700">De banco a caja menor</p>
          ) : cuentaInicial === 'consumo_caja_menor' ? (
            <p className="text-sm font-medium text-blue-700">De caja menor a efectivo</p>
          ) : (
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value, punto_servicio_id: '', punto_servicio_otro: '', mes_aporte: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {cuentaInicial === 'banco' && <>
                <option value="aporte_consagrado">Aporte consagrado</option>
                <option value="donacion_servicio">Donación para servicio</option>
              </>}
              {cuentaInicial === 'especie' && <option value="donacion_servicio">Donación para servicio</option>}
            </select>
          )}
        </div>

        {form.tipo === 'aporte_consagrado' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Mes del aporte</label>
            <select value={form.mes_aporte} onChange={e => setForm(p => ({ ...p, mes_aporte: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
              {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {form.tipo === 'donacion_servicio' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Servicio</label>
            <select value={form.punto_servicio_id} onChange={e => setForm(p => ({ ...p, punto_servicio_id: e.target.value, punto_servicio_otro: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
              {puntos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              <option value="__otro__">Otro...</option>
            </select>
            {form.punto_servicio_id === '__otro__' && (
              <input value={form.punto_servicio_otro} onChange={e => setForm(p => ({ ...p, punto_servicio_otro: e.target.value }))}
                placeholder="Describe el servicio"
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
        )}

        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Forma de donación</p>
          <span className={`text-sm font-medium ${cuentaInicial === 'especie' ? 'text-purple-700' : 'text-green-700'}`}>
            {cuentaInicial === 'especie' ? 'Especie' : 'Dinero'}
          </span>
        </div>

        {form.forma_donacion === 'dinero' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Cuenta</label>
            <select value={form.cuenta} onChange={e => setForm(p => ({ ...p, cuenta: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="banco">Banco</option>
              <option value="caja_menor">Caja Menor</option>
              <option value="consumo_caja_menor">Consumo Caja Menor</option>
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Concepto *</label>
          <input value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))}
            placeholder="Descripción del ingreso"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Valor *</label>
          <input type="number" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {form.tipo !== 'costo_financiero' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Benefactor</label>
            <select value={form.providente_id} onChange={e => setForm(p => ({ ...p, providente_id: e.target.value, providente_otro: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
              {providentes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              <option value="__otro__">Otro...</option>
            </select>
            {form.providente_id === '__otro__' && (
              <input value={form.providente_otro} onChange={e => setForm(p => ({ ...p, providente_otro: e.target.value }))}
                placeholder="Nombre del benefactor"
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Comprobante</label>
          <SelectorArchivo
            url={form.comprobante_url}
            onChange={url => setForm(p => ({ ...p, comprobante_url: url }))}
            onError={e => setMensaje('❌ ' + e)}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={guardar} disabled={guardando} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de egreso ──────────────────────────────────────────────────────────
function ModalEgreso({ onClose, onGuardado, editando, cuentaDefault = 'banco' }) {
  const cuentaInicial = editando ? (editando.cuenta || 'banco') : cuentaDefault
  const tipoDefaultEgreso = { banco: 'egreso_servicio', caja_menor: 'caja_menor_a_efectivo', consumo_caja_menor: 'egreso_servicio', especie: 'egreso_servicio' }
  const [form, setForm] = useState(editando || { fecha: hoy(), tipo: tipoDefaultEgreso[cuentaInicial] || 'egreso_servicio', punto_servicio_id: '', punto_servicio_otro: '', concepto: '', valor: '', documento_url: '', es_costo_financiero: false, cuenta: cuentaInicial })
  const [puntos, setPuntos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/financiero/puntos-servicio`, { headers: H() }).then(r => r.json()).then(d => setPuntos(Array.isArray(d) ? d : []))
  }, [])

  const guardar = async () => {
    if (!form.fecha || !form.concepto || !form.valor) return setMensaje('Completa los campos requeridos')
    setGuardando(true)
    const url = editando ? `${API_URL}/api/financiero/egresos/${editando.id}` : `${API_URL}/api/financiero/egresos`
    const method = editando ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: H(), body: JSON.stringify(form) }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) onGuardado()
    else setMensaje('❌ ' + (res.mensaje || 'Error'))
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <h3 className="font-bold text-blue-800 text-base mb-4">{editando ? 'Editar egreso' : 'Registrar egreso'}</h3>
        {mensaje && <p className="text-sm text-center py-1.5 bg-red-50 border border-red-200 rounded-lg mb-3 text-red-700">{mensaje}</p>}

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Fecha *</label>
          <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Cuenta</label>
          <select value={form.cuenta} onChange={e => setForm(p => ({ ...p, cuenta: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="banco">Banco</option>
            <option value="caja_menor">Caja Menor</option>
            <option value="consumo_caja_menor">Consumo Caja Menor</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Tipo de egreso</label>
          {cuentaInicial === 'consumo_caja_menor' ? (
            <p className="text-sm font-medium text-blue-700">Egreso para servicio</p>
          ) : cuentaInicial === 'caja_menor' ? (
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value, punto_servicio_id: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="caja_menor_a_efectivo">De caja menor a efectivo</option>
              <option value="costo_financiero">Costo financiero</option>
            </select>
          ) : (
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value, punto_servicio_id: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="egreso_servicio">Egreso para servicio</option>
              <option value="costo_financiero">Costo financiero</option>
              <option value="banco_a_caja_menor">De banco a caja menor</option>
            </select>
          )}
        </div>

        {form.tipo === 'egreso_servicio' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Servicio</label>
            <select value={form.punto_servicio_id} onChange={e => setForm(p => ({ ...p, punto_servicio_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Sin servicio</option>
              {puntos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Concepto *</label>
          <input value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))}
            placeholder="Descripción del egreso"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-0.5">Valor *</label>
          <input type="number" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Documento soporte</label>
          <SelectorArchivo
            url={form.documento_url}
            onChange={url => setForm(p => ({ ...p, documento_url: url }))}
            onError={e => setMensaje('❌ ' + e)}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={guardar} disabled={guardando} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Tab Movimientos ───────────────────────────────────────────────────────────
const CUENTAS = [
  { key: 'banco', label: 'Banco' },
  { key: 'caja_menor', label: 'Mov. Caja Menor' },
  { key: 'consumo_caja_menor', label: 'Consumo Caja Menor' },
  { key: 'especie', label: 'Especie' },
]

function ModalReciboOpciones({ ingreso, onClose }) {
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const correo = ingreso.providente?.correo || null

  const descargar = () => {
    fetch(`${API_URL}/api/financiero/recibo/${ingreso.id}`, { headers: H() })
      .then(r => r.blob()).then(b => {
        const u = URL.createObjectURL(b)
        const a = document.createElement('a')
        a.href = u; a.download = `recibo_${ingreso.numero_recibo || ingreso.id.substring(0,8)}.pdf`
        a.click(); URL.revokeObjectURL(u)
      })
    onClose()
  }

  const enviar = async () => {
    setEnviando(true)
    const res = await fetch(`${API_URL}/api/financiero/enviar-recibo/${ingreso.id}`, { method: 'POST', headers: H() }).then(r => r.json()).catch(() => ({ ok: false, mensaje: 'Error de conexión' }))
    setEnviando(false)
    setMensaje(res.ok ? `✅ ${res.mensaje}` : `❌ ${res.mensaje}`)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-gray-800 text-base mb-1">Recibo #{ingreso.numero_recibo || ingreso.id.substring(0,8)}</h3>
        <p className="text-sm text-gray-500 mb-5">{ingreso.providente?.nombre || ingreso.providente_otro || '—'}</p>

        {mensaje ? (
          <div className="text-sm text-center py-3">{mensaje}</div>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={descargar}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700">
              ⬇ Descargar PDF
            </button>
            <button onClick={enviar} disabled={!correo || enviando}
              className={`w-full py-2.5 rounded-xl font-semibold border ${correo ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {enviando ? 'Enviando...' : correo ? `✉ Enviar a ${correo}` : '✉ Sin correo registrado'}
            </button>
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600">Cerrar</button>
      </div>
    </div>
  )
}

function TabMovimientos() {
  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(anioActual)
  const [ingresos, setIngresos] = useState([])
  const [egresos, setEgresos] = useState([])
  const [cuentaTab, setCuentaTab] = useState('banco')
  const [cargando, setCargando] = useState(false)
  const [modalIngreso, setModalIngreso] = useState(false)
  const [modalEgreso, setModalEgreso] = useState(false)
  const [editandoIngreso, setEditandoIngreso] = useState(null)
  const [editandoEgreso, setEditandoEgreso] = useState(null)
  const [modalRecibo, setModalRecibo] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  const cargar = async () => {
    setCargando(true)
    const params = `mes=${mes}&anio=${anio}`
    const [ing, egr] = await Promise.all([
      fetch(`${API_URL}/api/financiero/ingresos?${params}`, { headers: H() }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/financiero/egresos?${params}`, { headers: H() }).then(r => r.json()).catch(() => []),
    ])
    setIngresos(Array.isArray(ing) ? ing : [])
    setEgresos(Array.isArray(egr) ? egr : [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [mes, anio])

  const eliminarIngreso = async (id) => {
    if (!confirm('¿Eliminar este ingreso?')) return
    await fetch(`${API_URL}/api/financiero/ingresos/${id}`, { method: 'DELETE', headers: H() })
    await cargar()
    msg('✅ Eliminado')
  }

  const eliminarEgreso = async (id) => {
    if (!confirm('¿Eliminar este egreso?')) return
    await fetch(`${API_URL}/api/financiero/egresos/${id}`, { method: 'DELETE', headers: H() })
    await cargar()
    msg('✅ Eliminado')
  }

  const [saldoInicial, setSaldoInicial] = useState(0)
  const [totalesHistoricos, setTotalesHistoricos] = useState({ totalIngresos: 0, totalEgresos: 0 })
  const [editandoSaldo, setEditandoSaldo] = useState(false)
  const [saldoInput, setSaldoInput] = useState('')

  const cargarSaldo = async (cuenta, m, a) => {
    if (cuenta === 'especie') return
    const hasta = `${a}-${String(m).padStart(2,'0')}-01`
    const [s, t] = await Promise.all([
      fetch(`${API_URL}/api/financiero/saldo-inicial?cuenta=${cuenta}`, { headers: H() }).then(r => r.json()).catch(() => ({ saldo: 0 })),
      fetch(`${API_URL}/api/financiero/totales-cuenta?cuenta=${cuenta}&hasta=${hasta}`, { headers: H() }).then(r => r.json()).catch(() => ({ totalIngresos: 0, totalEgresos: 0 })),
    ])
    setSaldoInicial(s.saldo || 0)
    setTotalesHistoricos(t)
  }

  useEffect(() => { cargarSaldo(cuentaTab, mes, anio) }, [cuentaTab, mes, anio])

  const guardarSaldoInicial = async () => {
    await fetch(`${API_URL}/api/financiero/saldo-inicial`, { method: 'PUT', headers: H(), body: JSON.stringify({ cuenta: cuentaTab, saldo: Number(saldoInput) }) })
    setEditandoSaldo(false)
    cargarSaldo(cuentaTab)
  }

  const ingFiltrados = ingresos.filter(i => (i.cuenta || 'banco') === cuentaTab)
  const egrFiltrados = egresos.filter(e => (e.cuenta || 'banco') === cuentaTab)
  const totalIngresos = ingFiltrados.reduce((s, i) => s + Number(i.valor), 0)
  const totalEgresos = egrFiltrados.reduce((s, e) => s + Number(e.valor), 0)
  const saldo = totalIngresos - totalEgresos
  const saldoReal = saldoInicial + totalesHistoricos.totalIngresos - totalesHistoricos.totalEgresos
  const esEspecie = cuentaTab === 'especie'

  const tipoLabel = { aporte_consagrado: 'Aporte consagrado', donacion_servicio: 'Donación', egreso_servicio: 'Egreso para servicio', costo_financiero: 'Costo financiero', banco_a_caja_menor: 'De banco a caja menor', caja_menor_a_efectivo: 'De caja menor a efectivo' }

  return (
    <>
    <div>
      {(modalIngreso || editandoIngreso) && (
        <ModalIngreso editando={editandoIngreso} cuentaDefault={cuentaTab} onClose={() => { setModalIngreso(false); setEditandoIngreso(null) }} onGuardado={() => { setModalIngreso(false); setEditandoIngreso(null); cargar() }} />
      )}
      {(modalEgreso || editandoEgreso) && (
        <ModalEgreso editando={editandoEgreso} cuentaDefault={cuentaTab} onClose={() => { setModalEgreso(false); setEditandoEgreso(null) }} onGuardado={() => { setModalEgreso(false); setEditandoEgreso(null); cargar() }} />
      )}

      {/* Filtro mes/año */}
      <div className="flex gap-2 mb-4">
        <select value={mes} onChange={e => setMes(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {MESES.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select value={anio} onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {[anioActual-1, anioActual, anioActual+1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Sub-pestañas de cuenta */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {CUENTAS.map(c => (
          <button key={c.key} onClick={() => setCuentaTab(c.key)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${cuentaTab === c.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      {/* Resumen */}
      {esEspecie ? (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center mb-5">
          <p className="text-xs text-purple-600 mb-1">Total donaciones en especie — {MESES[mes-1]} {anio}</p>
          <p className="text-lg font-bold text-purple-700">{fmt(totalIngresos)}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{MESES[mes-1]} {anio}</span>
            <button onClick={() => { setEditandoSaldo(true); setSaldoInput(String(saldoInicial)) }}
              className="text-xs text-blue-600 hover:underline">Editar saldo inicial</button>
          </div>
          {editandoSaldo ? (
            <div className="flex gap-2 items-center">
              <input type="number" value={saldoInput} onChange={e => setSaldoInput(e.target.value)}
                placeholder="Saldo al inicio del sistema"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={guardarSaldoInicial} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Guardar</button>
              <button onClick={() => setEditandoSaldo(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo mes anterior</span>
                <span className="font-semibold text-gray-700">{fmt(saldoReal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">+ Ingresos {MESES[mes-1]}</span>
                <span className="font-semibold text-green-700">{fmt(totalIngresos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-500">− Egresos {MESES[mes-1]}</span>
                <span className="font-semibold text-red-700">{fmt(totalEgresos)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-1">
                <span className="font-bold text-gray-700">Saldo mes actual</span>
                <span className={`text-base font-bold ${(saldoReal + saldo) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(saldoReal + saldo)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingresos */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-700 text-sm">Ingresos</h4>
            {cuentaTab === 'banco' && ingFiltrados.length > 0 && (
              <span className="text-xs text-gray-400">{ingFiltrados.filter(i => i.revisado).length}/{ingFiltrados.length} revisados</span>
            )}
          </div>
          <button onClick={() => setModalIngreso(true)} className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700">+ Agregar</button>
        </div>
        {cargando ? <p className="text-xs text-gray-400 py-2">Cargando...</p> :
          ingFiltrados.length === 0 ? <p className="text-xs text-gray-400 py-2">Sin ingresos este mes</p> : (
            <div className="space-y-2">
              {ingFiltrados.map(i => (
                <div key={i.id} className={`border rounded-lg p-3 ${cuentaTab === 'banco' && i.revisado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{tipoLabel[i.tipo]}</span>
                        {i.punto?.nombre && <span className="text-xs text-gray-500">{i.punto.nombre}</span>}
                        {i.punto_servicio_otro && <span className="text-xs text-gray-500">{i.punto_servicio_otro}</span>}
                        {i.mes_aporte && <span className="text-xs text-gray-500">{i.mes_aporte}</span>}
                        {i.numero_recibo && <span className="text-xs text-gray-400">#{i.numero_recibo}</span>}
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{i.concepto}</p>
                      {(i.providente?.nombre || i.providente_otro) && <p className="text-xs text-gray-400">{i.providente?.nombre || i.providente_otro}</p>}
                      <p className="text-xs text-gray-400">{i.fecha}</p>
                    </div>
                    <div className="ml-2 text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-700">{fmt(i.valor)}</p>
                      <div className="flex gap-2 justify-end mt-1 items-center">
                        {cuentaTab === 'banco' && (
                          <label className="flex items-center gap-1 cursor-pointer" title={i.revisado ? 'Revisado contra extracto' : 'Marcar como revisado'}>
                            <input type="checkbox" checked={!!i.revisado} onChange={async e => {
                              const revisado = e.target.checked
                              await fetch(`${API_URL}/api/financiero/ingresos/${i.id}/revisado`, { method: 'PATCH', headers: H(), body: JSON.stringify({ revisado }) })
                              setIngresos(prev => prev.map(x => x.id === i.id ? { ...x, revisado } : x))
                            }} className="w-3.5 h-3.5 accent-green-600" />
                            <span className="text-xs text-gray-400">✓</span>
                          </label>
                        )}
                        {i.comprobante_url && <a href={i.comprobante_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Ver</a>}
                        <button onClick={() => cuentaTab === 'banco' ? setModalRecibo(i) : fetch(`${API_URL}/api/financiero/recibo/${i.id}`, { headers: H() }).then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=`recibo_${i.numero_recibo||i.id.substring(0,8)}.pdf`; a.click(); URL.revokeObjectURL(u) })}
                          className="text-xs text-purple-600 hover:text-purple-800 cursor-pointer">PDF</button>
                        <button onClick={() => setEditandoIngreso(i)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                        <button onClick={() => eliminarIngreso(i.id)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Egresos — no aplica para especie */}
      {!esEspecie && <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-700 text-sm">Egresos</h4>
            {cuentaTab === 'banco' && egrFiltrados.length > 0 && (
              <span className="text-xs text-gray-400">{egrFiltrados.filter(e => e.revisado).length}/{egrFiltrados.length} revisados</span>
            )}
          </div>
          <button onClick={() => setModalEgreso(true)} className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700">+ Agregar</button>
        </div>
        {cargando ? <p className="text-xs text-gray-400 py-2">Cargando...</p> :
          egrFiltrados.length === 0 ? <p className="text-xs text-gray-400 py-2">Sin egresos este mes</p> : (
            <div className="space-y-2">
              {egrFiltrados.map(e => (
                <div key={e.id} className={`border rounded-lg p-3 ${cuentaTab === 'banco' && e.revisado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {e.tipo === 'costo_financiero'
                          ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Costo financiero</span>
                          : e.tipo === 'banco_a_caja_menor'
                          ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Banco → Caja menor</span>
                          : e.tipo === 'caja_menor_a_efectivo'
                          ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Caja menor → Efectivo</span>
                          : e.punto?.nombre && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.punto.nombre}</span>
                        }
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{e.concepto}</p>
                      <p className="text-xs text-gray-400">{e.fecha}</p>
                    </div>
                    <div className="ml-2 text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-700">{fmt(e.valor)}</p>
                      <div className="flex gap-2 justify-end mt-1 items-center">
                        {cuentaTab === 'banco' && (
                          <label className="flex items-center gap-1 cursor-pointer" title={e.revisado ? 'Revisado contra extracto' : 'Marcar como revisado'}>
                            <input type="checkbox" checked={!!e.revisado} onChange={async ev => {
                              const revisado = ev.target.checked
                              await fetch(`${API_URL}/api/financiero/egresos/${e.id}/revisado`, { method: 'PATCH', headers: H(), body: JSON.stringify({ revisado }) })
                              setEgresos(prev => prev.map(x => x.id === e.id ? { ...x, revisado } : x))
                            }} className="w-3.5 h-3.5 accent-green-600" />
                            <span className="text-xs text-gray-400">✓</span>
                          </label>
                        )}
                        {e.documento_url && <a href={e.documento_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Ver</a>}
                        <button onClick={() => setEditandoEgreso(e)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                        <button onClick={() => eliminarEgreso(e.id)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>}
    </div>
    {modalRecibo && <ModalReciboOpciones ingreso={modalRecibo} onClose={() => setModalRecibo(null)} />}
    </>
  )
}

// ── Tab Equipo ────────────────────────────────────────────────────────────────
function TabEquipo() {
  const [equipo, setEquipo] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [mensaje, setMensaje] = useState('')

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }
  const nombre = (r) => [r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido].filter(Boolean).join(' ')

  const cargar = async () => {
    const data = await fetch(`${API_URL}/api/financiero/equipo`, { headers: H() }).then(r => r.json()).catch(() => [])
    setEquipo(Array.isArray(data) ? data : [])
  }

  useEffect(() => { cargar() }, [])

  const buscar = async (q) => {
    setBusqueda(q)
    if (!q) return setResultados([])
    const data = await fetch(`${API_URL}/api/financiero/buscar-servidor?q=${encodeURIComponent(q)}`, { headers: H() }).then(r => r.json()).catch(() => [])
    setResultados(Array.isArray(data) ? data.filter(r => !(r.roles || []).includes('responsable_financiero')) : [])
  }

  const asignar = async (id) => {
    const res = await fetch(`${API_URL}/api/financiero/asignar-rol/${id}`, { method: 'PUT', headers: H() }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { setBusqueda(''); setResultados([]); await cargar(); msg('✅ Rol asignado') }
    else msg('❌ Error al asignar')
  }

  const quitar = async (id) => {
    if (!confirm('¿Quitar el acceso financiero a este servidor?')) return
    const res = await fetch(`${API_URL}/api/financiero/quitar-rol/${id}`, { method: 'PUT', headers: H() }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) { await cargar(); msg('✅ Acceso retirado') }
    else msg('❌ Error')
  }

  return (
    <div>
      <h3 className="font-bold text-blue-800 text-base mb-4">Equipo financiero</h3>
      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Agregar servidor al equipo</label>
        <input value={busqueda} onChange={e => buscar(e.target.value)}
          placeholder="Buscar por nombre o cédula..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {resultados.length > 0 && (
          <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden">
            {resultados.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-800">{nombre(r)}</p>
                  <p className="text-xs text-gray-400">{r.numero_identificacion}</p>
                </div>
                <button onClick={() => asignar(r.id)} className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700">Agregar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h4 className="font-semibold text-gray-700 text-sm mb-2">Con acceso actual</h4>
      {equipo.length === 0 ? (
        <p className="text-sm text-gray-400">Solo tú tienes acceso por ahora</p>
      ) : (
        <div className="space-y-2">
          {equipo.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{nombre(r)}</p>
                <p className="text-xs text-gray-400">{r.numero_identificacion}</p>
              </div>
              <button onClick={() => quitar(r.id)} className="text-xs text-red-400 hover:text-red-600">Quitar acceso</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────
function ConsultaMovimientoBanco() {
  const hoy = new Date().toISOString().slice(0, 10)
  const primerDiaMes = `${anioActual}-${mesActual}-01`
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoy)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [consultado, setConsultado] = useState(false)

  const consultar = () => {
    if (!desde || !hasta) return
    setCargando(true)
    setDatos(null)
    setConsultado(true)
    fetch(`${API_URL}/api/financiero/consulta/movimiento-banco?desde=${desde}&hasta=${hasta}`, { headers: H() })
      .then(r => r.json()).catch(() => null)
      .then(d => { setDatos(d); setCargando(false) })
  }

  const totalIngresos = (datos?.movimientos || []).reduce((s, r) => s + (r.ingreso || 0), 0)
  const totalEgresos = (datos?.movimientos || []).reduce((s, r) => s + (r.egreso || 0), 0)

  return (
    <div>
      <div className="flex gap-2 mb-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={consultar} disabled={cargando}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {cargando ? '...' : 'Consultar'}
        </button>
      </div>

      {!consultado ? null : cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : !datos ? (
        <p className="text-sm text-red-400 text-center py-8">Error cargando datos</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Saldo anterior</p>
              <p className="text-sm font-bold text-gray-700">{fmt(datos.saldoAnterior)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <p className="text-xs text-green-600 mb-0.5">Ingresos</p>
              <p className="text-sm font-bold text-green-700">{fmt(totalIngresos)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              <p className="text-xs text-red-500 mb-0.5">Egresos</p>
              <p className="text-sm font-bold text-red-600">{fmt(totalEgresos)}</p>
            </div>
          </div>

          {datos.movimientos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin movimientos en este período</p>
          ) : (
            <div className="space-y-2">
              {datos.movimientos.map(r => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{r.fecha}</span>
                        {r.comprobante && <span className="text-xs text-gray-400">#{r.comprobante}</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${r.ingreso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.ingreso ? 'Ingreso' : 'Egreso'}
                        </span>
                      </div>
                      {r.benefactor && <p className="text-sm font-medium text-gray-800 mt-0.5">{r.benefactor}</p>}
                      <div className="flex gap-2 mt-0.5">
                        {r.servicio && <span className="text-xs text-gray-500">{r.servicio}</span>}
                        {r.concepto && <span className="text-xs text-gray-400">{r.concepto}</span>}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`text-sm font-bold ${r.ingreso ? 'text-green-700' : 'text-red-600'}`}>
                        {r.ingreso ? `+${fmt(r.ingreso)}` : `-${fmt(r.egreso)}`}
                      </p>
                      <p className="text-xs text-gray-400">Saldo: {fmt(r.saldo)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ConsultaBusquedaConcepto() {
  const hoy = new Date().toISOString().slice(0, 10)
  const primerDiaMes = `${anioActual}-${String(mesActual).padStart(2,'0')}-01`
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoy)
  const [palabra, setPalabra] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [consultado, setConsultado] = useState(false)

  const consultar = async () => {
    if (!palabra.trim() || !desde || !hasta) return
    setCargando(true)
    setConsultado(true)
    const res = await fetch(`${API_URL}/api/financiero/consulta/busqueda-concepto?desde=${desde}&hasta=${hasta}&q=${encodeURIComponent(palabra.trim())}`, { headers: H() })
      .then(r => r.json()).catch(() => [])
    setResultados(Array.isArray(res) ? res : [])
    setCargando(false)
  }

  const totalIngresos = resultados.filter(r => r._tipo === 'ingreso').reduce((s, r) => s + Number(r.valor), 0)
  const totalEgresos = resultados.filter(r => r._tipo === 'egreso').reduce((s, r) => s + Number(r.valor), 0)

  return (
    <div>
      <div className="flex gap-2 mb-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex gap-2 mb-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Buscar en concepto</label>
          <input type="text" value={palabra} onChange={e => setPalabra(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && consultar()}
            placeholder="ej: arriendo, seguro, nómina..."
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={consultar} disabled={cargando || !palabra.trim()}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {cargando ? '...' : 'Buscar'}
        </button>
      </div>

      {!consultado ? null : cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Buscando...</p>
      ) : resultados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin resultados para "{palabra}"</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <p className="text-xs text-green-600 mb-0.5">Total ingresos</p>
              <p className="text-sm font-bold text-green-700">{fmt(totalIngresos)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              <p className="text-xs text-red-500 mb-0.5">Total egresos</p>
              <p className="text-sm font-bold text-red-600">{fmt(totalEgresos)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-2">{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {resultados.map(r => (
              <div key={r.id + r._tipo} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">{r.fecha}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${r._tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {r._tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                      {r.cuenta && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{r.cuenta}</span>}
                    </div>
                    {r.benefactor && <p className="text-sm font-medium text-gray-800 mt-0.5">{r.benefactor}</p>}
                    <p className="text-xs text-gray-600 mt-0.5">{r.concepto}</p>
                  </div>
                  <p className={`text-sm font-bold ml-2 flex-shrink-0 ${r._tipo === 'ingreso' ? 'text-green-700' : 'text-red-600'}`}>
                    {r._tipo === 'ingreso' ? '+' : '-'}{fmt(Number(r.valor))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ConsultaDonacionesEspecie() {
  const hoy = new Date().toISOString().slice(0, 10)
  const primerDiaMes = `${anioActual}-${String(mesActual).padStart(2,'0')}-01`
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoy)
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [consultado, setConsultado] = useState(false)

  const consultar = async () => {
    setCargando(true)
    setConsultado(true)
    const res = await fetch(`${API_URL}/api/financiero/consulta/donaciones-especie?desde=${desde}&hasta=${hasta}`, { headers: H() })
      .then(r => r.json()).catch(() => [])
    setResultados(Array.isArray(res) ? res : [])
    setCargando(false)
  }

  const total = resultados.reduce((s, r) => s + Number(r.valor), 0)

  return (
    <div>
      <div className="flex gap-2 mb-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-0.5">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={consultar} disabled={cargando}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {cargando ? '...' : 'Consultar'}
        </button>
      </div>

      {!consultado ? null : cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : resultados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin donaciones en especie en este período</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
              <p className="text-xs text-purple-600 mb-0.5">Total en especie</p>
              <p className="text-sm font-bold text-purple-700">{fmt(total)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
              <p className="text-xs text-blue-600 mb-0.5">Donaciones</p>
              <p className="text-sm font-bold text-blue-700">{resultados.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {resultados.map(r => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">{r.fecha}</span>
                      {(r.punto?.nombre || r.punto_servicio_otro) && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{r.punto?.nombre || r.punto_servicio_otro}</span>
                      )}
                    </div>
                    {(r.providente?.nombre || r.providente_otro) && (
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{r.providente?.nombre || r.providente_otro}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">{r.concepto}</p>
                  </div>
                  <p className="text-sm font-bold text-purple-700 ml-2 flex-shrink-0">{fmt(Number(r.valor))}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TabConsultas() {
  const [subtab, setSubtab] = useState('aportes')
  const [providentes, setProvidentes] = useState([])
  const [anio, setAnio] = useState(anioActual)
  const [aportes, setAportes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [expandido, setExpandido] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/api/financiero/providentes`, { headers: H() }).then(r => r.json()).then(d => setProvidentes(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    setCargando(true)
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const mesIdx = (m) => {
      if (!m) return 999
      const parts = m.trim().split(' ')
      const idx = MESES.findIndex(x => x.toLowerCase() === parts[0].toLowerCase())
      const yr = parts[1] ? parseInt(parts[1]) : 0
      return yr * 100 + idx
    }
    fetch(`${API_URL}/api/financiero/consulta/aportes-benefactor?anio=${anio}`, { headers: H() })
      .then(r => r.json()).catch(() => [])
      .then(data => {
        const lista = Array.isArray(data) ? data : []
        lista.sort((a, b) => mesIdx(a.mes_aporte) - mesIdx(b.mes_aporte) || a.fecha.localeCompare(b.fecha))
        setAportes(lista)
        setCargando(false)
      })
  }, [anio])

  const porBenefactor = aportes.reduce((acc, a) => {
    const key = a.providente_id || a.providente_otro || 'sin_nombre'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const grupos = Object.entries(porBenefactor).map(([key, items]) => {
    const prov = providentes.find(p => p.id === key)
    const nombre = prov?.nombre || items[0]?.providente_otro || 'Sin nombre'
    const total = items.reduce((s, a) => s + Number(a.valor), 0)
    const meses = [...new Set(items.map(a => a.mes_aporte).filter(Boolean))]
    return { key, nombre, items, total, meses }
  }).sort((a, b) => a.nombre.localeCompare(b.nombre))

  const totalGeneral = aportes.reduce((s, a) => s + Number(a.valor), 0)

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        {[{ key: 'aportes', label: 'Aportes consagrados' }, { key: 'banco', label: 'Movimiento banco' }, { key: 'concepto', label: 'Buscar concepto' }, { key: 'especie', label: 'Donaciones especie' }].map(s => (
          <button key={s.key} onClick={() => setSubtab(s.key)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${subtab === s.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {subtab === 'banco' ? <ConsultaMovimientoBanco /> : subtab === 'concepto' ? <ConsultaBusquedaConcepto /> : subtab === 'especie' ? <ConsultaDonacionesEspecie /> : <>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-blue-800 text-base">Aportes consagrados {anio}</h3>
        <select value={anio} onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {[anioActual-2, anioActual-1, anioActual].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      ) : grupos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin aportes registrados en {anio}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600 mb-1">Total {anio}</p>
              <p className="text-base font-bold text-green-700">{fmt(totalGeneral)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">Benefactores activos</p>
              <p className="text-base font-bold text-blue-700">{grupos.length}</p>
            </div>
          </div>

          <div className="space-y-2">
            {grupos.map(g => (
              <div key={g.key} className="border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setExpandido(e => ({ ...e, [g.key]: !e[g.key] }))}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 text-left">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.nombre}</p>
                    <p className="text-xs text-gray-400">{g.meses.length} {g.meses.length === 1 ? 'mes' : 'meses'} · {g.items.length} {g.items.length === 1 ? 'registro' : 'registros'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-700">{fmt(g.total)}</span>
                    <span className="text-gray-400 text-xs">{expandido[g.key] ? '▲' : '▼'}</span>
                  </div>
                </button>
                {expandido[g.key] && (
                  <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
                    {g.items.map(a => (
                      <div key={a.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          {a.mes_aporte && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.mes_aporte}</span>}
                          {a.numero_recibo && <span className="text-xs text-gray-400">#{a.numero_recibo}</span>}
                          <span className="text-xs text-gray-400">{a.fecha}</span>
                        </div>
                        <span className="text-sm font-bold text-green-700">{fmt(Number(a.valor))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      </>}
    </div>
  )
}

function TabReportes() {
  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(anioActual)
  const [descargando, setDescargando] = useState('')

  const descargar = async (tipo) => {
    setDescargando(tipo)
    const params = `mes=${mes}&anio=${anio}`
    const res = await fetch(`${API_URL}/api/financiero/reporte/${tipo}?${params}`, { headers: { 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id } })
    if (!res.ok) { setDescargando(''); return alert('Error al generar el reporte') }
    const ct = res.headers.get('Content-Type') || ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      setDescargando('')
      return alert(json.mensaje || 'Sin datos para este período')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ext = tipo === 'recibos-mes' ? 'zip' : tipo.startsWith('imagenes') ? 'pdf' : 'xlsx'
    a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g,'') || `${tipo}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setDescargando('')
  }

  const reportes = [
    { key: 'aportes-consagrados', label: 'Relación aportes consagrados', desc: 'Aportes consagrados del mes ordenados por benefactor' },
    { key: 'donaciones', label: 'Relación de donaciones', desc: 'Donaciones del mes — sección especie y sección dinero con totales' },
    { key: 'movimiento-banco', label: 'Movimiento banco', desc: 'Todos los ingresos y egresos del banco en orden de fecha con saldo acumulado' },
    { key: 'movimiento-caja-menor', label: 'Movimiento caja menor', desc: 'Ingresos y egresos de caja menor con saldo acumulado' },
    { key: 'consumo-caja-menor', label: 'Consumo caja menor', desc: 'Ingresos y egresos de consumo caja menor con saldo acumulado' },
    { key: 'recibos-mes', label: 'Recibos de donación (ZIP)', desc: 'Recibos PDF del mes en ZIP', formato: 'ZIP' },
    { key: 'imagenes-banco', label: 'Imágenes banco', desc: 'Soportes fotográficos banco', formato: 'PDF' },
    { key: 'imagenes-caja-menor', label: 'Imágenes caja menor', desc: 'Soportes fotográficos caja menor', formato: 'PDF' },
    { key: 'imagenes-consumo-caja-menor', label: 'Imágenes consumo', desc: 'Soportes fotográficos consumo caja menor', formato: 'PDF' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <select value={mes} onChange={e => setMes(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {MESES.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select value={anio} onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {[anioActual-1, anioActual, anioActual+1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {reportes.map(r => (
          <div key={r.key} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">{r.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
            </div>
            <button onClick={() => descargar(r.key)} disabled={descargando === r.key}
              className="w-full text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-center">
              {descargando === r.key ? 'Generando...' : `⬇ ${r.formato || 'Excel'}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PanelFinanciero() {
  const [tab, setTab] = useState('movimientos')

  const tabs = [
    { key: 'consultas', label: 'Consultas' },
    { key: 'movimientos', label: 'Movimientos' },
    { key: 'providentes', label: 'Providentes' },
    { key: 'equipo', label: 'Equipo' },
    { key: 'reportes', label: 'Reportes' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-4">Módulo financiero</h2>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'consultas' && <TabConsultas />}
      {tab === 'movimientos' && <TabMovimientos />}
      {tab === 'providentes' && <TabProvidentes />}
      {tab === 'equipo' && <TabEquipo />}
      {tab === 'reportes' && <TabReportes />}
    </div>
  )
}
