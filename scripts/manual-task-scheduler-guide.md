# 📋 Configuración Manual del Task Scheduler - Paso a Paso

## 🎯 **Si el Script Automático Falla**

Sigue estos pasos para configurar manualmente las tareas programadas:

## **PASO 1: Abrir Task Scheduler**

1. **Presionar** `Windows + R`
2. **Escribir** `taskschd.msc`
3. **Presionar** `Enter`
4. Se abre el **Programador de tareas**

## **PASO 2: Crear Primera Tarea (Ranking Intermedio)**

### 2.1 Crear Tarea Básica
1. En el panel derecho → **"Crear tarea básica..."**
2. **Nombre**: `Telegram Bot - Ranking Mensual Intermedio`
3. **Descripción**: `Envía ranking TOP 8 cada 3 días`
4. **Siguiente**

### 2.2 Configurar Desencadenador
1. **Seleccionar**: "Diariamente"
2. **Siguiente**
3. **Fecha de inicio**: Hoy
4. **Hora**: `10:00:00`
5. **Repetir cada**: `3` días
6. **Siguiente**

### 2.3 Configurar Acción
1. **Seleccionar**: "Iniciar un programa"
2. **Siguiente**
3. **Programa/script**: `powershell.exe`
4. **Agregar argumentos**: 
   ```
   -ExecutionPolicy Bypass -File "F:\Permanencia\Perma2024\PROYECTOS_OPOMELILLA\Mi_IA_11_38_Telegram_Moodle\scripts\auto-monthly-ranking-cron.ps1" -Mode intermediate
   ```
5. **Iniciar en**: 
   ```
   F:\Permanencia\Perma2024\PROYECTOS_OPOMELILLA\Mi_IA_11_38_Telegram_Moodle
   ```
6. **Siguiente**

### 2.4 Finalizar
1. **Marcar**: "Abrir el cuadro de diálogo Propiedades..."
2. **Finalizar**

### 2.5 Configuraciones Avanzadas
En el cuadro de propiedades que se abre:

1. **Pestaña "General"**:
   - ✅ Marcar "Ejecutar con los privilegios más altos"
   - ✅ Marcar "Ejecutar tanto si el usuario ha iniciado sesión como si no"

2. **Pestaña "Configuración"**:
   - ✅ Marcar "Permitir que la tarea se ejecute a petición"
   - ✅ Marcar "Ejecutar la tarea lo antes posible después de un inicio programado perdido"

3. **Aceptar**

## **PASO 3: Crear Segunda Tarea (Notificación Reinicio)**

### 3.1 Crear Tarea Básica
1. **"Crear tarea básica..."**
2. **Nombre**: `Telegram Bot - Notificacion Reinicio Mensual`
3. **Descripción**: `Notifica reinicio ranking el día 1 de cada mes`
4. **Siguiente**

### 3.2 Configurar Desencadenador
1. **Seleccionar**: "Mensualmente"
2. **Siguiente**
3. **Meses**: Marcar **TODOS** los meses
4. **Días**: Seleccionar **"1"**
5. **Hora**: `09:00:00`
6. **Siguiente**

### 3.3 Configurar Acción
1. **Seleccionar**: "Iniciar un programa"
2. **Siguiente**
3. **Programa/script**: `powershell.exe`
4. **Agregar argumentos**: 
   ```
   -ExecutionPolicy Bypass -File "F:\Permanencia\Perma2024\PROYECTOS_OPOMELILLA\Mi_IA_11_38_Telegram_Moodle\scripts\auto-monthly-ranking-cron.ps1" -Mode reset
   ```
5. **Iniciar en**: 
   ```
   F:\Permanencia\Perma2024\PROYECTOS_OPOMELILLA\Mi_IA_11_38_Telegram_Moodle
   ```
6. **Siguiente**

### 3.4 Finalizar y Configurar
1. **Marcar**: "Abrir el cuadro de diálogo Propiedades..."
2. **Finalizar**
3. **Repetir configuraciones avanzadas** del Paso 2.5
4. **Aceptar**

## **PASO 4: Verificar Tareas Creadas**

1. En Task Scheduler → **"Biblioteca del Programador de tareas"**
2. Deberías ver las 2 tareas creadas:
   - `Telegram Bot - Ranking Mensual Intermedio`
   - `Telegram Bot - Notificacion Reinicio Mensual`

## **PASO 5: Probar Ejecución Manual**

1. **Clic derecho** en cada tarea
2. **Seleccionar** "Ejecutar"
3. Verificar que se ejecuten sin errores

## ✅ **Verificación Final**

Las tareas deben aparecer con:
- ✅ **Estado**: "Preparado"
- ✅ **Próxima ejecución**: Fechas correctas
- ✅ **Última ejecución**: Si las probaste manualmente

## 🚨 **Troubleshooting**

### Error "No se puede encontrar el archivo"
- Verificar que las rutas sean exactas
- Asegurar que no hay espacios extra
- Comprobar que los archivos existen

### Error de permisos
- Verificar que marcaste "Ejecutar con privilegios más altos"
- Ejecutar Task Scheduler como administrador

### Variables de entorno
- Asegurar que tu archivo `.env` contiene:
  ```
  TELEGRAM_BOT_TOKEN=tu_token
  TELEGRAM_CHAT_ID=tu_chat_id
  ```

## 🎉 **¡Configuración Completa!**

Una vez configurado, tendrás:
- **Ranking intermedio**: Cada 3 días a las 10:00 AM
- **Notificación reinicio**: Día 1 de cada mes a las 9:00 AM

**¡Tu ranking mensual automatizado estará funcionando!** 🚀 