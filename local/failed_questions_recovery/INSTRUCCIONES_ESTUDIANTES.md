# 🎓 **Guía del Estudiante - Sistema de Recuperación de Preguntas**

## 🚀 **¿Qué es este sistema?**

Un sistema inteligente que **guarda automáticamente las preguntas que fallas** en los quiz de Moodle y te permite **crear cuestionarios personalizados** para practicar solo lo que necesitas estudiar.

---

## 📋 **Flujo de Trabajo Simple**

### **1️⃣ Realiza tu Quiz Normal**
- Haz cualquier quiz del curso como siempre
- El sistema detecta automáticamente las preguntas que fallas

### **2️⃣ Procesa el Quiz (1 clic)**
- Ve a: **`/local/failed_questions_recovery/student_dashboard.php`**
- Si aparece tu quiz reciente → Haz clic en **"✅ Procesar"**
- Esto guarda tus preguntas falladas para practicar después

### **3️⃣ Practica tus Errores**
- En el mismo dashboard verás temas con preguntas pendientes
- Haz clic en **"🎯 Practicar"** en cualquier tema
- El sistema genera un quiz personalizado **solo con preguntas que fallaste**

### **4️⃣ Mejora tu Progreso**
- Cuando respondas correctamente, las preguntas se marcan como "dominadas"
- Tu progreso se actualiza automáticamente

---

## 🔗 **Enlaces Importantes**

| Enlace | ¿Para qué? |
|--------|------------|
| **`student_dashboard.php`** | 🏠 Tu dashboard principal (más simple) |
| **`index.php`** | 📊 Dashboard completo (más técnico) |
| **`debug_observer.php`** | 🔧 Procesar quiz manualmente |
| **`create_quiz.php`** | 📝 Crear cuestionarios de recuperación |

---

## ⚠️ **Importante: ¿Cuándo "Procesar"?**

**SIEMPRE después de cada quiz:**
- El sistema NO procesa automáticamente (requiere permisos de administrador)
- **TÚ debes procesar manualmente** cada quiz que completes
- **Solo toma 1 clic** y unos segundos

### **¿Cómo saber si necesito procesar?**
✅ **En `student_dashboard.php` aparecerá:**
```
📝 Tienes quiz recientes que necesitan procesarse:
[NOMBRE DEL QUIZ] - Completado: 15/01/2025 10:30
[Botón: ✅ Procesar]
```

❌ **Si no aparece nada:**
```
✅ ¡Perfecto! Todos tus quiz recientes ya están procesados.
```

---

## 📊 **¿Qué veo en mi Dashboard?**

### **Paso 1: Quiz Pendientes de Procesar**
- Lista de quiz recientes sin procesar
- Botón "Procesar" para cada uno

### **Paso 2: Mis Temas Pendientes**
```
📚 DOCTRINA - TEST 1    📚 DEFENSA NACIONAL - TEST 2
   5 preguntas              3 preguntas
   [🎯 Practicar]          [🎯 Practicar]
```

### **Paso 3: Mi Progreso**
```
[15] Total Falladas  [8] Ya Dominadas  [7] Pendientes
         Tu progreso: 53.3%
[████████████░░░░░░░░░░░░░]
```

---

## 🎯 **¿Cómo Crear Quiz de Recuperación?**

### **Opción 1: Desde Dashboard de Estudiante**
1. Ve a `student_dashboard.php`
2. Busca el tema que quieres practicar
3. Haz clic en **"🎯 Practicar"**
4. ¡Listo! Se genera automáticamente

### **Opción 2: Manualmente**
1. Ve a `create_quiz.php`
2. Selecciona la categoría (tema)
3. Elige cuántas preguntas quieres
4. Haz clic en **"Crear Quiz de Recuperación"**

---

## 🔧 **Resolución de Problemas**

### **❓ No aparece mi quiz para procesar**
- Ve a `debug_observer.php`
- Busca tu quiz en "Attempts recientes sin procesar"
- Haz clic en **"🔄 Forzar"**

### **❓ No veo preguntas en ningún tema**
- Verifica que hayas procesado los quiz primero
- Revisa que efectivamente hayas fallado preguntas

### **❓ Las categorías aparecen como "S1", "S2", "W2"**
- Ve a `fix_category_names_complete.php` 
- Haz clic en **"🔧 Corregir Todos los Nombres"**
- O desde tu dashboard: botón **"🔧 Corregir Nombres"**

### **❓ Dashboard no carga o da error**
- Asegúrate de estar logueado en Moodle
- Ve a `index.php` (dashboard técnico) para más detalles
- Contacta al administrador si persiste

---

## 📚 **Consejos de Estudio**

### **🎯 Enfoque Estratégico**
- **Prioriza temas con más preguntas falladas**
- Practica regularmente, no todo de una vez
- Cuando domines un tema (0 pendientes), enfócate en el siguiente

### **📈 Seguimiento de Progreso**
- Revisa tu dashboard semanalmente
- Meta: Llegar a 80-90% de preguntas dominadas
- Las preguntas dominadas no desaparecen, pero ya no necesitas practicarlas

### **🔄 Rutina Recomendada**
1. **Después de estudiar:** Haz quiz del tema
2. **Inmediatamente:** Procesa el quiz (1 clic)
3. **Siguiente día:** Practica las preguntas falladas
4. **Fin de semana:** Revisión general de temas pendientes

---

## 🆘 **¿Necesitas Ayuda?**

### **Para problemas técnicos:**
- Usa el `debug_observer.php` para diagnóstico
- Revisa este documento para soluciones comunes
- Contacta al administrador del curso

### **Para dudas de estudio:**
- El sistema es una herramienta, no un sustituto del estudio
- Úsalo como complemento a tus métodos habituales
- Enfócate en entender POR QUÉ fallaste cada pregunta

---

## ✅ **Checklist de Uso Diario**

- [ ] ¿Completé algún quiz hoy?
- [ ] ¿Procesé todos los quiz en `student_dashboard.php`?
- [ ] ¿Revisé mis temas pendientes?
- [ ] ¿Practiqué al menos un tema con preguntas falladas?
- [ ] ¿Verificé mi progreso general?

---

**🎓 ¡Con esta herramienta, convierte cada error en una oportunidad de aprendizaje personalizada!** 