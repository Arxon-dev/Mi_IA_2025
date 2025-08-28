import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    console.log(`🔑 Verificando API key para ${provider}...`);

    if (!provider || !apiKey) {
      console.error('❌ Faltan datos requeridos');
      return NextResponse.json(
        { error: 'Se requiere provider y apiKey' },
        { status: 400 }
      );
    }

    let testEndpoint = '';
    let testOptions: RequestInit = {
      method: 'GET',
      headers: {},
    };

    switch (provider) {
      case 'google':
        testEndpoint = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        break;
      case 'openai':
        testEndpoint = 'https://api.openai.com/v1/models';
        testOptions.headers = {
          'Authorization': `Bearer ${apiKey}`,
        };
        break;
      case 'anthropic':
        testEndpoint = 'https://api.anthropic.com/v1/messages';
        testOptions = {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }]
          })
        };
        break;
      case 'xai':
        testEndpoint = 'https://api.x.ai/v1/models';
        testOptions.headers = {
          'Authorization': `Bearer ${apiKey}`,
        };
        break;
      default:
        console.error(`❌ Proveedor no soportado: ${provider}`);
        return NextResponse.json(
          { error: 'Proveedor no soportado' },
          { status: 400 }
        );
    }

    console.log(`🔄 Probando API key en ${testEndpoint}...`);
    const response = await fetch(testEndpoint, testOptions);

    if (!response.ok) {
      console.error(`❌ API key inválida para ${provider}`);
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 401 }
      );
    }

    console.log(`✅ API key válida para ${provider}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error al verificar API key:', error);
    return NextResponse.json(
      { error: 'Error al verificar API key' },
      { status: 500 }
    );
  }
} 