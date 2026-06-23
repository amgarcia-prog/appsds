export default function BotonAnterior({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors mt-2"
    >
      ← Anterior
    </button>
  )
}
