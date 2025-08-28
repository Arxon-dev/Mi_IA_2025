#!/bin/bash

# Script para generar y aplicar la migración robusta de Telegram
echo "Generando migración para el sistema robusto de envío de preguntas a Telegram..."

# Generar la migración
npx prisma migrate dev --name telegram_robust_system

# Verificar si la migración se generó correctamente
if [ $? -eq 0 ]; then
  echo "✅ Migración generada y aplicada correctamente"
  echo "Los siguientes cambios se han realizado en la base de datos:"
  echo "1. Añadido campo 'sendCount' a Question y SectionQuestion"
  echo "2. Añadido campo 'lastSuccessfulSendAt' a Question y SectionQuestion"
  echo "3. Creada nueva tabla 'TelegramSendLog' para rastrear envíos"
  echo ""
  echo "El sistema ahora es más robusto contra envíos duplicados con las siguientes mejoras:"
  echo "- Registro preciso de cada envío exitoso"
  echo "- Contador de envíos para priorizar preguntas menos enviadas"
  echo "- Período mínimo de espera configurable antes de reenviar la misma pregunta"
  echo "- Historial completo de envíos para análisis"
else
  echo "❌ Error al generar la migración"
  echo "Puedes intentar aplicar los cambios manualmente con:"
  echo "npx prisma migrate dev"
fi 