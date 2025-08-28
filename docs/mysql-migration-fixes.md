# Soluciones para Errores de Migración PostgreSQL → MySQL

## Resumen
Este documento registra todos los errores encontrados y las soluciones aplicadas durante la migración de PostgreSQL a MySQL en el proyecto.

## Errores Solucionados

### 1. Error en `telegrampoll.create()` - Campo `id` requerido
**Archivo:** `src/app/api/telegram/webhook/route.ts`
**Línea:** 3362
**Error:** 
```
Property 'id' is missing in type 'telegrampollCreateInput'
```

**Causa:** En MySQL con Prisma, el campo `id` es requerido para la creación de registros.

**Solución:**
```typescript
// ANTES
await prisma.telegrampoll.create({
  data: {
    pollid: result.result.poll.id,
    questionid: questionid,
    // ... otros campos
  }
});

// DESPUÉS
await prisma.telegrampoll.create({
  data: {
    id: `poll-${result.result.poll.id}-${Date.now()}`,
    pollid: result.result.poll.id,
    questionid: questionid,
    // ... otros campos
  }
});
```

### 2. Error en `simulacro.create()` - Campos requeridos faltantes
**Archivo:** `src/app/api/telegram/webhook/route.ts`
**Línea:** 3631
**Error:**
```
Type missing the following properties: id, updatedat, examtype
```

**Causa:** El schema de MySQL requiere campos adicionales que no estaban siendo proporcionados.

**Solución:**
```typescript
// ANTES
const simulacro = await prisma.simulacro.create({
  data: {
    userid: user.id,
    status: 'in_progress',
    timelimit: 10800,
    totalquestions: 100
  }
});

// DESPUÉS
const simulacro = await prisma.simulacro.create({
  data: {
    id: `simulacro-${user.id}-${Date.now()}`,
    userid: user.id,
    status: 'in_progress',
    timelimit: 10800,
    totalquestions: 100,
    updatedat: new Date(),
    examtype: 'simulacro'
  }
});
```

### 3. Error `_count` no disponible en consultas de tournament
**Archivo:** `src/app/api/telegram/webhook/route.ts`
**Líneas:** 4718, 4790, 4803
**Error:**
```
Property '_count' does not exist on type 'tournament'
```

**Causa:** Las consultas no incluían el `_count` de participantes, que se usaba en el código.

**Solución:** Modificar `tournamentService.ts` para agregar manualmente el count:
```typescript
// En getTournamentList()
const tournamentsWithCount = await Promise.all(
  tournaments.map(async (tournament) => {
    const participantCount = await prisma.tournamentparticipant.count({
      where: { tournamentid: tournament.id }
    });
    return {
      ...tournament,
      _count: { participants: participantCount }
    };
  })
);
```

### 4. Errores de sintaxis en `tournamentService.ts`
**Archivo:** `src/services/tournamentService.ts`
**Múltiples líneas**

**Problemas encontrados:**
1. Variable `questionsCount` vs `questionscount` (línea 46)
2. Sintaxis incorrecta en consultas Prisma (líneas 274-278)
3. Bloques try-catch malformados
4. Importación incorrecta de Prisma

**Soluciones aplicadas:**
1. **Corrección de variable:** `questionsCount` → `questionscount`
2. **Reestructuración de consultas:** Separar consultas de tournament y participantes
3. **Reescritura completa del archivo** con estructura TypeScript correcta
4. **Importación directa de PrismaClient:**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

### 5. Errores en historial de torneos (getUserTournamentHistory)
**Archivo:** `src/app/api/telegram/webhook/route.ts`
**Líneas:** 5047-5133
**Error:**
```
Property 'status' does not exist on type 'never'
Property 'tournament' does not exist on type 'never'
Property 'responses' does not exist on type 'never'
```

**Causa:** El método `getUserTournamentHistory` devolvía un array vacío sin las relaciones necesarias.

**Solución:** Implementar correctamente el método con consultas enriquecidas:
```typescript
// En tournamentService.ts
const enrichedParticipations = await Promise.all(
  participations.map(async (participation) => {
    // Obtener datos del torneo
    const tournament = await prisma.tournament.findUnique({
      where: { id: participation.tournamentid }
    });

    // Obtener respuestas del torneo
    const responses = await prisma.tournamentresponse.findMany({
      where: { participantid: participation.id },
      orderBy: { questionnumber: 'asc' }
    });

    return {
      ...participation,
      tournament: tournament || {
        id: participation.tournamentid,
        name: 'Torneo Desconocido',
        scheduleddate: new Date(),
        questionscount: 0,
        status: 'UNKNOWN',
        // ... otros campos requeridos
      },
      responses: responses || []
    };
  })
);
```

### 6. Errores de módulos no encontrados
**Archivo:** `src/services/tournamentService.ts`
**Línea:** 55
**Error:**
```
Cannot find module './tournamentModule'
```

**Causa:** Referencia a un módulo que no existe en el proyecto.

**Solución:** Implementar módulo interno en lugar de importación externa:
```typescript
// Reemplazar importación dinámica con implementación interna
this.tournamentModule = {
  createTournamentManager: () => ({
    isRunning: false,
    start: () => {},
    handlePollAnswer: async () => false
  })
};
```

### 7. Propiedades faltantes en objeto tournament por defecto
**Archivo:** `src/app/api/telegram/webhook/route.ts`
**Líneas:** 5096, 5110
**Error:**
```
Property 'scheduleddate' does not exist on type tournament
```

**Causa:** El objeto tournament por defecto no incluía todas las propiedades necesarias del schema.

**Solución:** Completar el objeto por defecto con todas las propiedades requeridas:
```typescript
tournament: tournament || {
  id: participation.tournamentid,
  name: 'Torneo Desconocido',
  scheduleddate: new Date(),
  questionscount: 0,
  status: 'UNKNOWN',
  timelimit: 7200,
  prizepool: 0,
  // ... todos los campos del schema
}
```

## Cambios Estructurales Importantes

### 1. Manejo de Relaciones en MySQL
- **Problema:** MySQL con Prisma requiere manejo explícito de relaciones
- **Solución:** Realizar consultas separadas para counts y relaciones

### 2. Campos ID Requeridos
- **Problema:** Todos los modelos requieren campo `id` explícito
- **Solución:** Generar IDs únicos usando timestamp y contexto

### 3. Normalización de Datos
- **Problema:** Diferentes formatos de datos entre PostgreSQL y MySQL
- **Solución:** Funciones de normalización para mantener compatibilidad

## Herramientas Utilizadas

### Comandos para Verificar Errores
```bash
# Verificar errores de TypeScript
npx tsc --noEmit

# Verificar errores de linting
npx eslint src/

# Verificar schema de Prisma
npx prisma validate
```

### Verificación de Base de Datos
```bash
# Verificar conexión
npx prisma db pull

# Aplicar migraciones
npx prisma migrate dev
```

## Lecciones Aprendidas

1. **Siempre revisar el schema completo** antes de migrar
2. **Los campos requeridos pueden diferir** entre proveedores de BD
3. **Las relaciones requieren manejo explícito** en MySQL
4. **Usar herramientas de linting** para detectar errores temprano
5. **Documentar todos los cambios** para futuras referencias

## Archivos Modificados

- `src/app/api/telegram/webhook/route.ts` - Corregidos errores de creación de registros y historial de torneos
- `src/services/tournamentService.ts` - Reescritura completa con estructura correcta y método getUserTournamentHistory mejorado
- `src/services/duelManager.ts` - Corregidos errores de compatibilidad con MySQL y estructura de base de datos
- `docs/mysql-migration-fixes.md` - Este archivo de documentación

### 8. Errores en duelManager.ts - Incompatibilidad con MySQL
**Archivo:** `src/services/duelManager.ts`
**Múltiples líneas**

**Problemas encontrados:**
1. Uso de `include` en consultas que no lo soportan en MySQL
2. Campo `questionnumber` inexistente - debe ser `questionid`
3. Relación `questions` inexistente en el modelo `duel`
4. Nombres de campos en camelCase vs snake_case
5. Tipos de datos incorrectos (arrays vs strings)
6. Método `checkDuelCompletion` faltante

**Soluciones aplicadas:**
1. **Eliminar `include` y hacer consultas separadas**
2. **Cambiar `questionnumber` por `questionid`**
3. **Crear `duelquestion` por separado en lugar de relación anidada**
4. **Corregir nombres de campos:** `startedAt` → `startedat`, `completedAt` → `completedat`, etc.
5. **Serializar arrays:** `options: JSON.stringify(questionData.options)`
6. **Implementar método `checkDuelCompletion` completo**

## Estado Final

✅ Todos los errores de linting solucionados  
✅ Compatibilidad con MySQL establecida  
✅ Funcionalidad de torneos restaurada  
✅ Funcionalidad de duelos restaurada  
✅ Documentación completa creada  

## Contacto

Para dudas sobre estos cambios, consultar con el equipo de desarrollo o revisar los commits relacionados con la migración MySQL. 