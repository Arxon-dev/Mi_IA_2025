import { NextResponse } from 'next/server';
import { utimes } from 'fs/promises';
import { join } from 'path';

const CONFIG_FILE = join(process.cwd(), 'scheduler-config.json');

export async function POST() {
  try {
    // Modificar la fecha de modificación del archivo para forzar un reload
    const now = new Date();
    await utimes(CONFIG_FILE, now, now);
    
    return NextResponse.json({
      success: true,
      message: 'Configuración recargada. El scheduler detectará los cambios automáticamente.',
      timestamp: now.toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error recargando configuración: ' + error.message
    }, { status: 500 });
  }
} 