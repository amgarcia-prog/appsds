import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../../config.js'

const H = { 'x-cio-key': 'CIO2026', 'Content-Type': 'application/json' }

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0)
const fmtFecha = (f) => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-CO') : ''
const horasTotal = (registros) => (registros || []).reduce((s, r) => s + (r.horas || 0), 0).toFixed(1)
const facturadoTotal = (items) => (items || []).reduce((s, i) => s + Number(i.valor_facturado || 0), 0)
const valorProductos = (productos) => (productos || []).reduce((s, p) => s + Number(p.valor || 0), 0)

const recargarProyectos = async (clienteId) => {
  const data = await fetch(`${API_URL}/api/cio/proyectos/${clienteId}`, { headers: H }).then(r => r.json())
  return Array.isArray(data) ? data : []
}

export default function PanelCIO() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [clienteSel, setClienteSel] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [proyectoSel, setProyectoSel] = useState(null)
  const [vista, setVista] = useState('clientes')
  const [mensaje, setMensaje] = useState('')

  const [modalCliente, setModalCliente] = useState(null)
  const [modalProyecto, setModalProyecto] = useState(null)
  const [modalProducto, setModalProducto] = useState(null)
  const [modalItem, setModalItem] = useState(null)
  const [modalTiempo, setModalTiempo] = useState(null)

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  useEffect(() => { cargarClientes() }, [])

  const cargarClientes = async () => {
    const data = await fetch(`${API_URL}/api/cio/clientes`, { headers: H }).then(r => r.json())
    setClientes(Array.isArray(data) ? data : [])
  }

  const refrescar = async () => {
    if (!clienteSel) return []
    const data = await recargarProyectos(clienteSel.id)
    setProyectos(data)
    return data
  }

  const refrescarYSincronizar = async () => {
    const data = await refrescar()
    if (proyectoSel) {
      const p = data.find(x => x.id === proyectoSel.id)
      if (p) setProyectoSel(p)
    }
    return data
  }

  const seleccionarCliente = async (c) => {
    setClienteSel(c)
    setProyectoSel(null)
    setVista('proyectos')
    const data = await recargarProyectos(c.id)
    setProyectos(data)
  }

  const seleccionarProyecto = (p) => {
    setProyectoSel(p)
    setVista('proyecto')
  }

  // CRUD clientes
  const guardarCliente = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/clientes/${form.id}` : `${API_URL}/api/cio/clientes`
    const res = await fetch(url, { method: form.id ? 'PUT' : 'POST', headers: H, body: JSON.stringify(form) }).then(r => r.json())
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
    const body = { ...form, cliente_id: clienteSel.id }
    const res = await fetch(url, { method: form.id ? 'PUT' : 'POST', headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) { await refrescar(); setModalProyecto(null); msg('✅ Proyecto guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarProyecto = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    const res = await fetch(`${API_URL}/api/cio/proyectos/${id}`, { method: 'DELETE', headers: H }).then(r => r.json())
    if (res.ok) { await refrescar(); setVista('proyectos'); setProyectoSel(null); msg('✅ Proyecto eliminado') }
  }

  // CRUD productos
  const guardarProducto = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/productos/${form.id}` : `${API_URL}/api/cio/productos`
    const body = { ...form, proyecto_id: proyectoSel.id }
    const res = await fetch(url, { method: form.id ? 'PUT' : 'POST', headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) { await refrescarYSincronizar(); setModalProducto(null); msg('✅ Producto guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto/servicio?')) return
    await fetch(`${API_URL}/api/cio/productos/${id}`, { method: 'DELETE', headers: H })
    await refrescarYSincronizar()
    msg('✅ Producto eliminado')
  }

  // CRUD items facturación
  const guardarItem = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/items/${form.id}` : `${API_URL}/api/cio/items`
    const body = { ...form, proyecto_id: proyectoSel.id }
    const res = await fetch(url, { method: form.id ? 'PUT' : 'POST', headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) { await refrescarYSincronizar(); setModalItem(null); msg('✅ Item guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarItem = async (id) => {
    if (!confirm('¿Eliminar este item?')) return
    await fetch(`${API_URL}/api/cio/items/${id}`, { method: 'DELETE', headers: H })
    await refrescarYSincronizar()
    msg('✅ Item eliminado')
  }

  // CRUD tiempo
  const guardarTiempo = async (form) => {
    const url = form.id ? `${API_URL}/api/cio/tiempo/${form.id}` : `${API_URL}/api/cio/tiempo`
    const body = { ...form, proyecto_id: proyectoSel.id }
    const res = await fetch(url, { method: form.id ? 'PUT' : 'POST', headers: H, body: JSON.stringify(body) }).then(r => r.json())
    if (res.ok) { await refrescarYSincronizar(); setModalTiempo(null); msg('✅ Registro guardado') }
    else msg('❌ ' + (res.mensaje || 'Error'))
  }

  const eliminarTiempo = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`${API_URL}/api/cio/tiempo/${id}`, { method: 'DELETE', headers: H })
    await refrescarYSincronizar()
    msg('✅ Registro eliminado')
  }

  const productos = proyectoSel?.cio_productos || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-3 px-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
              <button onClick={() => setModalProyecto({ concepto: '' })}
                className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-800">
                + Nuevo proyecto
              </button>
            </div>
            <div className="space-y-3">
              {proyectos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10 bg-white rounded-lg border border-gray-200">No hay proyectos</p>
              ) : proyectos.map(p => {
                const facturado = facturadoTotal(p.cio_items_facturacion)
                const contratado = valorProductos(p.cio_productos)
                const horas = horasTotal(p.cio_registros_tiempo)
                return (
                  <div key={p.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <button onClick={() => seleccionarProyecto(p)} className="text-left flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{p.concepto}</p>
                        <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                          {p.fecha_inicio && <span>Inicio: <span className="font-medium text-gray-700">{fmtFecha(p.fecha_inicio)}</span></span>}
                          <span>Contratado: <span className="font-medium text-gray-700">{fmt(contratado)}</span></span>
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
            {/* Totales */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Fecha de inicio', valor: proyectoSel.fecha_inicio ? fmtFecha(proyectoSel.fecha_inicio) : '—', color: 'text-gray-700' },
                { label: 'Valor contratado', valor: fmt(valorProductos(proyectoSel.cio_productos)), color: 'text-blue-700' },
                { label: 'Total facturado', valor: fmt(facturadoTotal(proyectoSel.cio_items_facturacion)), color: 'text-green-700' },
                { label: 'Horas estimadas', valor: (() => { const t = (proyectoSel.cio_productos || []).reduce((s, p) => s + (p.horas_estimadas || 0), 0); return t > 0 ? t + 'h' : '—' })(), color: 'text-orange-600' },
                { label: 'Horas dedicadas', valor: horasTotal(proyectoSel.cio_registros_tiempo) + 'h', color: 'text-purple-700' },
              ].map(({ label, valor, color }) => (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <p className={`text-lg font-bold ${color}`}>{valor}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Productos / Servicios */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Productos / Servicios
                  <span className="ml-2 text-blue-700 font-bold">{fmt(valorProductos(productos))}</span>
                </p>
                <button onClick={() => setModalProducto({ concepto: '', valor: '' })}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                  + Agregar
                </button>
              </div>
              {productos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin productos registrados</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Concepto</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Valor</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">H. estimadas</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">H. consumidas</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productos.map(prod => {
                      const horasProd = parseFloat(horasTotal((proyectoSel.cio_registros_tiempo || []).filter(r => r.producto_id === prod.id)))
                      const excedido = prod.horas_estimadas && horasProd > prod.horas_estimadas
                      return (
                        <tr key={prod.id}>
                          <td className="px-4 py-2 text-gray-800 font-medium">{prod.concepto}</td>
                          <td className="px-4 py-2 text-right text-blue-700 font-medium">{fmt(prod.valor)}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{prod.horas_estimadas ? `${prod.horas_estimadas}h` : '—'}</td>
                          <td className={`px-4 py-2 text-right font-medium ${excedido ? 'text-red-600' : 'text-purple-600'}`}>
                            {horasProd}h{excedido ? ' ⚠️' : ''}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => setModalProducto(prod)} className="text-xs text-blue-500 hover:underline mr-2">Editar</button>
                            <button onClick={() => eliminarProducto(prod.id)} className="text-xs text-red-500 hover:underline">✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Resumen por producto */}
            {(proyectoSel.cio_registros_tiempo || []).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">
                  Consumo de tiempo por producto
                </p>
                <div className="px-4 py-3 space-y-3">
                  {(() => {
                    const totalHoras = parseFloat(horasTotal(proyectoSel.cio_registros_tiempo))
                    const grupos = {}
                    ;(proyectoSel.cio_registros_tiempo || []).forEach(r => {
                      const key = r.producto_id || '__sin__'
                      if (!grupos[key]) grupos[key] = 0
                      grupos[key] += r.horas || 0
                    })
                    const filas = [
                      ...productos.map(p => ({
                        label: p.concepto,
                        horas: grupos[p.id] || 0,
                        estimadas: p.horas_estimadas || 0,
                        color: 'bg-blue-500'
                      })),
                      ...(grupos['__sin__'] ? [{ label: 'Sin producto asignado', horas: grupos['__sin__'], estimadas: 0, color: 'bg-gray-300' }] : [])
                    ].filter(f => f.horas > 0)

                    return filas.map((f, i) => {
                      const tieneEstimado = f.estimadas > 0
                      const pctBarra = tieneEstimado
                        ? Math.min(Math.round((f.horas / f.estimadas) * 100), 100)
                        : totalHoras > 0 ? Math.round((f.horas / totalHoras) * 100) : 0
                      const pctReal = tieneEstimado ? Math.round((f.horas / f.estimadas) * 100) : null
                      const excedido = tieneEstimado && f.horas > f.estimadas
                      const barColor = excedido ? 'bg-red-500' : tieneEstimado ? 'bg-blue-500' : 'bg-purple-400'
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 truncate flex-1 mr-4">{f.label}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-semibold text-purple-700">{f.horas.toFixed(1)}h</span>
                              {tieneEstimado && (
                                <span className="text-xs text-gray-400">de {f.estimadas}h</span>
                              )}
                              {pctReal !== null && (
                                <span className={`text-xs font-semibold w-14 text-right ${excedido ? 'text-red-600' : 'text-gray-500'}`}>
                                  {pctReal}%{excedido ? ' ⚠️' : ''}
                                </span>
                              )}
                              {pctReal === null && (
                                <span className="text-xs text-gray-400 w-8 text-right">{pctBarra}%</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pctBarra}%` }} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {/* Items facturación */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facturación</p>
                <button onClick={() => setModalItem({ fecha_facturacion: '', valor_facturado: '', descripcion: '' })}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
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
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Registro de tiempo — <span className="text-purple-700">{horasTotal(proyectoSel.cio_registros_tiempo)}h total</span>
                </p>
                <button onClick={() => setModalTiempo({ fecha: new Date().toISOString().slice(0, 10), hora_inicio: '', hora_fin: '', con_quien: '', actividad: '', producto_id: '' })}
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
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Producto</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Con quién</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Actividad</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...(proyectoSel.cio_registros_tiempo || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(r => {
                      const prod = productos.find(p => p.id === r.producto_id)
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fmtFecha(r.fecha)}</td>
                          <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{r.hora_inicio} – {r.hora_fin}</td>
                          <td className="px-4 py-2 text-center font-medium text-purple-700">{r.horas}h</td>
                          <td className="px-4 py-2 text-xs text-blue-700">{prod ? prod.concepto : '—'}</td>
                          <td className="px-4 py-2 text-gray-700">{r.con_quien || '—'}</td>
                          <td className="px-4 py-2 text-gray-700 max-w-xs truncate">{r.actividad || '—'}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button onClick={() => setModalTiempo(r)} className="text-xs text-blue-500 hover:underline mr-2">Editar</button>
                            <button onClick={() => eliminarTiempo(r.id)} className="text-xs text-red-500 hover:underline">✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {modalCliente && (
        <Modal titulo={modalCliente.id ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModalCliente(null)}>
          <FormCliente initial={modalCliente} onGuardar={guardarCliente} />
        </Modal>
      )}
      {modalProyecto && (
        <Modal titulo={modalProyecto.id ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={() => setModalProyecto(null)}>
          <FormProyecto initial={modalProyecto} onGuardar={guardarProyecto} />
        </Modal>
      )}
      {modalProducto && (
        <Modal titulo={modalProducto.id ? 'Editar producto/servicio' : 'Nuevo producto/servicio'} onClose={() => setModalProducto(null)}>
          <FormProducto initial={modalProducto} onGuardar={guardarProducto} />
        </Modal>
      )}
      {modalItem && (
        <Modal titulo={modalItem.id ? 'Editar facturación' : 'Nueva facturación'} onClose={() => setModalItem(null)}>
          <FormItem initial={modalItem} onGuardar={guardarItem} />
        </Modal>
      )}
      {modalTiempo && (
        <Modal titulo={modalTiempo.id ? 'Editar registro de tiempo' : 'Registrar tiempo'} onClose={() => setModalTiempo(null)}>
          <FormTiempo initial={modalTiempo} productos={productos} onGuardar={guardarTiempo} />
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
        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de inicio</label>
        <input type="date" value={form.fecha_inicio || ''} onChange={e => set('fecha_inicio', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <p className="text-xs text-gray-400">El valor total del proyecto se calcula automáticamente a partir de los productos/servicios.</p>
      <button onClick={() => onGuardar(form)} disabled={!form.concepto}
        className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
        Guardar
      </button>
    </div>
  )
}

function FormProducto({ initial, onGuardar }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Concepto *</label>
        <input value={form.concepto} onChange={e => set('concepto', e.target.value)}
          placeholder="Nombre del producto o servicio..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Valor (0 si es sin costo)</label>
          <input type="number" value={form.valor} onChange={e => set('valor', e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Horas estimadas</label>
          <input type="number" step="0.5" value={form.horas_estimadas || ''} onChange={e => set('horas_estimadas', e.target.value)}
            placeholder="Opcional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
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

function FormTiempo({ initial, productos, onGuardar }) {
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
        <label className="block text-xs font-medium text-gray-600 mb-1">Producto / Servicio</label>
        <select value={form.producto_id} onChange={e => set('producto_id', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Sin especificar —</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.concepto}</option>)}
        </select>
      </div>
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
