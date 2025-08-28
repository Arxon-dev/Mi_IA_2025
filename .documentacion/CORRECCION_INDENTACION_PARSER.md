# 🔧 Corrección: Parser GIFT e Indentación de Opciones

## 🚨 **Problema Específico Identificado**

Las preguntas archivadas mostraban el error:
```
❌ Error al procesar pregunta
No se encontraron opciones válidas en el formato correcto (=opción_correcta o ~opción_incorrecta)
```

Pero al revisar el contenido original, el formato parecía correcto.

## 🔍 **Causa Raíz**

### **Problema**: Indentación en las Opciones

El parser GIFT original no manejaba correctamente la **indentación** (espacios y tabulaciones) antes de las opciones de respuesta.

#### **Contenido Real de las Preguntas Archivadas**:
```gift
OTAN\n(SEÑALA LA RESPUESTA FALSA). Según el texto, sobre los hitos históricos de la OTAN:{
	~Francia llegó a abandonar la estructura militar integrada de la OTAN en 1966.
	~España ingresó en la OTAN el 30 mayo 1982.
	=La OTAN desplegó su primera misión de paz, la IFOR, en Kosovo en diciembre de 1995.
	~La OTAN asume el mando de la ISAF en Afganistán en 2003.
}
```

**Observa**: Las opciones empiezan con **tabulaciones** (`\t`) antes de `=` y `~`.

#### **Parser Original (Problemático)**:
```typescript
// ❌ ANTES: Solo buscaba líneas que empezaran directamente con = o ~
const optMatch = line.match(/^([=~])\s*(.*)$/);
```

Esta expresión regular:
- `^` = Inicio de línea
- `([=~])` = Busca `=` o `~` **inmediatamente** al inicio
- **NO** considera espacios o tabulaciones antes de `=` o `~`

## ✅ **Solución Implementada**

### **Parser Corregido**:
```typescript
// ✅ DESPUÉS: Permite espacios y tabulaciones antes de = o ~
const optMatch = line.match(/^\s*([=~])\s*(.*)$/);
```

Esta expresión regular corregida:
- `^` = Inicio de línea
- `\s*` = **Cero o más espacios/tabulaciones** (esto es la clave)
- `([=~])` = Busca `=` o `~` después de la indentación
- `\s*(.*)$` = Resto del contenido de la opción

### **Qué Cambió**:

| Antes | Después | Resultado |
|-------|---------|-----------|
| `/^([=~])\s*(.*)$/` | `/^\s*([=~])\s*(.*)$/` | ✅ Reconoce opciones indentadas |
| Fallaba con `\t~Opción` | Funciona con `\t~Opción` | ✅ Parser robusto |
| Error en preguntas archivadas | Parsea correctamente | ✅ Problema resuelto |

## 🎯 **Casos de Uso Soportados Ahora**

### **✅ Opciones Sin Indentación** (ya funcionaba):
```gift
{
=Opción correcta
~Opción incorrecta 1
~Opción incorrecta 2
}
```

### **✅ Opciones Con Espacios** (ahora funciona):
```gift
{
  =Opción correcta
  ~Opción incorrecta 1
  ~Opción incorrecta 2
}
```

### **✅ Opciones Con Tabulaciones** (ahora funciona):
```gift
{
	=Opción correcta
	~Opción incorrecta 1
	~Opción incorrecta 2
}
```

### **✅ Opciones Con Indentación Mixta** (ahora funciona):
```gift
{
    =Opción correcta
	~Opción incorrecta 1
  ~Opción incorrecta 2
}
```

## 🔧 **Debugging Mejorado**

Con la corrección, los logs en consola ahora mostrarán:

### **Antes** (Fallaba):
```
[GIFT Parser] Opciones raw extraídas: "\n\t~Francia llegó a abandonar...\n\t~España ingresó..."
[GIFT Parser] Total opciones encontradas: 0
[GIFT Parser] ❌ Error durante el parseo: No se encontraron opciones válidas
```

### **Después** (Funciona):
```
[GIFT Parser] Opciones raw extraídas: "\n\t~Francia llegó a abandonar...\n\t~España ingresó..."
[GIFT Parser] Opción agregada: INCORRECTA - "Francia llegó a abandonar la estructura militar..."
[GIFT Parser] Opción agregada: INCORRECTA - "España ingresó en la OTAN el 30 mayo 1982..."
[GIFT Parser] Opción agregada: CORRECTA - "La OTAN desplegó su primera misión de paz..."
[GIFT Parser] Total opciones encontradas: 4
[GIFT Parser] ✅ Parseo completado exitosamente
```

## 📋 **Verificación**

Para verificar que la corrección funciona:

1. **Abre las herramientas de desarrollador** (F12)
2. **Ve a la pestaña Console**
3. **Activa "Mostrar archivadas"** en la interfaz
4. **Observa los logs** - deberías ver:
   - `[GIFT Parser] Opción agregada: CORRECTA/INCORRECTA - "..."`
   - `[GIFT Parser] ✅ Parseo completado exitosamente`
5. **Las opciones ahora se muestran correctamente** en Vista Moodle

---

**✅ Problema específico resuelto**: El parser GIFT ahora maneja correctamente la indentación en las opciones de respuesta, solucionando el error en las preguntas archivadas. 