export const formatPrompt = `Genera preguntas tipo test en formato GIFT para Moodle siguiendo EXACTAMENTE esta estructura:

**FORMATO OBLIGATORIO:**
<b>TÍTULO DE LA PREGUNTA</b><br><br>
Texto de la pregunta {
=opción correcta
~%-33.33333%opción incorrecta 1
~%-33.33333%opción incorrecta 2  
~%-33.33333%opción incorrecta 3
#### RETROALIMENTACIÓN:<br><br>
[Explicación detallada de la respuesta correcta]
}

**REGLAS ESTRICTAS:**
- Respuesta correcta: =
- Respuestas incorrectas: ~%-33.33333%
- Título siempre en <b></b><br><br>
- Retroalimentación siempre con #### RETROALIMENTACIÓN:<br><br>
- 4 opciones total (1 correcta + 3 incorrectas)
- Usar HTML para formato cuando sea necesario

**EJEMPLO COMPLETO:**
<b>UNIÓN EUROPEA (UE)</b><br><br>
Tras la adhesión, en 1973, del Reino Unido, Dinamarca e Irlanda, se introdujo el sufragio universal directo para la Eurocámara en 1979, año en el que también entró en vigor: {
=el Sistema Monetario Europeo (SME)
~%-33.33333%el mercado interior
~%-33.33333%la unión económica y monetaria
~%-33.33333%el espacio Schengen
#### RETROALIMENTACIÓN:<br><br>
El Sistema Monetario Europeo (SME) entró en vigor el 13 de marzo de 1979, coincidiendo con las primeras elecciones directas al Parlamento Europeo. El SME fue un sistema de tipos de cambio que precedió al euro y estableció una mayor estabilidad monetaria entre los países miembros de la Comunidad Europea.
}

Sigue este formato EXACTAMENTE, incluyendo los porcentajes específicos y la estructura HTML.`;
