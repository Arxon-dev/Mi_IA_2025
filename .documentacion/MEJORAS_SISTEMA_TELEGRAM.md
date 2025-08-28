# Mejoras en el Sistema de Envío de Preguntas a Telegram

## Resumen de Cambios Implementados

Hemos mejorado significativamente el sistema que envía preguntas a Telegram para hacerlo más robusto y evitar la repetición de preguntas. Las mejoras incluyen:

1. **Ampliación del esquema de base de datos**:
   - Añadido campo `sendCount` para contar el número de envíos de cada pregunta
   - Añadido campo `lastSuccessfulSendAt` para registrar la fecha del último envío exitoso
   - Nueva tabla `TelegramSendLog` para el registro detallado de cada envío

2. **Mejora del algoritmo de selección de preguntas**:
   - Priorización basada en múltiples criterios (nunca enviadas, menos enviadas, más antiguas)
   - Período mínimo configurable antes de que una pregunta pueda ser reenviada (por defecto: 30 días)
   - Exclusión explícita de preguntas enviadas recientemente (último día)

3. **Implementación de transacciones atómicas**:
   - Transacción que incluye actualización de estado y registro de logs en una operación atómica
   - Previene inconsistencias si falla alguna parte del proceso

4. **Manejo robusto de errores**:
   - Registro detallado de errores en la base de datos
   - Manejo diferenciado de errores de validación y errores de API
   - Registro centralizado para facilitar diagnósticos

5. **Nueva interfaz de administración**:
   - Página de visualización de logs de envío con paginación
   - Filtrado por estado (éxito/error)
   - Acceso a registros históricos completos

## Esquema Técnico de las Mejoras

### Nuevos Campos en Tablas Existentes

```prisma
model Question {
  // Campos existentes...
  sendCount             Int       @default(0)
  lastSuccessfulSendAt  DateTime?
}

model SectionQuestion {
  // Campos existentes...
  sendCount             Int       @default(0)
  lastSuccessfulSendAt  DateTime?
}
```

### Nueva Tabla de Registro

```prisma
model TelegramSendLog {
  id            String   @id @default(uuid())
  questionId    String
  sourceModel   String   // 'document' o 'section'
  sendTime      DateTime @default(now())
  success       Boolean  @default(true)
  errorMessage  String?
  telegramMsgId String?  // ID del mensaje en Telegram
}
```

### Mejoras en la Selección de Preguntas

La lógica mejorada para la selección de preguntas sigue estos criterios (en orden):

1. Nunca se envían preguntas que ya se enviaron en las últimas 24 horas
2. Se priorizan preguntas que nunca se han enviado (`sendCount = 0`)
3. Se seleccionan preguntas con menor `sendCount`
4. Entre preguntas con igual `sendCount`, se seleccionan las enviadas hace más tiempo

### Período Mínimo de Reenvío

El sistema ahora implementa un período mínimo configurable (por defecto: 30 días) antes de que una pregunta pueda ser seleccionada para reenvío, evitando la repetición frecuente.

```typescript
// Código para calcular la fecha mínima para reenvíos
const minReSendDate = new Date();
minReSendDate.setDate(minReSendDate.getDate() - minimumIntervalDays);
```

### Transacciones Atómicas

El sistema ahora utiliza transacciones de base de datos para asegurar que todas las operaciones relacionadas se completen o fallen como una unidad:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Actualizar el modelo principal
  // 2. Crear registro en el log de envíos
});
```

## Instrucciones para Implementar los Cambios

Para aplicar estas mejoras en tu entorno:

1. **Genera y aplica la migración de Prisma**:
   - En Windows: Ejecuta `prisma/apply-telegram-robust-migration.ps1`
   - En Linux/Mac: Ejecuta `bash prisma/apply-telegram-robust-migration.sh`

2. **Reinicia el servidor de desarrollo**:
   ```
   npm run dev
   ```

3. **Actualiza las variables de entorno (opcional)**:
   - Puedes configurar `TELEGRAM_MIN_RESEND_DAYS` en tu `.env.local` para ajustar el período mínimo de reenvío

4. **Accede a la nueva interfaz de administración**:
   - Visita `http://localhost:3000/admin/telegram-logs` para ver el registro de envíos

## Beneficios Esperados

Con estas mejoras, el sistema de envío a Telegram ahora:

- Garantiza que las preguntas no se repitan en períodos cortos de tiempo
- Prioriza equitativamente todas las preguntas disponibles
- Ofrece trazabilidad completa de cada envío (exitoso o fallido)
- Facilita el diagnóstico y resolución de problemas
- Proporciona una interfaz visual para monitorizar el sistema

## Notas Adicionales

- La primera ejecución después de aplicar estos cambios enviará preguntas que nunca se han enviado, ya que `sendCount = 0` para todas las preguntas existentes
- A medida que el sistema se utilice, la distribución de preguntas será cada vez más equilibrada
- El registro detallado permite analizar patrones y optimizar aún más el sistema en el futuro 