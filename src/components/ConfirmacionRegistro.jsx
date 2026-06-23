export default function ConfirmacionRegistro({ datos }) {
  const nombreCompleto = [datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido]
    .filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-800 mb-2">¡Registro completado!</h1>
          <p className="text-gray-600 mb-4">
            Gracias, <strong>{nombreCompleto}</strong>. Tu registro ha sido enviado exitosamente.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-blue-800 font-medium mb-2">¿Qué sigue?</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>📧 Recibirás un correo en <strong>{datos.correoElectronico}</strong> con el Código de Conducta y el Manual del Buen Trato.</li>
              {datos.estadoConsagracion === 'laborioso'
                ? <li>👤 El responsable de formación de tu ciudad revisará tu solicitud y te contactará para los siguientes pasos del proceso.</li>
                : <li>✅ Tu información ha quedado registrada en el sistema de la comunidad.</li>
              }
            </ul>
          </div>
          <p className="text-xs text-gray-400">Servido sea Jesucristo</p>
        </div>
      </div>
    </div>
  )
}
