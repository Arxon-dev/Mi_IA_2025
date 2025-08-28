export interface ValidationErrorDetail {
  motivo: string;
  porQue: string;
  sugerencia: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

export function validateGiftQuestions(
  text: string,
  config: { numQuestions: number; optionLength?: 'muy_corta' | 'media' | 'larga' | 'telegram' }
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];
  const questions = text.split(/\n\n/).filter(q => q.includes('{') && q.includes('}'));
  
  // Validar cantidad
  if (questions.length !== config.numQuestions) {
    errors.push({
      motivo: `Se esperaban ${config.numQuestions} preguntas, pero se encontraron ${questions.length}.`,
      porQue: 'El número de preguntas generadas no coincide con el solicitado, lo que puede causar problemas al importar el test.',
      sugerencia: 'Genera o añade el número correcto de preguntas.'
    });
  }

  // Validar cada pregunta
  questions.forEach((q, idx) => {
    const options = (q.match(/([=~][^\n]+)/g) || []);
    const correct = options.filter(o => o.trim().startsWith('=')).length;
    const incorrect = options.filter(o => o.trim().startsWith('~')).length;
    if (correct !== 1 || incorrect !== 3) {
      errors.push({
        motivo: `Pregunta ${idx + 1}: Debe tener 1 opción correcta y 3 incorrectas.`,
        porQue: 'El formato GIFT requiere exactamente una respuesta correcta (marcada con "=") y tres incorrectas (marcadas con "~") para asegurar la validez del test.',
        sugerencia: 'Revisa las opciones de la pregunta y asegúrate de que solo una comience con "=" y las otras tres con "~".'
      });
    }
    if (!q.includes('#### RETROALIMENTACIÓN:')) {
      errors.push({
        motivo: `Pregunta ${idx + 1}: Falta la retroalimentación obligatoria.`,
        porQue: 'Cada pregunta debe incluir una sección de retroalimentación (#### RETROALIMENTACIÓN:) para proporcionar explicación o referencia al estudiante.',
        sugerencia: 'Añade una línea con "#### RETROALIMENTACIÓN:" seguida de una explicación o referencia relevante.'
      });
    }
    // Validar longitud de opciones según optionLength
    if (config.optionLength) {
      if (config.optionLength === 'telegram') {
        // Validaciones específicas para Telegram - Límites de caracteres estrictos
        const questionText = q.split('\n')[0] || '';
        if (questionText.length > 300) {
          errors.push({
            motivo: `Pregunta ${idx + 1}: Excede 300 caracteres (${questionText.length} chars).`,
            porQue: 'Telegram requiere que las preguntas no superen los 300 caracteres sin truncamiento.',
            sugerencia: 'Reescribe la pregunta para que sea más concisa y no supere los 300 caracteres.'
          });
        }
        
        options.forEach((opt, i) => {
          const optionText = opt.replace(/^[=~]/, '').trim();
          if (optionText.length > 150) {
            errors.push({
              motivo: `Pregunta ${idx + 1}, opción ${i + 1}: Excede 150 caracteres (${optionText.length} chars).`,
              porQue: 'Telegram requiere que cada opción no supere los 150 caracteres sin truncamiento.',
              sugerencia: 'Reescribe la opción para que sea más concisa y no supere los 150 caracteres.'
            });
          }
        });

        // Validar retroalimentación (máximo 200 caracteres)
        const feedbackMatch = q.match(/#### RETROALIMENTACIÓN:\s*([\s\S]+)/);
        if (feedbackMatch) {
          const feedbackText = feedbackMatch[1].trim();
          if (feedbackText.length > 200) {
            errors.push({
              motivo: `Pregunta ${idx + 1}: Retroalimentación excede 200 caracteres (${feedbackText.length} chars).`,
              porQue: 'Telegram permite hasta 200 caracteres en la retroalimentación (se puede truncar automáticamente).',
              sugerencia: 'Reduce la retroalimentación o acepta que se truncará automáticamente a 200 caracteres.'
            });
          }
        }
      } else {
        // Validaciones originales por palabras
        options.forEach((opt, i) => {
          const words = opt.replace(/^[=~]/, '').trim().split(/\s+/).filter(Boolean).length;
          if (config.optionLength === 'muy_corta' && words > 3) {
            errors.push({
              motivo: `Pregunta ${idx + 1}, opción ${i + 1}: Excede la longitud muy corta (máx 3 palabras).`,
              porQue: 'Se solicitó que las opciones sean muy cortas para facilitar la respuesta rápida y directa.',
              sugerencia: 'Reduce la opción a un máximo de 3 palabras.'
            });
          }
          if (config.optionLength === 'media' && (words < 3 || words > 15)) {
            errors.push({
              motivo: `Pregunta ${idx + 1}, opción ${i + 1}: No cumple longitud media (3-15 palabras).`,
              porQue: 'Se solicitó que las opciones sean de longitud media para mayor claridad y contexto.',
              sugerencia: 'Ajusta la opción para que tenga entre 3 y 15 palabras.'
            });
          }
          if (config.optionLength === 'larga' && words < 10) {
            errors.push({
              motivo: `Pregunta ${idx + 1}, opción ${i + 1}: Es demasiado corta para longitud larga.`,
              porQue: 'Se solicitó que las opciones sean largas para mayor detalle y explicación.',
              sugerencia: 'Amplía la opción para que tenga al menos 10 palabras.'
            });
          }
        });
      }
    }
  });

  return { isValid: errors.length === 0, errors };
} 