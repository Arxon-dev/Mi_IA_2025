/**
 * Prompt específico para generación de preguntas con límites estrictos de Telegram
 * Este prompt refuerza las restricciones de caracteres obligatorias
 */

export const telegramPrompt = `
LÍMITES ESTRICTOS DE TELEGRAM - CUMPLIMIENTO OBLIGATORIO

Debes generar preguntas que cumplan EXACTAMENTE estos límites:

🔴 PREGUNTA (ENUNCIADO): MÁXIMO 300 CARACTERES
🔴 CADA OPCIÓN DE RESPUESTA: MÁXIMO 100 CARACTERES  
🔴 RETROALIMENTACIÓN: MÁXIMO 200 CARACTERES

⚠️ IMPORTANTE: Las opciones que superen 100 caracteres serán truncadas automáticamente
⚠️ Procura mantener las opciones dentro del límite para evitar truncado

ESTRATEGIAS PARA CUMPLIR LOS LÍMITES:

1. PREGUNTAS CONCISAS:
   ❌ "Según el Artículo 15.3 de la Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público, en relación con las competencias de los órganos colegiados, ¿cuál de las siguientes afirmaciones sobre el procedimiento de adopción de acuerdos es correcta?"
   ✅ "Art. 15.3 Ley 40/2015: ¿Qué es correcto sobre adopción de acuerdos en órganos colegiados?"

2. OPCIONES BREVES:
   ❌ "Se requiere la presencia física de todos los miembros en el lugar de reunión"
   ✅ "Presencia física obligatoria de todos"

3. USAR ABREVIACIONES RECONOCIDAS:
   - "Artículo" → "Art."
   - "Real Decreto" → "RD"
   - "Boletín Oficial del Estado" → "BOE"
   - "Comunidad Autónoma" → "CA"

4. ELIMINAR PALABRAS INNECESARIAS:
   - Quitar: "de las siguientes", "la opción correcta es", "según establece"
   - Ir directo al punto: "¿Qué establece?" en lugar de "¿Cuál de las siguientes opciones establece correctamente?"

5. RETROALIMENTACIÓN EFICIENTE:
   ✅ "Art. 15.3: Los acuerdos se adoptan por mayoría simple salvo norma específica. La presencia física no es obligatoria si hay medios telemáticos (máx 200 chars)."

EJEMPLO PERFECTO PARA TELEGRAM:

¿Qué establece el Art. 65.1 Ley 40/2015 sobre Secretarios generales técnicos?

=Competencias sobre servicios comunes que atribuya el RD de estructura del Departamento
~Dependencia directa del Ministro sin intermediarios
~Exclusivamente funciones de coordinación administrativa
~Competencias limitadas a gestión presupuestaria

#### RETROALIMENTACIÓN:
Art. 65.1: Los Secretarios generales técnicos tienen competencias sobre servicios comunes según RD de estructura, especialmente gestión económica y presupuestaria.

VERIFICA ANTES DE ENTREGAR:
- Pregunta: ¿Menos de 300 caracteres? ✓
- Cada opción: ¿Menos de 100 caracteres? ✓  
- Retroalimentación: ¿Menos de 200 caracteres? ✓

Si NO cumples estos límites, REESCRIBE completamente hasta lograrlo.
`;