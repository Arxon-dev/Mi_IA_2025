// Script para verificar la validez de una API key de OpenAI
// Uso: npx tsx verificarOpenAIKey.ts [API_KEY]
// Si no se pasa argumento, usa process.env.NEXT_PUBLIC_GPT_API_KEY
// Si no existe variable de entorno, lee la clave del archivo 'clave.txt' (debe contener solo la clave en una línea)
// Documentación: https://platform.openai.com/docs/api-reference/models/list

import fetch from 'node-fetch';
import fs from 'fs';

async function verificarOpenAIKey(apiKey: string) {
  if (!apiKey) {
    console.error('❌ No se proporcionó una API key de OpenAI.');
    process.exit(1);
  }
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      console.log('✅ API key de OpenAI VÁLIDA.');
      const data = await response.json();
      console.log(`Modelos disponibles: ${data.data?.length ?? 0}`);
    } else {
      const error = await response.json().catch(() => ({}));
      console.error('❌ API key INVÁLIDA o sin permisos.');
      console.error('Código de estado:', response.status);
      console.error('Respuesta:', error);
    }
  } catch (err) {
    console.error('❌ Error al verificar la API key:', err);
  }
}

const apiKeyArg = process.argv[2];
const envKey = process.env.NEXT_PUBLIC_GPT_API_KEY;
let apiKey: string | undefined =
  typeof apiKeyArg === 'string' && apiKeyArg.length > 0 ? apiKeyArg :
  (typeof envKey === 'string' && envKey.length > 0 ? envKey : undefined);

if (!apiKey) {
  // Intentar leer la clave desde el archivo clave.txt
  try {
    if (fs.existsSync('clave.txt')) {
      const fileKey = fs.readFileSync('clave.txt', 'utf-8').trim();
      if (fileKey.length > 0) {
        apiKey = fileKey;
        console.log('🔑 API key leída desde clave.txt');
      }
    }
  } catch (err) {
    console.error('❌ Error al leer clave.txt:', err);
  }
}

if (!apiKey) {
  console.error('❌ No se proporcionó una API key de OpenAI ni por argumento, variable de entorno o archivo clave.txt.');
  process.exit(1);
}

verificarOpenAIKey(apiKey); 