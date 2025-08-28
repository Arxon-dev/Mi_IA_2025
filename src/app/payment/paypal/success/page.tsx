'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PayPalSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Verificar que searchParams no sea null
        if (!searchParams) {
          setStatus('error');
          setMessage('Error: No se pudieron obtener los parámetros de la URL');
          return;
        }

        const token = searchParams.get('token'); // PayPal order ID
        const payerId = searchParams.get('PayerID');
        
        if (!token || !payerId) {
          setStatus('error');
          setMessage('Parámetros de pago inválidos');
          return;
        }

        // Capturar el pago
        const response = await fetch('/api/payments/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId: token,
            userid: localStorage.getItem('telegram_user_id') // O extraer del token
          })
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage('¡Pago procesado exitosamente! Tu suscripción ha sido activada.');
        } else {
          setStatus('error');
          setMessage(result.error || 'Error procesando el pago');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error interno procesando el pago');
      }
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Procesando pago...</h2>
              <p className="text-gray-600">Por favor espera mientras confirmamos tu pago con PayPal.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-green-600 text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Pago Exitoso!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Puedes cerrar esta ventana y regresar a Telegram.</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-600 text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error en el Pago</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Puedes cerrar esta ventana e intentar nuevamente en Telegram.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}