import { NextRequest, NextResponse } from 'next/server';

/**
 * 📊 DASHBOARD DE MONITOREO - PASO 4
 * TEMPORALMENTE DESHABILITADO DEBIDO A PROBLEMAS DE TIPOS
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Dashboard temporalmente deshabilitado',
    message: 'Se están corrigiendo problemas de tipos con Prisma'
  }, { status: 503 });
} 