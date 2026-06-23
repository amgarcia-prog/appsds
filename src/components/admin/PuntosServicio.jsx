import { useState, useEffect } from 'react'
import API_URL from '../../config.js'

const PAISES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'España', 'Estados Unidos', 'México',
  'Paraguay', 'Perú', 'Uruguay', 'Venezuela'
]

const DEPARTAMENTOS = {
  Colombia: ['Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá','Cundinamarca','Huila','Meta','Norte de Santander','Risaralda','Santander','Tolima','Valle del Cauca'],
  Ecuador: ['Pichincha'],
  Chile: ['Región Metropolitana'],
  España: ['Aragón','Comunidad de Madrid','Galicia'],
  'Estados Unidos': ['Florida','New Jersey','Texas','Utah'],
  México: ['Ciudad de México','Nuevo León'],
  Paraguay: ['Guairá'],
  Perú: ['Lima'],
  Venezuela: ['Lara'],
  'Costa Rica': ['San José'],
  Argentina: [],
  Bolivia: [],
  Uruguay: [],
}

const VACIO = { pais: '', departamento: '', ciudad: '', nombre: '', activo: true }

export default function PuntosServicio() {
  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [filtroPais, setFiltroPais] = useState('')
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/puntos-servicio`, {
        headers: { 'x-admin-key': 'SDS2026admin' }
      })
      const data = await res.json()
      setPuntos(data)
    } catch (e) { console.error(e) }
    setCargando(false)
  }

  const mostrarMensaje = (msg) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  const guardar = async () => {
    if (!form.pais || !form.ciudad || !form.nombre) {
      mostrarMensaje('⚠️ País, ciudad y nombre son obligatorios')
      return
    }
    setGuardando(true)
    try {
      const url = editandoId
        ? `${API_URL}/api/admin/puntos-servicio/${editandoId}`
        : `${API_URL}/api/admin/puntos-servicio`
      const method = editandoId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'SDS2026admin' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        mostrarMensaje(editandoId ? '✅ Punto actualizado' : '✅ Punto agregado')
        setForm(VACIO)
        setEditandoId(null)
        cargar()
      } else {
        mostrarMensaje('❌ Error al guardar')
      }
    } catch { mostrarMensaje('❌ Error de conexión') }
    setGuardando(false)
  }

  const editar = (punto) => {
    setForm({ pais: punto.pais, departamento: punto.departamento || '', ciudad: punto.ciudad, nombre: punto.nombre, activo: punto.activo })
    setEditandoId(punto.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminar = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/puntos-servicio/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'SDS2026admin' },
      })
      const data = await res.json()
      if (data.ok) { mostrarMensaje('✅ Punto eliminado'); cargar() }
      else mostrarMensaje('❌ Error al eliminar')
    } catch { mostrarMensaje('❌ Error de conexión') }
    setConfirmEliminar(null)
  }

  const cancelar = () => { setForm(VACIO); setEditandoId(null) }

  const puntosFiltrados = puntos.filter(p => {
    const coincidePais = !filtroPais || p.pais === filtroPais
    const coincideCiudad = !filtroCiudad || p.ciudad?.toLowerCase().includes(filtroCiudad.toLowerCase())
    return coincidePais && coincideCiudad
  })

  const deptos = DEPARTAMENTOS[form.pais] || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-blue-800 mb-4">Puntos de Servicio</h2>

      {mensaje && (
        <div className="mb-4 text-sm text-center py-2 bg-white border rounded-lg">{mensaje}</div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">
          {editandoId ? 'Editar punto de servicio' : 'Agregar nuevo punto de servicio'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">País *</label>
            <select value={form.pais}
              onChange={e => setForm(f => ({ ...f, pais: e.target.value, departamento: '' }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Selecciona...</option>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Departamento / Estado</label>
            {deptos.length > 0 ? (
              <select value={form.departamento}
                onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Selecciona...</option>
                {deptos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input type="text" value={form.departamento}
                onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                placeholder="Escribe el departamento"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad *</label>
            <input type="text" value={form.ciudad}
              onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
              placeholder="Ej: Medellín"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del punto *</label>
            <input type="text" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Patio Adultos San Benito"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="w-4 h-4 text-blue-600" />
            Punto activo (visible en el formulario)
          </label>
          <button onClick={guardar} disabled={guardando}
            className="bg-blue-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-900 disabled:opacity-50">
            {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Agregar'}
          </button>
          {editandoId && (
            <button onClick={cancelar}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-3">
        <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos los países</option>
          {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="text" value={filtroCiudad} onChange={e => setFiltroCiudad(e.target.value)}
          placeholder="Filtrar por ciudad..."
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <span className="text-sm text-gray-500 self-center">{puntosFiltrados.length} punto(s)</span>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-8 text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">País</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ciudad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre del punto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {puntosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay puntos</td></tr>
              ) : puntosFiltrados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{p.pais}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{p.ciudad}</p>
                    {p.departamento && <p className="text-xs text-gray-400">{p.departamento}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => editar(p)}
                        className="text-blue-600 hover:underline text-xs font-medium">
                        Editar
                      </button>
                      {confirmEliminar === p.id ? (
                        <span className="flex items-center gap-2">
                          <button onClick={() => eliminar(p.id)}
                            className="text-red-600 hover:underline text-xs font-medium">
                            Confirmar
                          </button>
                          <button onClick={() => setConfirmEliminar(null)}
                            className="text-gray-400 hover:underline text-xs">
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmEliminar(p.id)}
                          className="text-red-500 hover:underline text-xs">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
