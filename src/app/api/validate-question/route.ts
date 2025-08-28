import { NextResponse } from 'next/server';
import { AIService, availableModels } from '@/services/aiService';

// Prompt avanzado para validación PROFUNDA de contenido (VERSION ESPECTACULAR MEJORADA)
const VALIDATION_PROMPT = `Eres un experto en validación RIGUROSA de preguntas de examen. Tu trabajo es verificar que el contenido sea COMPLETAMENTE CORRECTO, no solo el formato.

⚠️ IMPORTANTE SOBRE NOMENCLATURAS OFICIALES:
- Las "Instrucciones" seguidas de números y años (ej: "Instrucción 6/2025", "Instrucción 6-2025") son documentos oficiales reales
- El formato "número/año" NO se refiere a una fecha, sino al número de la instrucción del año correspondiente
- Ejemplo: "Instrucción 6/2025" = Instrucción número 6 del año 2025, NO junio 2025
- Las normativas militares, BOE, instrucciones oficiales son documentos válidos y existentes
- NO rechaces preguntas solo por la nomenclatura del documento fuente

FORMATO DE RESPUESTA OBLIGATORIO (USAR EXACTAMENTE ESTE FORMATO):

🔍 **ANÁLISIS DE VALIDACIÓN PROFUNDA**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **SECCIÓN 1: ANÁLISIS DE RESPUESTA CORRECTA**
   ✅ **Estado:** [VERIFICADA/RECHAZADA]
   🎯 **Precisión terminológica:** [Descripción específica]
   📖 **Referencia textual:** [Análisis de coherencia con fuente]
   ⚖️ **Interpretación normativa:** [Evaluación legal/reglamentaria - CONSIDERA QUE LAS INSTRUCCIONES OFICIALES SON VÁLIDAS]

📊 **SECCIÓN 2: ANÁLISIS DE OPCIONES INCORRECTAS**
   ❌ **Opción A:** [Descripción específica del error detectado]
   ❌ **Opción B:** [Descripción específica del error detectado]  
   ❌ **Opción C:** [Descripción específica del error detectado]

📊 **SECCIÓN 3: VERIFICACIÓN CRUZADA CON TEXTO FUENTE**
   🔗 **Coherencia interna:** [CONFIRMADA/PROBLEMÁTICA]
   📚 **Citas verificadas:** [EXACTAS/INCORRECTAS/AUSENTES]
   🎯 **Información inventada:** [NO HAY/DETECTADA: detalles]
   📋 **Validez del documento fuente:** [DOCUMENTO OFICIAL VÁLIDO/PROBLEMÁTICO]

📊 **SECCIÓN 4: ANÁLISIS DE COMPLEJIDAD Y SUTILEZA**
   🧠 **Nivel de dificultad:** [Apropiado/Inapropiado]
   ⚡ **Calidad de distractores:** [Plausibles/Obvios/Problemáticos]
   🔍 **Ambigüedades detectadas:** [NINGUNA/DETECTADAS: detalles]

📊 **SECCIÓN 5: ESTRUCTURA GIFT Y EDUCATIVA**
   📝 **Formato GIFT:** [CORRECTO/INCORRECTO]
   🎓 **Retroalimentación:** [PRESENTE/AUSENTE/INCOMPLETA]
   💡 **Valor educativo:** [ALTO/MEDIO/BAJO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 **RESULTADO FINAL**
[✅ **VÁLIDA** - Contenido verificado y opciones correctamente clasificadas]
[❌ **RECHAZADA** - ERROR DE CONTENIDO: descripción específica del problema]

📈 **PUNTUACIÓN GLOBAL:** [X.X/10]

INSTRUCCIONES CRÍTICAS:
- USA EXACTAMENTE este formato visual con iconos y separadores
- Sé específico en cada sección, no uses frases genéricas
- Solo marca como VÁLIDA si TODO está perfecto
- Si hay CUALQUIER error de contenido, marca como RECHAZADA
- NO rechaces por nomenclatura de documentos oficiales (Instrucciones, BOE, normativas militares)
- Las "Instrucciones número/año" son documentos oficiales válidos, NO fechas futuras

Pregunta a validar:
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, provider, model, sourceText } = body;
    if (!question) {
      return NextResponse.json({ error: 'Falta la pregunta a validar.' }, { status: 400 });
    }
    // Usar el modelo y proveedor actual si no se especifica
    const aiProvider = provider || 'openai';
    let aiModelObj: typeof availableModels[0] | undefined = undefined;
    if (model) {
      aiModelObj = availableModels.find(m => m.id === model);
      if (!aiModelObj) {
        return NextResponse.json({ error: `Modelo no encontrado: ${model}` }, { status: 400 });
      }
    } else {
      aiModelObj = availableModels.find(m => m.provider === aiProvider) || availableModels[0];
    }
    // Construir el prompt con validación PROFUNDA de contenido
    let prompt = '';
    if (sourceText && sourceText.trim().length > 0) {
      prompt = `Eres un experto en validación RIGUROSA de preguntas de examen. Debes verificar que el contenido sea COMPLETAMENTE CORRECTO.

⚠️ IMPORTANTE SOBRE NOMENCLATURAS OFICIALES:
- Las "Instrucciones" seguidas de números y años (ej: "Instrucción 6/2025", "Instrucción 6-2025") son documentos oficiales reales
- El formato "número/año" NO se refiere a una fecha, sino al número de la instrucción del año correspondiente
- Ejemplo: "Instrucción 6/2025" = Instrucción número 6 del año 2025, NO junio 2025
- Las normativas militares, BOE, instrucciones oficiales son documentos válidos y existentes
- NO rechaces preguntas solo por la nomenclatura del documento fuente

TEXTO FUENTE (USA ESTO COMO ÚNICA VERDAD):
${sourceText}

PREGUNTA A VALIDAR:
${question}

FORMATO DE RESPUESTA OBLIGATORIO (USAR EXACTAMENTE ESTE FORMATO):

🔍 **ANÁLISIS DE VALIDACIÓN PROFUNDA**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **SECCIÓN 1: ANÁLISIS DE RESPUESTA CORRECTA**
   ✅ **Estado:** [VERIFICADA/RECHAZADA]
   🎯 **Precisión terminológica:** [Descripción específica basada en texto fuente]
   📖 **Referencia textual:** [Análisis de coherencia con fuente]
   ⚖️ **Interpretación normativa:** [Evaluación según texto fuente - CONSIDERA QUE LAS INSTRUCCIONES OFICIALES SON VÁLIDAS]

📊 **SECCIÓN 2: ANÁLISIS DE OPCIONES INCORRECTAS**
   ❌ **Opción A:** [Descripción específica del error vs texto fuente]
   ❌ **Opción B:** [Descripción específica del error vs texto fuente]  
   ❌ **Opción C:** [Descripción específica del error vs texto fuente]

📊 **SECCIÓN 3: VERIFICACIÓN CRUZADA CON TEXTO FUENTE**
   🔗 **Coherencia interna:** [CONFIRMADA/PROBLEMÁTICA]
   📚 **Citas verificadas:** [EXACTAS/INCORRECTAS con referencias específicas]
   🎯 **Información inventada:** [NO HAY/DETECTADA: detalles específicos]
   📋 **Validez del documento fuente:** [DOCUMENTO OFICIAL VÁLIDO/PROBLEMÁTICO]

📊 **SECCIÓN 4: ANÁLISIS DE COMPLEJIDAD Y SUTILEZA**
   🧠 **Nivel de dificultad:** [Apropiado/Inapropiado para el texto fuente]
   ⚡ **Calidad de distractores:** [Plausibles/Obvios según contenido fuente]
   🔍 **Ambigüedades detectadas:** [NINGUNA/DETECTADAS: detalles]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 **RESULTADO FINAL**
[✅ **VÁLIDA** - Contenido verificado y opciones correctamente clasificadas]
[❌ **RECHAZADA** - ERROR DE CONTENIDO: descripción específica del problema]

📈 **PUNTUACIÓN GLOBAL:** [X.X/10]

CRITERIO ESTRICTO:
- Solo responde ✅ VÁLIDA si TODAS las opciones están perfectamente clasificadas según el texto fuente
- Si hay CUALQUIER error de contenido, responde ❌ RECHAZADA con explicación específica
- NO rechaces por nomenclatura de documentos oficiales (Instrucciones, BOE, normativas militares)
- Las "Instrucciones número/año" son documentos oficiales válidos, NO fechas futuras`;
    } else {
      prompt = VALIDATION_PROMPT + question;
    }
    // Llamar al servicio de IA usando el método público
    const feedback = await AIService.validateWithAI(prompt, aiModelObj);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error en validación avanzada:', error);
    return NextResponse.json({ error: 'Error en la validación avanzada.' }, { status: 500 });
  }
} 