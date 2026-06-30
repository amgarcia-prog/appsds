import { useState, useEffect, useRef, useCallback } from 'react'
import API_URL from '../../config.js'

const H = () => ({ 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id, 'Content-Type': 'application/json' })

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const anioActual = new Date().getFullYear()
const mesActual = new Date().getMonth() + 1

function fmt(v) { return Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }) }
function hoy() { return new Date().toISOString().split('T')[0] }

// ── Selector de archivo (cargar, cámara, pegar) ───────────────────────────────
function SelectorArchivo({ url, onChange, onError }) {
  const [subiendo, setSubiendo] = useState(false)
  const inputFileRef = useRef(null)
  const inputCamaraRef = useRef(null)
  const zonaRef = useRef(null)

  const subir = async (archivo) => {
    if (!archivo) return
    setSubiendo(true)
    const fd = new FormData()
    fd.append('archivo', archivo)
    fd.append('bucket', 'comprobantes')
    fd.append('carpeta', 'soportes')
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'x-miembro-id': JSON.parse(localStorage.getItem('miembro_sesion') || '{}').id },
      body: fd
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (res.ok) onChange(res.url)
    else onError('Error al subir el archivo')
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
    const zona = zonaRef.current
    if (!zona) return
    zona.addEventListener('paste', onPaste)
    return () => zona.removeEventListener('paste', onPaste)
  }, [onPaste])

  if (url) {
    return (
      <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
        <span className="text-green-600 text-sm">✓ Soporte adjunto</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver</a>
        <button onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600 ml-auto">Quitar</button>
      </div>
    )
  }

  return (
    <div ref={zonaRef} tabIndex={0}
      className="border-2 border-dashed border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-400"
      onPaste={onPaste}>
      {subiendo ? (
        <p className="text-xs text-gray-400 text-center py-1">Subiendo...</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 text-center mb-2">Adjuntar soporte</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button type="button" onClick={() => inputFileRef.current?.click()}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
              📁 Cargar archivo
            </button>
            <button type="button" onClick={() => inputCamaraRef.current?.click()}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
              📷 Tomar foto
            </button>
            <button type="button" onClick={() => { zonaRef.current?.focus() }}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"
              title="Haz clic aquí y luego Ctrl+V para pegar desde WhatsApp">
              📋 Pegar imagen
            </button>
          </div>
          <p className="text-xs text-gray-300 text-center mt-2">También puedes hacer Ctrl+V aquí para pegar</p>
          <input ref={inputFileRef} type="file" accept="image/*,application/pdf"
            className="hidden" onChange={e => subir(e.target.files[0])} />
          <input ref={inputCamaraRef} type="file" accept="image/*" capture="environment"
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
function ModalIngreso({ onClose, onGuardado, editando }) {
  const [form, setForm] = useState(editando || { fecha: hoy(), tipo: 'donacion_servicio', concepto: '', valor: '', providente_id: '', punto_servicio_id: '', mes_aporte: '', comprobante_url: '' })
  const [providentes, setProvidentes] = useState([])
  const [puntos, setPuntos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/financiero/providentes`, { headers: H() }).then(r => r.json()).then(d => setProvidentes(Array.isArray(d) ? d : []))
    fetch(`${API_URL}/api/financiero/puntos-servicio`, { headers: H() }).then(r => r.json()).then(d => setPuntos(Array.isArray(d) ? d : []))
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
          <label className="block text-xs text-gray-500 mb-0.5">Tipo *</label>
          <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value, punto_servicio_id: '', mes_aporte: '' }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="aporte_consagrado">Aporte consagrado</option>
            <option value="donacion_servicio">Donación para servicio</option>
            <option value="costo_financiero">Costo financiero</option>
          </select>
        </div>

        {form.tipo === 'aporte_consagrado' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Mes del aporte</label>
            <select value={form.mes_aporte} onChange={e => setForm(p => ({ ...p, mes_aporte: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
              {MESES.map((m, i) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {form.tipo === 'donacion_servicio' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Servicio</label>
            <select value={form.punto_servicio_id} onChange={e => setForm(p => ({ ...p, punto_servicio_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
              {puntos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
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
            <label className="block text-xs text-gray-500 mb-0.5">Providente</label>
            <select value={form.providente_id} onChange={e => setForm(p => ({ ...p, providente_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
              {providentes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
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
function ModalEgreso({ onClose, onGuardado, editando }) {
  const [form, setForm] = useState(editando || { fecha: hoy(), punto_servicio_id: '', concepto: '', valor: '', documento_url: '', es_costo_financiero: false })
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.es_costo_financiero} onChange={e => setForm(p => ({ ...p, es_costo_financiero: e.target.checked, punto_servicio_id: '' }))}
              className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700">Es costo financiero</span>
          </label>
        </div>

        {!form.es_costo_financiero && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-0.5">Servicio</label>
            <select value={form.punto_servicio_id} onChange={e => setForm(p => ({ ...p, punto_servicio_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecciona...</option>
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
function TabMovimientos() {
  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(anioActual)
  const [ingresos, setIngresos] = useState([])
  const [egresos, setEgresos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [modalIngreso, setModalIngreso] = useState(false)
  const [modalEgreso, setModalEgreso] = useState(false)
  const [editandoIngreso, setEditandoIngreso] = useState(null)
  const [editandoEgreso, setEditandoEgreso] = useState(null)
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

  const totalIngresos = ingresos.reduce((s, i) => s + Number(i.valor), 0)
  const totalEgresos = egresos.reduce((s, e) => s + Number(e.valor), 0)
  const saldo = totalIngresos - totalEgresos

  const tipoLabel = { aporte_consagrado: 'Aporte consagrado', donacion_servicio: 'Donación', costo_financiero: 'Costo financiero' }

  return (
    <div>
      {(modalIngreso || editandoIngreso) && (
        <ModalIngreso editando={editandoIngreso} onClose={() => { setModalIngreso(false); setEditandoIngreso(null) }} onGuardado={() => { setModalIngreso(false); setEditandoIngreso(null); cargar() }} />
      )}
      {(modalEgreso || editandoEgreso) && (
        <ModalEgreso editando={editandoEgreso} onClose={() => { setModalEgreso(false); setEditandoEgreso(null) }} onGuardado={() => { setModalEgreso(false); setEditandoEgreso(null); cargar() }} />
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

      {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-3">{mensaje}</p>}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 mb-1">Ingresos</p>
          <p className="text-sm font-bold text-green-700">{fmt(totalIngresos)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 mb-1">Egresos</p>
          <p className="text-sm font-bold text-red-700">{fmt(totalEgresos)}</p>
        </div>
        <div className={`${saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-3 text-center`}>
          <p className={`text-xs mb-1 ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo</p>
          <p className={`text-sm font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(saldo)}</p>
        </div>
      </div>

      {/* Ingresos */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700 text-sm">Ingresos</h4>
          <button onClick={() => setModalIngreso(true)} className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700">+ Agregar</button>
        </div>
        {cargando ? <p className="text-xs text-gray-400 py-2">Cargando...</p> :
          ingresos.length === 0 ? <p className="text-xs text-gray-400 py-2">Sin ingresos este mes</p> : (
            <div className="space-y-2">
              {ingresos.map(i => (
                <div key={i.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{tipoLabel[i.tipo]}</span>
                        {i.punto?.nombre && <span className="text-xs text-gray-500">{i.punto.nombre}</span>}
                        {i.mes_aporte && <span className="text-xs text-gray-500">{i.mes_aporte}</span>}
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{i.concepto}</p>
                      {i.providente?.nombre && <p className="text-xs text-gray-400">{i.providente.nombre}</p>}
                      <p className="text-xs text-gray-400">{i.fecha}</p>
                    </div>
                    <div className="ml-2 text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-700">{fmt(i.valor)}</p>
                      <div className="flex gap-2 justify-end mt-1">
                        {i.comprobante_url && <a href={i.comprobante_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Ver</a>}
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

      {/* Egresos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700 text-sm">Egresos</h4>
          <button onClick={() => setModalEgreso(true)} className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700">+ Agregar</button>
        </div>
        {cargando ? <p className="text-xs text-gray-400 py-2">Cargando...</p> :
          egresos.length === 0 ? <p className="text-xs text-gray-400 py-2">Sin egresos este mes</p> : (
            <div className="space-y-2">
              {egresos.map(e => (
                <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {e.es_costo_financiero
                          ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Costo financiero</span>
                          : e.punto?.nombre && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.punto.nombre}</span>
                        }
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{e.concepto}</p>
                      <p className="text-xs text-gray-400">{e.fecha}</p>
                    </div>
                    <div className="ml-2 text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-700">{fmt(e.valor)}</p>
                      <div className="flex gap-2 justify-end mt-1">
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
      </div>
    </div>
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
export default function PanelFinanciero() {
  const [tab, setTab] = useState('movimientos')

  const tabs = [
    { key: 'movimientos', label: 'Movimientos' },
    { key: 'providentes', label: 'Providentes' },
    { key: 'equipo', label: 'Equipo' },
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

      {tab === 'movimientos' && <TabMovimientos />}
      {tab === 'providentes' && <TabProvidentes />}
      {tab === 'equipo' && <TabEquipo />}
    </div>
  )
}
