# Corrección del Formato de Opciones en Tabla PDC

## Problema Identificado

El comando `/pdc1` estaba funcionando correctamente en términos de conectividad y sintaxis, pero **todas las preguntas de PDC eran rechazadas** con el mensaje:

```
❌ Opciones insuficientes para la pregunta: [id]
❌ Poll RECHAZADO para pregunta [id] - opciones muy largas o error de envío
```

## Causa Raíz

Las opciones en la tabla `pdc` estaban almacenadas en un **formato JSON inválido**:

### Formato Incorrecto en BD:
```json
{"opción1","opción2","opción3","opción4"}
```

### Formato Esperado por el Código:
```json
["opción1","opción2","opción3","opción4"]
```

## Diagnóstico Realizado

Creamos un script de diagnóstico que reveló:

```javascript
// Ejemplo de datos reales encontrados:
Opciones (tipo): string
Opciones (valor): {"claramente definidos, alcanzables y trascendentes","sencillos, flexibles e innovadores","aprobados por el mando superior y detallados","tangibles, medibles y con plazos fijos"}
❌ Error parseando opciones: Expected ':' after property name in JSON at position 52
```

## Solución Implementada

### 1. Parser Personalizado para Formato Especial
```typescript
// Detectar formato especial {"opción1","opción2"}
if (typeof questionData.options === 'string') {
  console.log(`🔧 Parseando formato especial de opciones para pregunta ${questionData.id}`);
  
  // Remover llaves externas
  let optionsStr = questionData.options.trim();
  if (optionsStr.startsWith('{') && optionsStr.endsWith('}')) {
    optionsStr = optionsStr.slice(1, -1);
  }
  
  // Extraer opciones con regex
  const regex = /"([^"]+)"/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(optionsStr)) !== null) {
    matches.push(match[1]);
  }
  
  options = matches;
}
```

### 2. Limpieza de Opciones
```typescript
// Limpiar opciones eliminando porcentajes al inicio
options = options.map((option: string) => {
  return option.replace(/^%[-\d.]+%/, '').trim();
}).filter((option: string) => option && option.length > 0);
```

## Resultado

- ✅ **Parser personalizado**: Maneja el formato especial `{"op1","op2"}`
- ✅ **Extracción correcta**: Usa regex para extraer opciones entre comillas
- ✅ **Limpieza de datos**: Elimina porcentajes y espacios innecesarios
- ✅ **Compatibilidad**: Mantiene soporte para formatos JSON estándar

## Próximo Paso

Ahora el comando `/pdc1` debería funcionar correctamente:
1. Obtener preguntas de la tabla `pdc`
2. Parsear las opciones correctamente
3. Enviar el poll a Telegram con opciones válidas 