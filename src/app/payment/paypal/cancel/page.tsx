'use client';

export default function PayPalCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-yellow-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pago Cancelado</h2>
          <p className="text-gray-600 mb-4">
            Has cancelado el proceso de pago. No se ha realizado ningún cargo.
          </p>
          <p className="text-sm text-gray-500">
            Puedes cerrar esta ventana y regresar a Telegram para intentar nuevamente.
          </p>
        </div>
      </div>
    </div>
  );
}