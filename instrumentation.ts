// Archivo de instrumentación vacío para evitar errores de OpenTelemetry
// Este archivo es opcional y puede estar vacío

export async function register() {
  // No hacer nada - desactivar instrumentación
  if (process.env.NODE_ENV === 'development') {
    console.log('OpenTelemetry instrumentación desactivada');
  }
} 