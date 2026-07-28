import { useState } from 'react'
import API_URL from '../config.js'

const ANIO = new Date().getFullYear()

const PREGUNTAS_AUTO = [
  { key: 'p1', texto: 'Participo de manera regular en las reuniones de la junta de pilares.' },
  { key: 'p2', texto: 'Cuando se me asigna una tarea o compromiso, lo atiendo oportunamente.' },
  { key: 'p3', texto: 'Hago seguimiento activo a las ciudades que tengo a mi cargo.' },
]

const PREGUNTAS_OTRO = [
  { key: 'p1', texto: 'Participa de manera regular en las reuniones de la junta de pilares.' },
  { key: 'p2', texto: 'Cuando se le asigna una tarea o compromiso, lo atiende oportunamente.' },
  { key: 'p3', texto: 'Hace seguimiento activo a las ciudades que tiene a su cargo.' },
]

const ESCALA = [1, 2, 3, 4, 5]
const ESCALA_LABEL = { 1: 'Nunca', 2: 'Casi nunca', 3: 'A veces', 4: 'Casi siempre', 5: 'Siempre' }

function PuntajeSelector({ valor, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {ESCALA.map(n => (
        <button key={n} onClick={() => onChange(n)}
          className={`flex flex-col items-center w-16 py-2 rounded-lg border transition-colors ${valor === n ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
          <span className="text-base font-bold">{n}</span>
          <span className={`text-xs mt-0.5 leading-tight text-center ${valor === n ? 'text-blue-100' : 'text-gray-400'}`}>{ESCALA_LABEL[n]}</span>
        </button>
      ))}
    </div>
  )
}

function FormularioEvaluacion({ pilar, esAuto, preguntas, respuestas, onChange }) {
  return (
    <div className="space-y-5">
      {preguntas.map(p => (
        <div key={p.key}>
          <p className="text-sm text-gray-700">{p.texto}</p>
          <PuntajeSelector valor={respuestas[p.key]} onChange={v => onChange(p.key, v)} />
        </div>
      ))}
    </div>
  )
}

export default function Evaluacion() {
  const [paso, setPaso] = useState('login') // login | evaluando | gracias | resultados
  const [usuario, setUsuario] = useState(null)
  const [pilares, setPilares] = useState([])
  const [indice, setIndice] = useState(0) // 0 = autoevaluación, 1..N = otros pilares
  const [evaluaciones, setEvaluaciones] = useState([])
  const [respActual, setRespActual] = useState({ p1: 0, p2: 0, p3: 0 })
  const [form, setForm] = useState({ numero: '', clave: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resultados, setResultados] = useState(null)

  const login = async () => {
    setError('')
    const res = await fetch(`${API_URL}/api/evaluacion/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_identificacion: form.numero, clave: form.clave })
    })
    const data = await res.json()
    if (!data.ok) { setError(data.mensaje); return }

    // verificar si ya evaluó
    const check = await fetch(`${API_URL}/api/evaluacion/ya-evaluo?anio=${ANIO}&evaluador_id=${data.id}`)
    const checkData = await check.json()
    if (checkData.ya_evaluo) {
      setUsuario(data)
      setPaso('gracias')
      return
    }

    const pRes = await fetch(`${API_URL}/api/evaluacion/pilares`)
    const pData = await pRes.json()
    const otrosPilares = pData.filter(p => p.id !== data.id)

    setUsuario(data)
    setPilares(otrosPilares)
    setIndice(0)
    setRespActual({ p1: 0, p2: 0, p3: 0 })
    setEvaluaciones([])
    setPaso('evaluando')
  }

  const pilarActual = indice === 0 ? usuario : pilares[indice - 1]
  const esAuto = indice === 0
  const totalPasos = 1 + pilares.length

  const siguiente = () => {
    if (!respActual.p1 || !respActual.p2 || !respActual.p3) {
      setError('Responde las 3 preguntas antes de continuar.')
      return
    }
    setError('')
    const nuevaEval = {
      evaluado_id: pilarActual.id,
      es_autoevaluacion: esAuto,
      p1: respActual.p1, p2: respActual.p2, p3: respActual.p3
    }
    const nuevasEvals = [...evaluaciones, nuevaEval]
    setEvaluaciones(nuevasEvals)

    if (indice < totalPasos - 1) {
      setIndice(indice + 1)
      setRespActual({ p1: 0, p2: 0, p3: 0 })
    } else {
      enviar(nuevasEvals)
    }
  }

  const enviar = async (evals) => {
    setGuardando(true)
    await fetch(`${API_URL}/api/evaluacion/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio: ANIO, evaluador_id: usuario.id, evaluaciones: evals })
    })
    setGuardando(false)
    setPaso('gracias')
  }

  const verResultados = async () => {
    const res = await fetch(`${API_URL}/api/evaluacion/resultados?anio=${ANIO}&id=${usuario.id}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      // agrupar por evaluado
      const mapa = {}
      data.forEach(e => {
        const key = e.evaluado_id
        if (!mapa[key]) mapa[key] = { nombre: `${e.evaluado.primer_nombre} ${e.evaluado.primer_apellido}`, p1: [], p2: [], p3: [], auto: null }
        const entry = { p1: e.p1_reuniones, p2: e.p2_compromisos, p3: e.p3_seguimiento }
        if (e.es_autoevaluacion) mapa[key].auto = entry
        else { mapa[key].p1.push(e.p1_reuniones); mapa[key].p2.push(e.p2_compromisos); mapa[key].p3.push(e.p3_seguimiento) }
      })
      setResultados(mapa)
      setPaso('resultados')
    } else {
      setError(data.mensaje || 'No tienes permiso para ver los resultados.')
    }
  }

  const prom = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '-'

  if (paso === 'login') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-blue-800 mb-1 text-center">Evaluación de Pilares {ANIO}</h1>
        <p className="text-xs text-gray-500 text-center mb-6">Ingresa con tu número de identificación y clave</p>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <div className="space-y-3">
          <input type="text" placeholder="Número de identificación" value={form.numero}
            onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="Clave" value={form.clave}
            onChange={e => setForm(f => ({ ...f, clave: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={login} className="w-full bg-blue-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-900">
            Ingresar
          </button>
        </div>
      </div>
    </div>
  )

  if (paso === 'evaluando') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-400">{indice + 1} de {totalPasos}</p>
          <p className="text-xs text-gray-400">{ANIO}</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${((indice) / totalPasos) * 100}%` }} />
        </div>
        <h2 className="text-base font-bold text-blue-800 mb-1">
          {esAuto ? 'Autoevaluación' : `Evaluación de ${[pilarActual?.primer_nombre, pilarActual?.segundo_nombre, pilarActual?.primer_apellido].filter(Boolean).join(' ')}`}
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          {esAuto ? 'Evalúate a ti mismo honestamente.' : `Evalúa a este hermano pilar.`}
        </p>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <FormularioEvaluacion
          pilar={pilarActual}
          esAuto={esAuto}
          preguntas={esAuto ? PREGUNTAS_AUTO : PREGUNTAS_OTRO}
          respuestas={respActual}
          onChange={(key, val) => setRespActual(r => ({ ...r, [key]: val }))}
        />
        <button onClick={siguiente} disabled={guardando}
          className="mt-6 w-full bg-blue-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-900 disabled:opacity-50">
          {guardando ? 'Guardando...' : indice < totalPasos - 1 ? 'Siguiente →' : 'Enviar evaluación'}
        </button>
      </div>
    </div>
  )

  if (paso === 'gracias') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-blue-800 mb-2">¡Gracias, {usuario.nombre.split(' ')[0]}!</h2>
        <p className="text-sm text-gray-500 mb-6">Tu evaluación {ANIO} fue enviada correctamente.</p>
        {(() => { const r = usuario.responsabilidades_pilar || []; const arr = Array.isArray(r) ? r : [r]; return arr.some(x => ['Servidor General', 'Servidor General Suplente', 'Organizacional'].includes(x)) })() && (
          <button onClick={verResultados} className="w-full border border-blue-700 text-blue-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-50">
            Ver resultados
          </button>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  )

  if (paso === 'resultados' && resultados) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-blue-800 mb-6 text-center">Resultados Evaluación {ANIO}</h1>
        <div className="space-y-4">
          {Object.values(resultados).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(r => (
            <div key={r.nombre} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">{r.nombre}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400">
                    <th className="text-left pb-1">Pregunta</th>
                    <th className="text-center pb-1">Promedio</th>
                    <th className="text-center pb-1">Autoevaluación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PREGUNTAS_AUTO.map((p, i) => (
                    <tr key={p.key}>
                      <td className="py-1.5 text-gray-600 pr-4">{p.texto}</td>
                      <td className="py-1.5 text-center font-semibold text-blue-700">{prom(r[p.key])}</td>
                      <td className="py-1.5 text-center text-gray-500">{r.auto ? r.auto[p.key] : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-2">{r.p1.length} evaluadores</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return null
}
