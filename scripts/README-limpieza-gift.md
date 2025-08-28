# Script de Limpieza de Archivos GIFT

## 📝 Descripción

Este directorio contiene scripts para limpiar archivos GIFT que contienen metadatos innecesarios, eliminando duplicaciones y manteniendo solo el formato GIFT puro.

## 🧹 Problema Resuelto

### Formato Original (Sucio):
```gift
// question: 24427  name: DEFENSA NACIONAL
¿Cuál es el objeto principal de la Ley Orgánica 5/2005, de ...
::DEFENSA NACIONAL\n¿Cuál es el objeto principal de la Ley Orgánica 5/2005, de ...::<b>DEFENSA NACIONAL</b><br><br>\n¿Cuál es el objeto principal de la Ley Orgánica 5/2005, de 17 de noviembre, de la Defensa Nacional?{
	=Regular la defensa nacional y establecer las bases de la organización militar conforme a los principios constitucionales.
	~%-33.33333%Establecer el régimen de personal de las Fuerzas Armadas y sus derechos y deberes.
	~%-33.33333%Definir la estructura y funciones del Ministerio del Interior en relación con la seguridad ciudadana.
	~%-33.33333%Regular exclusivamente la participación de las Fuerzas Armadas en misiones internacionales.
	####RETROALIMENTACIÓN\:<br><br>\nEl artículo 1 de la Ley Orgánica 5/2005 establece que su objeto es "regular la defensa nacional y establece las bases de la organización militar conforme a los principios establecidos en la Constitución."
}
```

### Formato Final (Limpio):
```gift
<b>DEFENSA NACIONAL</b><br><br>
¿Cuál es el objeto principal de la Ley Orgánica 5/2005, de 17 de noviembre, de la Defensa Nacional?{
	=Regular la defensa nacional y establecer las bases de la organización militar conforme a los principios constitucionales.
	~%-33.33333%Establecer el régimen de personal de las Fuerzas Armadas y sus derechos y deberes.
	~%-33.33333%Definir la estructura y funciones del Ministerio del Interior en relación con la seguridad ciudadana.
	~%-33.33333%Regular exclusivamente la participación de las Fuerzas Armadas en misiones internacionales.
	####RETROALIMENTACIÓN:<br><br>
El artículo 1 de la Ley Orgánica 5/2005 establece que su objeto es "regular la defensa nacional y establece las bases de la organización militar conforme a los principios establecidos en la Constitución."
}
```

## 🚀 Scripts Disponibles

### 1. **Script Flexible (RECOMENDADO)** - `clean-gift-flexible.js`

✅ **Acepta cualquier archivo como argumento**

#### Uso:
```bash
# Sintaxis básica
node scripts/clean-gift-flexible.js <archivo-entrada> [archivo-salida]

# Ejemplos prácticos:
node scripts/clean-gift-flexible.js mi-archivo.gift
node scripts/clean-gift-flexible.js docs/preguntas.gift  
node scripts/clean-gift-flexible.js entrada.gift salida-limpia.gift
node scripts/clean-gift-flexible.js docs/entrada.gift docs/salida.gift

# Ver ayuda
node scripts/clean-gift-flexible.js --help
```

#### Características:
- ✅ Acepta rutas relativas y absolutas
- ✅ Si no especificas salida, añade "-LIMPIO" al nombre
- ✅ Validación de archivos existentes
- ✅ Previene sobrescribir el archivo original
- ✅ Manejo de errores robusto

### 2. **Script Fijo** - `clean-gift-questions-v2.js`

⚠️ **Archivo hardcodeado - requiere edición manual**

#### Para usarlo con otro archivo:
1. Edita el archivo `scripts/clean-gift-questions-v2.js`
2. Cambia las líneas 129-130:
```javascript
const inputFile = path.join(__dirname, '..', 'docs', 'TU_ARCHIVO_AQUI.gift');
const outputFileV2 = path.join(__dirname, '..', 'docs', 'TU_ARCHIVO_AQUI-LIMPIO-V2.gift');
```
3. Ejecuta: `node scripts/clean-gift-questions-v2.js`

## 📊 Lo que Eliminan los Scripts

1. **Comentarios de metadatos**: `// question: 24427 name: DEFENSA NACIONAL`
2. **Líneas truncadas**: `¿Cuál es el objeto principal de la Ley Orgánica 5/2005, de ...`
3. **Bloques duplicados**: `::DEFENSA NACIONAL\n¿Cuál...::`
4. **Caracteres de escape**: `\n`, `\:`

## 📈 Resultados Típicos

- **Reducción de líneas**: ~60-70%
- **Reducción de tamaño**: ~50-60%
- **Preguntas procesadas**: 100% de las válidas
- **Tiempo de ejecución**: < 1 segundo para archivos típicos

## 🔧 Comandos de Ejemplo

### Para limpiar cualquier archivo nuevo:

```bash
# Ejemplo 1: Archivo en docs/
node scripts/clean-gift-flexible.js docs/nuevo-archivo.gift

# Ejemplo 2: Archivo en cualquier carpeta
node scripts/clean-gift-flexible.js /ruta/completa/mi-archivo.gift

# Ejemplo 3: Especificar nombre de salida
node scripts/clean-gift-flexible.js archivo-sucio.gift archivo-ultra-limpio.gift
```

### Para ver ayuda:
```bash
node scripts/clean-gift-flexible.js --help
```

## ✅ Verificación Post-Limpieza

Después de ejecutar el script:

1. **Revisa el archivo de salida** - Verifica que las preguntas estén completas
2. **Prueba en Moodle** - Importa unas pocas preguntas para validar el formato
3. **Compara estadísticas** - El script muestra la reducción de tamaño y líneas
4. **Renombra si es necesario** - Si todo está correcto, puedes reemplazar el original

## 🛡️ Seguridad

- ✅ **Nunca sobrescribe el archivo original**
- ✅ **Valida la existencia del archivo de entrada**  
- ✅ **Genera nombres únicos para evitar conflictos**
- ✅ **Manejo robusto de errores**

## 📞 Solución de Problemas

### Error: "No se encontró el archivo"
- Verifica que la ruta esté correcta
- Asegúrate de que el archivo existe
- Revisa los permisos de lectura

### Error: "No se procesaron preguntas"
- Verifica que el archivo tenga el formato esperado
- Busca líneas que empiecen con `// question:`
- Asegúrate de que haya bloques `<b>TITULO</b><br><br>`

### Error: "Archivo de salida igual al de entrada"
- Especifica un nombre diferente para el archivo de salida
- O usa el script sin especificar salida (añade "-LIMPIO" automáticamente)

---

## 🎯 Conclusión

**Para uso diario recomendamos el script flexible** `clean-gift-flexible.js` ya que:
- Es más fácil de usar
- No requiere edición del código
- Tiene mejor manejo de errores
- Acepta cualquier archivo

El script fijo queda como alternativa para casos específicos donde necesites personalizar la lógica de limpieza. 