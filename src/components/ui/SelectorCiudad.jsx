import { useState, useEffect } from 'react'

const DATOS = {
  Colombia: {
    'Amazonas': ['Leticia', 'Otra'],
    'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Sabaneta', 'Rionegro', 'Apartadó', 'Turbo', 'Salgar', 'Otra'],
    'Arauca': ['Arauca', 'Saravena', 'Otra'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Sabanalarga', 'Malambo', 'Otra'],
    'Bogotá D.C.': ['Bogotá', 'Otra'],
    'Bolívar': ['Cartagena', 'Magangué', 'Mompós', 'Otra'],
    'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Paipa', 'Otra'],
    'Caldas': ['Manizales', 'Villamaría', 'Otra'],
    'Caquetá': ['Florencia', 'Otra'],
    'Casanare': ['Yopal', 'Otra'],
    'Cauca': ['Popayán', 'Santander de Quilichao', 'Otra'],
    'Cesar': ['Valledupar', 'Aguachica', 'Otra'],
    'Chocó': ['Quibdó', 'Otra'],
    'Córdoba': ['Montería', 'Cereté', 'Otra'],
    'Cundinamarca': ['Soacha', 'Fusagasugá', 'Facatativá', 'Zipaquirá', 'Chía', 'Otra'],
    'Guainía': ['Inírida', 'Otra'],
    'Guaviare': ['San José del Guaviare', 'Otra'],
    'Huila': ['Neiva', 'Garzón', 'Pitalito', 'Otra'],
    'La Guajira': ['Riohacha', 'Maicao', 'Otra'],
    'Magdalena': ['Santa Marta', 'Ciénaga', 'Otra'],
    'Meta': ['Villavicencio', 'Acacías', 'Otra'],
    'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'Otra'],
    'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Otra'],
    'Putumayo': ['Mocoa', 'Puerto Asís', 'Otra'],
    'Quindío': ['Armenia', 'Calarcá', 'Otra'],
    'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'Otra'],
    'San Andrés y Providencia': ['San Andrés', 'Otra'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'Otra'],
    'Sucre': ['Sincelejo', 'Corozal', 'Otra'],
    'Tolima': ['Ibagué', 'Espinal', 'Otra'],
    'Valle del Cauca': ['Cali', 'Buenaventura', 'Tuluá', 'Palmira', 'El Tablazo', 'Otra'],
    'Vaupés': ['Mitú', 'Otra'],
    'Vichada': ['Puerto Carreño', 'Otra'],
  },
  Ecuador: {
    'Azuay': ['Cuenca', 'Otra'],
    'Guayas': ['Guayaquil', 'Durán', 'Samborondón', 'Otra'],
    'Manabí': ['Portoviejo', 'Manta', 'Otra'],
    'Pichincha': ['Quito', 'Sangolquí', 'Otra'],
    'Tungurahua': ['Ambato', 'Otra'],
    'Otro departamento': ['Otra'],
  },
  Perú: {
    'Arequipa': ['Arequipa', 'Otra'],
    'Cusco': ['Cusco', 'Otra'],
    'La Libertad': ['Trujillo', 'Otra'],
    'Lima': ['Lima', 'Callao', 'Otra'],
    'Piura': ['Piura', 'Otra'],
    'Otro departamento': ['Otra'],
  },
  Bolivia: {
    'Beni': ['Trinidad', 'Otra'],
    'Cochabamba': ['Cochabamba', 'Otra'],
    'La Paz': ['La Paz', 'El Alto', 'Otra'],
    'Oruro': ['Oruro', 'Otra'],
    'Santa Cruz': ['Santa Cruz de la Sierra', 'Otra'],
    'Otro departamento': ['Otra'],
  },
  Argentina: {
    'Buenos Aires': ['Buenos Aires', 'La Plata', 'Mar del Plata', 'Otra'],
    'Córdoba': ['Córdoba', 'Otra'],
    'Mendoza': ['Mendoza', 'Otra'],
    'Rosario / Santa Fe': ['Rosario', 'Santa Fe', 'Otra'],
    'Otra provincia': ['Otra'],
  },
  Paraguay: {
    'Asunción': ['Asunción', 'Otra'],
    'Guairá': ['Villarica', 'Otra'],
    'Otro departamento': ['Otra'],
  },
  Uruguay: {
    'Montevideo': ['Montevideo', 'Otra'],
    'Otro departamento': ['Otra'],
  },
  México: {
    'Ciudad de México': ['Ciudad de México', 'Otra'],
    'Jalisco': ['Guadalajara', 'Zapopan', 'Otra'],
    'Nuevo León': ['Monterrey', 'San Pedro Garza García', 'Otra'],
    'Otro estado': ['Otra'],
  },
  Venezuela: {
    'Carabobo': ['Valencia', 'Otra'],
    'Caracas (Distrito Capital)': ['Caracas', 'Otra'],
    'Lara': ['Barquisimeto', 'Sanare', 'Otra'],
    'Zulia': ['Maracaibo', 'Otra'],
    'Otro estado': ['Otra'],
  },
  España: {
    'Cataluña': ['Barcelona', 'Otra'],
    'Comunidad de Madrid': ['Madrid', 'Otra'],
    'Galicia': ['Santiago de Compostela', 'Otra'],
    'Aragón': ['Zaragoza', 'Otra'],
    'Otra comunidad': ['Otra'],
  },
  'Estados Unidos': {
    'Florida': ['Jacksonville', 'Miami', 'Otra'],
    'Pennsylvania': ['Landisville', 'Otra'],
    'Texas': ['Houston', 'Otra'],
    'Utah': ['Salt Lake City', 'Otra'],
    'Otro estado': ['Otra'],
  },
  Chile: {
    'Región Metropolitana': ['Santiago', 'Otra'],
    'Otra región': ['Otra'],
  },
  'Costa Rica': {
    'San José': ['San José', 'Otra'],
    'Otra provincia': ['Otra'],
  },
}

export default function SelectorCiudad({ pais, departamento, ciudad, onChangeDepartamento, onChangeCiudad }) {
  const [mostrarOtra, setMostrarOtra] = useState(false)

  const deptos = pais ? Object.keys(DATOS[pais] || {}) : []
  const ciudades = (pais && departamento) ? (DATOS[pais]?.[departamento] || []) : []

  useEffect(() => {
    setMostrarOtra(false)
  }, [pais, departamento])

  const handleDepartamento = (e) => {
    onChangeDepartamento(e.target.value)
    onChangeCiudad('')
    setMostrarOtra(false)
  }

  const handleCiudad = (e) => {
    if (e.target.value === 'Otra') {
      setMostrarOtra(true)
      onChangeCiudad('')
    } else {
      setMostrarOtra(false)
      onChangeCiudad(e.target.value)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Estado / Provincia</label>
        <select
          value={departamento || ''}
          onChange={handleDepartamento}
          disabled={!pais}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">Selecciona...</option>
          {deptos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {departamento && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Municipio</label>
          <select
            value={mostrarOtra ? 'Otra' : (ciudad || '')}
            onChange={handleCiudad}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona...</option>
            {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {mostrarOtra && (
            <input
              type="text"
              value={ciudad}
              onChange={e => onChangeCiudad(e.target.value)}
              placeholder="Escribe tu ciudad"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}
    </div>
  )
}
