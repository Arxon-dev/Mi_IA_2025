<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Spanish language strings for Telegram Integration plugin.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Integración con Telegram';
$string['telegramintegration'] = 'Integración con Telegram';

// General strings
$string['description'] = 'Conecta tu cuenta de Moodle con Telegram para gamificación unificada y seguimiento de progreso.';
$string['notconnected'] = 'No conectado a Telegram';
$string['connected'] = 'Conectado a Telegram';
$string['connectiondate'] = 'Conectado el: {$a}';

// Verification process
$string['generatecode'] = 'Generar Código de Verificación';
$string['verificationcode'] = 'Tu código de verificación';
$string['codecreated'] = '¡Código de verificación creado exitosamente!';
$string['codeexpires'] = 'El código expira en 15 minutos';
$string['entercode'] = 'Introduce el código de verificación';
$string['verifycode'] = 'Verificar Código';
$string['codeverified'] = '¡Código verificado exitosamente! Tus cuentas están ahora vinculadas.';
$string['invalidcode'] = 'Código de verificación inválido o expirado.';
$string['codeexpired'] = 'Este código de verificación ha expirado. Por favor, genera uno nuevo.';

// Instructions
$string['instructions_title'] = 'Cómo conectar tu cuenta de Telegram:';
$string['step1'] = '1. Copia tu código de verificación de abajo';
$string['step2'] = '2. Abre Telegram y ve a tu bot de estudio';
$string['step3'] = '3. Usa el comando /codigo_moodle';
$string['step4'] = '4. Sigue las instrucciones del bot para introducir tu código';
$string['step5'] = '5. ¡Tus cuentas se vincularán automáticamente!';

// Benefits
$string['benefits_title'] = 'Beneficios de vincular tus cuentas:';
$string['benefit1'] = '✅ Sistema de gamificación unificado';
$string['benefit2'] = '✅ Seguimiento combinado de progreso';
$string['benefit3'] = '✅ Sincronización en tiempo real';
$string['benefit4'] = '✅ Análisis de aprendizaje mejorado';
$string['benefit5'] = '✅ Logros entre plataformas';

// Status messages
$string['telegram_userid'] = 'ID de Usuario Telegram: {$a}';
$string['telegram_username'] = 'Usuario de Telegram: @{$a}';
$string['sync_status'] = 'Estado de Sincronización: Activo';
$string['last_activity'] = 'Última sincronización de actividad: {$a}';

// Errors
$string['error_generating_code'] = 'Error generando código de verificación. Por favor, inténtalo de nuevo.';
$string['error_database'] = 'Error de base de datos. Por favor, contacta al administrador.';
$string['error_already_linked'] = 'Esta cuenta de Telegram ya está vinculada a otro usuario.';
$string['error_connection'] = 'No se pudo conectar a los servicios de Telegram. Por favor, inténtalo más tarde.';

// Settings
$string['settings_title'] = 'Configuración de Integración con Telegram';
$string['telegram_api_url'] = 'URL de API de Telegram';
$string['telegram_api_url_desc'] = 'URL del endpoint de tu bot de Telegram';
$string['webhook_url'] = 'URL de Webhook';
$string['webhook_url_desc'] = 'URL donde se enviarán los datos de finalización de cuestionarios';

// Privacy
$string['privacy:metadata'] = 'El plugin de Integración con Telegram almacena datos de verificación de usuario para vincular cuentas de Moodle y Telegram.';
$string['privacy:metadata:local_telegram_verification'] = 'Almacena códigos de verificación e información de vinculación.';
$string['privacy:metadata:local_telegram_verification:moodle_userid'] = 'El ID de usuario de Moodle.';
$string['privacy:metadata:local_telegram_verification:telegram_userid'] = 'El ID de usuario de Telegram.';
$string['privacy:metadata:local_telegram_verification:verification_code'] = 'El código de verificación usado para la vinculación.';
$string['privacy:metadata:local_telegram_verification:created_at'] = 'Cuándo fue creado el código de verificación.';

// Buttons
$string['disconnect'] = 'Desconectar de Telegram';
$string['reconnect'] = 'Reconectar a Telegram';
$string['refresh_status'] = 'Actualizar Estado';

// ML Analytics page
$string['mlanalytics'] = 'Análisis Predictivo ML';
$string['mlanalytics_title'] = 'Análisis Predictivo con Machine Learning';
$string['mlanalytics_description'] = 'Análisis avanzado de tu rendimiento académico usando algoritmos de Machine Learning para predecir tu éxito y optimizar tu estudio.';

// Navigation tabs
$string['predictive_tab'] = 'Análisis Predictivo';
$string['predictive_tab_desc'] = 'Probabilidad de éxito y áreas de riesgo';
$string['learning_tab'] = 'Métricas de Aprendizaje';
$string['learning_tab_desc'] = 'Curvas de aprendizaje y patrones de retención';
$string['optimization_tab'] = 'Optimización de Estudio';
$string['optimization_tab_desc'] = 'Horarios óptimos y secuencias inteligentes';
$string['social_tab'] = 'Análisis Social';
$string['social_tab_desc'] = 'Comparativa con otros usuarios y grupos de estudio';

// Predictive analysis
$string['success_probability'] = 'Probabilidad de Éxito';
$string['success_probability_desc'] = 'Basado en tu rendimiento actual y patrones de estudio';
$string['weak_areas'] = 'Áreas de Riesgo Detectadas';
$string['weak_areas_desc'] = 'Materias que requieren atención adicional';
$string['recommendations'] = 'Recomendaciones Personalizadas';
$string['recommendations_desc'] = 'Sugerencias basadas en análisis de Machine Learning';
$string['confidence_level'] = 'Nivel de Confianza';
$string['risk_high'] = 'Alto Riesgo';
$string['risk_medium'] = 'Riesgo Medio';
$string['risk_low'] = 'Bajo Riesgo';

// Learning metrics
$string['learning_curves'] = 'Curvas de Aprendizaje';
$string['learning_curves_desc'] = 'Progreso de aprendizaje por materia a lo largo del tiempo';
$string['retention_analysis'] = 'Análisis de Retención';
$string['retention_analysis_desc'] = 'Curva de retención de conocimiento';
$string['forgetting_patterns'] = 'Patrones de Olvido y Refuerzo';
$string['forgetting_patterns_desc'] = 'Análisis de patrones de olvido y recomendaciones de repaso';
$string['retention_immediate'] = 'Retención Inmediata';
$string['retention_1day'] = 'Después de 1 Día';
$string['retention_1week'] = 'Después de 1 Semana';
$string['retention_1month'] = 'Después de 1 Mes';

// Optimization
$string['optimal_schedule'] = 'Horario Óptimo Personal';
$string['optimal_schedule_desc'] = 'Horarios de estudio personalizados basados en tu rendimiento histórico';
$string['subject_sequencing'] = 'Secuenciación Inteligente';
$string['subject_sequencing_desc'] = 'Orden óptimo de materias para maximizar el aprendizaje';
$string['fatigue_detection'] = 'Detección de Fatiga Mental';
$string['fatigue_detection_desc'] = 'Análisis de patrones de fatiga y recomendaciones de descanso';
$string['optimal_session_length'] = 'Duración Óptima de Sesión';
$string['break_frequency'] = 'Frecuencia de Descansos';
$string['peak_performance'] = 'Horario de Máximo Rendimiento';

// Social analysis
$string['benchmarking'] = 'Benchmarking Anónimo';
$string['benchmarking_desc'] = 'Comparación anónima con usuarios de nivel similar';
$string['success_strategies'] = 'Estrategias Exitosas';
$string['success_strategies_desc'] = 'Patrones identificados en usuarios con mejores resultados';
$string['study_groups'] = 'Grupos de Estudio Compatibles';
$string['study_groups_desc'] = 'Formación automática de grupos de estudio basada en compatibilidad';
$string['your_percentile'] = 'Tu Percentil';
$string['similar_users_avg'] = 'Promedio de Usuarios Similares';
$string['top_10_percent'] = 'Top 10%';
$string['compatibility_score'] = 'Puntuación de Compatibilidad';
$string['group_members'] = 'Miembros del Grupo';

// Error messages
$string['connection_required'] = 'Conexión Requerida';
$string['connection_required_desc'] = 'Para acceder al análisis predictivo, necesitas vincular tu cuenta de Telegram con Moodle.';
$string['link_account'] = 'Vincular Cuenta Telegram';
$string['error_loading_data'] = 'Error cargando datos';
$string['error_predictive'] = 'Error cargando análisis predictivo';
$string['error_learning'] = 'Error cargando métricas de aprendizaje';
$string['error_optimization'] = 'Error cargando datos de optimización';
$string['error_social'] = 'Error cargando análisis social';
$string['retry'] = 'Reintentar';

// Status messages
$string['loading'] = 'Cargando...';
$string['loading_predictive'] = 'Cargando análisis predictivo...';
$string['loading_learning'] = 'Analizando métricas de aprendizaje...';
$string['loading_optimization'] = 'Calculando optimizaciones...';
$string['loading_social'] = 'Generando análisis social...';
$string['last_updated'] = 'Última actualización: {$a}';

// ML insights
$string['ml_insight_accuracy'] = 'Tu precisión está {$a}% por encima del promedio';
$string['ml_insight_consistency'] = 'Tu consistencia de estudio es {$a}';
$string['ml_insight_improvement'] = 'Mejora detectada del {$a}% en las últimas 2 semanas';
$string['ml_insight_weak_area'] = 'Área que necesita atención: {$a}';
$string['ml_insight_strength'] = 'Fortaleza identificada: {$a}';

// Recommendations
$string['rec_increase_practice'] = 'Incrementar práctica en {$a} (+{$b} preguntas/día)';
$string['rec_review_concepts'] = 'Revisar conceptos de {$a} cada {$b} días';
$string['rec_maintain_pace'] = 'Mantener ritmo actual en {$a}';
$string['rec_increase_frequency'] = 'Aumentar frecuencia de estudio a {$a} días por semana';
$string['rec_excellent_consistency'] = 'Excelente consistencia, mantén el ritmo actual';
$string['rec_spaced_repetition'] = 'Usar técnica de repaso espaciado para mejorar retención';
$string['rec_combined_study'] = 'Combinar estudio Telegram+Moodle para mejores resultados';

// Charts and visualizations
$string['chart_learning_progress'] = 'Progreso de Aprendizaje por Materia';
$string['chart_retention_curve'] = 'Curva de Retención de Conocimiento';
$string['chart_optimal_schedule'] = 'Horario Óptimo de Estudio';
$string['chart_fatigue_pattern'] = 'Patrón de Fatiga Mental';
$string['chart_performance_comparison'] = 'Comparativa de Rendimiento';

// Time periods
$string['period_immediate'] = 'Inmediato';
$string['period_1day'] = '1 Día';
$string['period_1week'] = '1 Semana';
$string['period_1month'] = '1 Mes';
$string['period_week'] = 'Semana {$a}';

// Performance levels
$string['performance_excellent'] = 'Excelente';
$string['performance_good'] = 'Bueno';
$string['performance_average'] = 'Promedio';
$string['performance_needs_improvement'] = 'Necesita Mejora';

// Study patterns
$string['pattern_morning_learner'] = 'Aprendiz Matutino';
$string['pattern_afternoon_learner'] = 'Aprendiz Vespertino';
$string['pattern_evening_learner'] = 'Aprendiz Nocturno';
$string['pattern_consistent_learner'] = 'Aprendiz Consistente';
$string['pattern_intensive_learner'] = 'Aprendiz Intensivo';

// Navigation
$string['nav_back_to_verification'] = 'Volver a Verificación';
$string['nav_ml_analytics'] = 'Análisis Predictivo ML';
$string['nav_dashboard'] = 'Panel de Control';

// Permissions
$string['telegram_integration:view'] = 'Ver integración con Telegram';
$string['telegram_integration:manage'] = 'Gestionar integración con Telegram';
$string['telegram_integration:analytics'] = 'Acceder a análisis predictivo ML'; 