import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🔍 [Anthropic Proxy] Body recibido:', body);
    const { prompt, model = 'claude-3-opus-20240229', max_tokens = 1000 } = body;
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key de Anthropic no configurada en el backend' }, { status: 500 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Falta el prompt' }, { status: 400 });
    }

    let safeMaxTokens = max_tokens;
    if (model === 'claude-3-opus-20240229' && max_tokens > 4096) {
      console.warn('⚠️ [Anthropic Proxy] max_tokens solicitado supera el límite de 4096 para claude-3-opus. Se ajusta a 4096.');
      safeMaxTokens = 4096;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: safeMaxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const text = await response.text();
    console.log('🔍 [Anthropic Proxy] Respuesta Anthropic:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: text };
    }
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error en el proxy Anthropic:', error);
    return NextResponse.json({ error: 'Error en el proxy Anthropic' }, { status: 500 });
  }
} 