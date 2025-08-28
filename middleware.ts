import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Interceptar rutas dinámicas de documentos para evitar prerenderizado
  if (request.nextUrl.pathname.startsWith('/documents/') && 
      request.nextUrl.pathname !== '/documents' &&
      !request.nextUrl.pathname.includes('.')  // Evitar archivos estáticos
  ) {
    // Añadir headers para forzar renderizado dinámico
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/documents/:path*',
  ],
};