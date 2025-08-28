import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Lista de rutas que sabemos que no existen
  const nonExistentRoutes = ['/config', '/help', '/guide', '/support', '/logout']
  
  // Si la ruta está en la lista, redirigir a 404
  if (nonExistentRoutes.includes(new URL(request.url).pathname)) {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  return NextResponse.next()
} 