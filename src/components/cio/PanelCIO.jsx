import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../../config.js'

const H = { 'x-cio-key': 'CIO2026', 'Content-Type': 'application/json' }

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0)
const fmtFecha = (f) => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-CO') : ''
const horasTotal = (registros) => (registros || []).reduce((s, r) => s + (r.horas || 0), 0).toFixed(1)
const facturadoTotal = (items) => (items || []).reduce((s, i) => s + (i.valor_facturado || 0), 0)

export default function PanelCIO() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [clienteSel, setClienteSel] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [proyectoSel, setProyectoSel] = useState(null)
  const [vista, setVista] = useState('clientes') // clientes | proyecto
  const [mensaje, setMensaje] = useState('')

  // Modales / forms
  const [modalCliente, setModalCliente] = useState(null) // null | {nit, nombre} | cliente
  const [modalProyecto, setModalProyecto] = useState(null)
  const [modalItem, setModalItem] = useState(null)
  const [modalTiempo, setModalTiempo] = useState(null)

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  useEffect(() => { cargarClientes() }, [])

  const cargarClientes = async () => {
    const data = await fetch(`${API_URL}/api/cio/clientes`, { headers: H }).then(r => r.json())
    setClientes(Array.isArray(data) ? data : [])
  }

  const cargarProyectos = async (clienteId) => {
    const data = await fetch(`${API_URL}/api/cio/proyectos/${clienteId}`, { headers: H }).then(r => r.json())
    setProyectos(Array.isArray(data) ? data : [])
  }

  const seleccionarCliente = (c) => {
    setClienteSel(c)
    setProyectoSel(null)
    setVista('proyectos')
    cargarProyectos(c.id)
  }

  const seleccionarProyecto = (p) => {
    setProyectoSel(p)
    setVista('proyecto')
  }

  const refrescarProyecto = async () => {
    await cargarProyectos(clienteSel.id)
  }

  // CRUD clientes
  const guardarCliente = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/clientes/${form.id}` : `${API_URL}/api/cio/clientes`
    const method = form.id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: H, body: JSON.stringify(form) }).then(r => r.json())
    if (res.ok) { await cargarClientes(); setModalCliente(null); msg('✅ Cliente guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente y todos sus proyectos?')) return
    const res = await fetch(`${API_URL}/api/cio/clientes/${id}`, { method: 'DELETE', headers: H }).then(r => r.json())
    if (res.ok) { await cargarClientes(); msg('✅ Cliente eliminado') }
  }

  // CRUD proyectos
  const guardarProyecto = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/proyectos/${form.id}` : `${API_URL}/api/cio/proyectos`
    const method = form.id ? 'PUT' : 'POST'
    const body = { ...form, cliente_id: clienteSel.id }
    const res = await fetch(url, { method, headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) { await cargarProyectos(clienteSel.id); setModalProyecto(null); msg('✅ Proyecto guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarProyecto = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    const res = await fetch(`${API_URL}/api/cio/proyectos/${id}`, { method: 'DELETE', headers: H }).then(r => r.json())
    if (res.ok) { await cargarProyectos(clienteSel.id); setVista('proyectos'); setProyectoSel(null); msg('✅ Proyecto eliminado') }
  }

  // CRUD items
  const guardarItem = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/items/${form.id}` : `${API_URL}/api/cio/items`
    const method = form.id ? 'PUT' : 'POST'
    const body = { ...form, proyecto_id: proyectoSel.id }
    const res = await fetch(url, { method, headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) {
      await refrescarProyecto()
      const updated = (await fetch(`${API_URL}/api/cio/proyectos/${clienteSel.id}`, { headers: H }).then(r => r.json()))
      const p = updated.find(x => x.id === proyectoSel.id)
      if (p) setProyectoSel(p)
      setModalItem(null); msg('✅ Item guardado')
    } else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarItem = async (id) => {
    if (!confirm('¿Eliminar este item?')) return
    await fetch(`${API_URL}/api/cio/items/${id}`, { method: 'DELETE', headers: H })
    const updated = await fetch(`${API_URL}/api/cio/proyectos/${clienteSel.id}`, { headers: H }).then(r => r.json())
    const p = updated.find(x => x.id === proyectoSel.id)
    if (p) setProyectoSel(p)
    setProyectos(updated)
    msg('✅ Item eliminado')
  }

  // CRUD tiempo
  const guardarTiempo = async (form) => {
    const body = { ...form, proyecto_id: proyectoSel.id }
    const res = await fetch(`${API_URL}/api/cio/tiempo`, { method: 'POST', headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) {
      const updated = await fetch(`${API_URL}/api/cio/proyectos/${clienteSel.id}`, { headers: H }).then(r => r.json())
      const p = updated.find(x => x.id === proyectoSel.id)
      if (p) setProyectoSel(p)
      setProyectos(updated)
      setModalTiempo(null); msg('✅ Registro guardado')
    } else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarTiempo = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`${API_URL}/api/cio/tiempo/${id}`, { method: 'DELETE', headers: H })
    const updated = await fetch(`${API_URL}/api/cio/proyectos/${clienteSel.id}`, { headers: H }).then(r => r.json())
    const p = updated.find(x => x.id === proyectoSel.id)
    if (p) setProyectoSel(p)
    setProyectos(updated)
    msg('✅ Registro eliminado')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-3 px-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-bold">CIO — Business Process Transformation</h1>
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <button onClick={() => { setVista('clientes'); setClienteSel(null); setProyectoSel(null) }}
                  className="hover:text-white">Clientes</button>
                {clienteSel && <>
                  <span>›</span>
                  <button onClick={() => { setVista('proyectos'); setProyectoSel(null) }}
                    className="hover:text-white">{clienteSel.nombre}</button>
                </>}
                {proyectoSel && <>
                  <span>›</span>
                  <span className="text-white">{proyectoSel.concepto}</span>
                </>}
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('cio_sesion'); navigate('/cio/login') }}
            className="text-xs text-blue-200 hover:text-white">Cerrar sesión</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {mensaje && <p className="text-sm text-center py-2 bg-white border rounded-lg mb-4">{mensaje}</p>}

        {/* ── CLIENTES ── */}
        {vista === 'clientes' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-blue-800 text-lg">Clientes</h2>
              <button onClick={() => setModalCliente({ nit: '', nombre: '' })}
                className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-800">
                + Nuevo cliente
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {clientes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No hay clientes registrados</p>
              ) : clientes.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <button onClick={() => seleccionarCliente(c)} className="text-left flex-1">
                    <p className="font-medium text-gray-800">{c.nombre}</p>
                    {c.nit && <p className="text-xs text-gray-400">NIT: {c.nit}</p>}
                  </button>
                  <div className="flex gap-3 ml-4">
                    <button onClick={() => setModalCliente(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminarCliente(c.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PROYECTOS ── */}
        {vista === 'proyectos' && clienteSel && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-blue-800 text-lg">Proyectos — {clienteSel.nombre}</h2>
              <button onClick={() => setModalProyecto({ concepto: '', valor_contratado: '' })}
                className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-800">
                + Nuevo proyecto
              </button>
            </div>
            <div className="space-y-3">
              {proyectos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10 bg-white rounded-lg border border-gray-200">No hay proyectos</p>
              ) : proyectos.map(p => {
                const facturado = facturadoTotal(p.cio_items_facturacion)
                const horas = horasTotal(p.cio_registros_tiempo)
                return (
                  <div key={p.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <button onClick={() => seleccionarProyecto(p)} className="text-left flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{p.concepto}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Contratado: <span className="font-medium text-gray-700">{fmt(p.valor_contratado)}</span></span>
                          <span>Facturado: <span className="font-medium text-green-700">{fmt(facturado)}</span></span>
                          <span>Horas: <span className="font-medium text-blue-700">{horas}h</span></span>
                        </div>
                      </button>
                      <div className="flex gap-3 ml-4">
                        <button onClick={() => setModalProyecto(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => eliminarProyecto(p.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── DETALLE PROYECTO ── */}
        {vista === 'proyecto' && proyectoSel && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Valor contratado', valor: fmt(proyectoSel.valor_contratado), color: 'text-blue-700' },
                { label: 'Total facturado', valor: fmt(facturadoTotal(proyectoSel.cio_items_facturacion)), color: 'text-green-700' },
                { label: 'Horas dedicadas', valor: horasTotal(proyectoSel.cio_registros_tiempo) + 'h', color: 'text-purple-700' },
              ].map(({ label, valor, color }) => (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <p className={`text-xl font-bold ${color}`}>{valor}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Items facturación */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facturación</p>
                <button onClick={() => setModalItem({ fecha_facturacion: '', valor_facturado: '', descripcion: '' })}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                  + Agregar
                </button>
              </div>
              {(proyectoSel.cio_items_facturacion || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin registros de facturación</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Descripción</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Fecha</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Valor</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {proyectoSel.cio_items_facturacion.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-gray-700">{item.descripcion || '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{fmtFecha(item.fecha_facturacion)}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-700">{fmt(item.valor_facturado)}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => setModalItem(item)} className="text-xs text-blue-500 hover:underline mr-2">Editar</button>
                          <button onClick={() => eliminarItem(item.id)} className="text-xs text-red-500 hover:underline">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Registros de tiempo */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro de tiempo</p>
                <button onClick={() => setModalTiempo({ fecha: '', hora_inicio: '', hora_fin: '', con_quien: '', actividad: '' })}
                  className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">
                  + Registrar
                </button>
              </div>
              {(proyectoSel.cio_registros_tiempo || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin registros de tiempo</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Fecha</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Horario</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Horas</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Con quién</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Actividad</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...(proyectoSel.cio_registros_tiempo || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(r => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fmtFecha(r.fecha)}</td>
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{r.hora_inicio} – {r.hora_fin}</td>
                        <td className="px-4 py-2 text-center font-medium text-purple-700">{r.horas}h</td>
                        <td className="px-4 py-2 text-gray-700">{r.con_quien || '—'}</td>
                        <td className="px-4 py-2 text-gray-700 max-w-xs truncate">{r.actividad || '—'}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => eliminarTiempo(r.id)} className="text-xs text-red-500 hover:underline">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Cliente */}
      {modalCliente && (
        <Modal titulo={modalCliente.id ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModalCliente(null)}>
          <FormCliente initial={modalCliente} onGuardar={guardarCliente} />
        </Modal>
      )}

      {/* Modal Proyecto */}
      {modalProyecto && (
        <Modal titulo={modalProyecto.id ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={() => setModalProyecto(null)}>
          <FormProyecto initial={modalProyecto} onGuardar={guardarProyecto} />
        </Modal>
      )}

      {/* Modal Item */}
      {modalItem && (
        <Modal titulo={modalItem.id ? 'Editar facturación' : 'Nueva facturación'} onClose={() => setModalItem(null)}>
          <FormItem initial={modalItem} onGuardar={guardarItem} />
        </Modal>
      )}

      {/* Modal Tiempo */}
      {modalTiempo && (
        <Modal titulo="Registrar tiempo" onClose={() => setModalTiempo(null)}>
          <FormTiempo initial={modalTiempo} onGuardar={guardarTiempo} />
        </Modal>
      )}
    </div>
  )
}

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormCliente({ initial, onGuardar }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
        <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">NIT</label>
        <input value={form.nit} onChange={e => set('nit', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button onClick={() => onGuardar(form)} disabled={!form.nombre}
        className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
        Guardar
      </button>
    </div>
  )
}

function FormProyecto({ initial, onGuardar }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Concepto / descripción *</label>
        <input value={form.concepto} onChange={e => set('concepto', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Valor contratado</label>
        <input type="number" value={form.valor_contratado} onChange={e => set('valor_contratado', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button onClick={() => onGuardar(form)} disabled={!form.concepto}
        className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
        Guardar
      </button>
    </div>
  )
}

function FormItem({ initial, onGuardar }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
        <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de facturación</label>
        <input type="date" value={form.fecha_facturacion} onChange={e => set('fecha_facturacion', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Valor facturado</label>
        <input type="number" value={form.valor_facturado} onChange={e => set('valor_facturado', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button onClick={() => onGuardar(form)}
        className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
        Guardar
      </button>
    </div>
  )
}

function FormTiempo({ initial, onGuardar }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const horas = form.hora_inicio && form.hora_fin ? (() => {
    const [h1, m1] = form.hora_inicio.split(':').map(Number)
    const [h2, m2] = form.hora_fin.split(':').map(Number)
    const diff = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60
    return diff > 0 ? diff.toFixed(1) + 'h' : null
  })() : null

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha *</label>
        <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio *</label>
          <input type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin *</label>
          <input type="time" value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {horas && <p className="text-xs text-purple-700 font-medium">⏱ {horas} calculadas</p>}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Con quién</label>
        <input value={form.con_quien} onChange={e => set('con_quien', e.target.value)}
          placeholder="Nombre(s) de participantes..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Actividad realizada</label>
        <textarea value={form.actividad} onChange={e => set('actividad', e.target.value)} rows={3}
          placeholder="Describe la actividad..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <button onClick={() => onGuardar(form)} disabled={!form.fecha || !form.hora_inicio || !form.hora_fin}
        className="w-full bg-purple-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-800 disabled:opacity-50">
        Guardar
      </button>
    </div>
  )
}
