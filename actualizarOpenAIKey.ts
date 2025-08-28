// Script para actualizar la API key de OpenAI en la base de datos
// Uso: npx tsx actualizarOpenAIKey.ts
// Lee la clave desde 'clave.txt' y la guarda para el proveedor 'openai' en la tabla AIProviderKey

import fs from 'fs';
import { PrismaService } from './src/services/prismaService';

async function main() {
  // Leer la clave desde clave.txt
  if (!fs.existsSync('clave.txt')) {
    console.error('❌ No se encontró el archivo clave.txt');
    process.exit(1);
  }
  const apiKey = fs.readFileSync('clave.txt', 'utf-8').trim();
  if (!apiKey) {
    console.error('❌ El archivo clave.txt está vacío');
    process.exit(1);
  }

  // Obtener la configuración activa
  const config = await PrismaService.getAIConfig();
  if (!config?.id) {
    console.error('❌ No se encontró configuración AIConfig en la base de datos');
    process.exit(1);
  }

  // Actualizar la clave en la base de datos
  await PrismaService.setProviderApiKey(config.id, 'openai', apiKey);
  console.log('✅ API key de OpenAI actualizada correctamente en la base de datos.');
}

main().catch((err) => {
  console.error('❌ Error al actualizar la API key:', err);
  process.exit(1);
}); 