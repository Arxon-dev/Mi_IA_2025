import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">404 - Página no encontrada</h1>
      <p className="text-gray-600 mb-4">Lo sentimos, la página que buscas no existe.</p>
      <a href="/" className="text-blue-600 hover:text-blue-800">
        Volver al inicio
      </a>
    </div>
  )
} 