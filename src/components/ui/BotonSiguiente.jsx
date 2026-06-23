export default function BotonSiguiente({ onClick, texto = 'Siguiente' }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-blue-800 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 active:bg-blue-900 transition-colors mt-2"
    >
      {texto} →
    </button>
  )
}
