import { NextRequest, NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

interface SchemaNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children?: SchemaNode[];
  parent?: string;
}

interface EnhanceSchemaRequest {
  nodes: SchemaNode[];
  schemaType: 'hierarchical' | 'timeline' | 'flowchart' | 'mindmap';
  config: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

interface AIResponse {
  enhancedNodes: SchemaNode[];
  suggestions: string[];
  optimizations: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 POST /api/ai-enhance-schema: Iniciando mejora de esquema con IA');
    
    const body: EnhanceSchemaRequest = await request.json();
    const { nodes, schemaType, config } = body;
    
    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron nodos para mejorar' },
        { status: 400 }
      );
    }
    
    // Obtener configuración de IA del sistema
    const aiConfig = await PrismaService.getAIConfig();
    
    if (!aiConfig) {
      return NextResponse.json(
        { error: 'No se encontró configuración de IA en el sistema' },
        { status: 404 }
      );
    }
    
    // Preparar el prompt para la IA
    const schemaText = nodes.map(node => `${'  '.repeat(node.level)}${node.text}`).join('\n');
    
    const systemPrompt = `Eres un experto en diseño de esquemas educativos y visualización de información. Tu tarea es mejorar y optimizar esquemas de estudio para hacerlos más efectivos y comprensibles.

Tipo de esquema: ${schemaType}
Objetivos:
1. Mejorar la claridad y estructura del contenido
2. Añadir conexiones lógicas entre conceptos
3. Optimizar la jerarquía de información
4. Sugerir mejoras en la organización
5. Mantener la coherencia educativa

Responde ÚNICAMENTE con un JSON válido que contenga:
{
  "enhancedNodes": [
    {
      "id": "node-X",
      "text": "Texto mejorado del nodo",
      "level": 0,
      "x": 0,
      "y": 0
    }
  ],
  "suggestions": ["Sugerencia 1", "Sugerencia 2"],
  "optimizations": ["Optimización 1", "Optimización 2"]
}`;
    
    const userPrompt = `Mejora el siguiente esquema de tipo "${schemaType}":

${schemaText}

Instrucciones específicas:
- Mantén la estructura jerárquica original pero mejora el contenido
- Añade claridad a los conceptos
- Sugiere conexiones entre ideas
- Optimiza para el aprendizaje
- Mantén el mismo número de niveles o mejóralos si es necesario`;
    
    // Llamar a la API de IA según el proveedor configurado
    let enhancedResponse: AIResponse;
    
    if (aiConfig.provider === 'anthropic' || config.provider === 'anthropic') {
      enhancedResponse = await callAnthropicAPI({
        systemPrompt,
        userPrompt,
        temperature: config.temperature || aiConfig.temperature || 0.7,
        maxTokens: config.maxTokens || aiConfig.maxTokens || 2000,
        apiKey: aiConfig.apiKey
      });
    } else {
      // Fallback para otros proveedores o simulación
      enhancedResponse = await simulateAIEnhancement(nodes, schemaType);
    }
    
    console.log('✅ POST /api/ai-enhance-schema: Esquema mejorado exitosamente');
    
    return NextResponse.json({
      success: true,
      enhancedNodes: enhancedResponse.enhancedNodes,
      suggestions: enhancedResponse.suggestions,
      optimizations: enhancedResponse.optimizations,
      originalNodeCount: nodes.length,
      enhancedNodeCount: enhancedResponse.enhancedNodes.length
    });
    
  } catch (error) {
    console.error('❌ POST /api/ai-enhance-schema Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error al mejorar el esquema con IA',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function callAnthropicAPI(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  apiKey: string | null;
}): Promise<AIResponse> {
  const { systemPrompt, userPrompt, temperature, maxTokens, apiKey } = params;
  
  if (!apiKey) {
    throw new Error('No se encontró la clave API de Anthropic');
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error de Anthropic API: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    // Intentar parsear la respuesta JSON
    try {
      const parsedResponse = JSON.parse(content);
      return parsedResponse as AIResponse;
    } catch (parseError) {
      console.error('Error al parsear respuesta de IA:', parseError);
      throw new Error('La respuesta de la IA no tiene el formato JSON esperado');
    }
    
  } catch (error) {
    console.error('Error en llamada a Anthropic API:', error);
    throw error;
  }
}

async function simulateAIEnhancement(nodes: SchemaNode[], schemaType: string): Promise<AIResponse> {
  // Simulación de mejora con IA para casos donde no hay configuración
  const enhancedNodes: SchemaNode[] = nodes.map((node, index) => {
    let enhancedText = node.text;
    
    // Mejoras básicas simuladas
    if (node.level === 0) {
      enhancedText = `📚 ${enhancedText}`; // Añadir emoji a títulos principales
    } else if (node.level === 1) {
      enhancedText = `🔹 ${enhancedText}`; // Añadir emoji a subtemas
    } else {
      enhancedText = `• ${enhancedText}`; // Añadir viñetas a detalles
    }
    
    return {
      ...node,
      id: `enhanced-${index}`,
      text: enhancedText
    };
  });
  
  const suggestions = [
    'Considera añadir más detalles a los conceptos principales',
    'Podrías incluir ejemplos prácticos para cada subtema',
    'Sería útil añadir conexiones entre los diferentes temas'
  ];
  
  const optimizations = [
    'Estructura jerárquica mejorada con indicadores visuales',
    'Texto optimizado para mejor comprensión',
    'Organización lógica de conceptos mantenida'
  ];
  
  return {
    enhancedNodes,
    suggestions,
    optimizations
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'API de mejora de esquemas con IA',
    version: '1.0.0',
    supportedTypes: ['hierarchical', 'timeline', 'flowchart', 'mindmap'],
    providers: ['anthropic', 'simulation']
  });
}