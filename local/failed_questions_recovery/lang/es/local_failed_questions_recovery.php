<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Recuperación de preguntas falladas';
$string['failed_questions_recovery'] = 'Recuperación de preguntas falladas';
$string['failed_questions_recovery:use'] = 'Usar recuperación de preguntas falladas';
$string['failed_questions_recovery:view'] = 'Ver preguntas falladas';
$string['failed_questions_recovery:manage'] = 'Gestionar preguntas falladas';

// Navigation
$string['recovery_dashboard'] = 'Panel de recuperación';
$string['recoveryboard'] = 'Panel de recuperación';
$string['my_failed_questions'] = 'Mis preguntas falladas';
$string['failed_questions'] = 'Preguntas falladas';
$string['recovery_quizzes'] = 'Cuestionarios de recuperación';
$string['create_recovery_quiz'] = 'Crear cuestionario de recuperación';
$string['take_quiz'] = 'Realizar cuestionario';
$string['quiz_completed'] = 'Cuestionario completado';
$string['quiz_score'] = 'Puntuación del cuestionario';
$string['completion_date'] = 'Fecha de completado';
$string['pending_quizzes'] = 'Cuestionarios pendientes';
$string['retake_quiz'] = 'Repetir cuestionario';
$string['view_quiz'] = 'Ver cuestionario';
$string['total_failed_questions'] = 'Total de preguntas falladas';
$string['mastered_questions'] = 'Preguntas dominadas';
$string['not_mastered_questions'] = 'Preguntas no dominadas';
$string['attempts'] = 'Intentos';
$string['last_failed'] = 'Último fallo';
$string['categories'] = 'Categorías';
$string['category'] = 'Categoría';
$string['question_count'] = 'Número de preguntas';
$string['no_failed_questions'] = 'No tienes preguntas falladas en esta categoría';
$string['no_questions_available'] = 'No hay preguntas disponibles';
$string['all_categories'] = 'Todas las categorías';
$string['failed_questions_count'] = 'Preguntas falladas';
$string['not_mastered_count'] = 'No dominadas';
$string['filter'] = 'Filtrar';
$string['now'] = 'ahora';
$string['minutes'] = 'minutos';
$string['hours'] = 'horas';
$string['yesterday'] = 'ayer';
$string['time_ago'] = 'hace {$a}';
$string['days_ago'] = 'hace {$a} días';
$string['months_ago'] = 'hace {$a} meses';

// Quiz creation
$string['quiz_name'] = 'Nombre del cuestionario';
$string['max_questions'] = 'Máximo {$a} preguntas';
$string['generate_quiz'] = 'Generar cuestionario';
$string['quiz_created'] = 'Cuestionario de recuperación creado exitosamente';
$string['no_failed_questions_in_category'] = 'No hay preguntas falladas en esta categoría';

// Question details
$string['question_text'] = 'Texto de la pregunta';
$string['question_type'] = 'Tipo de pregunta';
$string['mark_as_mastered'] = 'Marcar como dominada';

// Quiz management
$string['completed_quizzes'] = 'Cuestionarios completados';
$string['pending_quizzes'] = 'Cuestionarios pendientes';
$string['retake_quiz'] = 'Repetir cuestionario';
$string['view_quiz'] = 'Ver cuestionario';
$string['delete_quiz'] = 'Eliminar cuestionario';

// Statistics
$string['recovery_rate'] = 'Tasa de recuperación';
$string['average_score'] = 'Puntuación promedio';
$string['last_activity'] = 'Última actividad';

// Messages
$string['question_mastered'] = 'Pregunta dominada';
$string['question_not_mastered'] = 'Pregunta no dominada';
$string['quiz_deleted'] = 'Cuestionario eliminado';
$string['recovery_progress'] = 'Progreso de recuperación';

// Errors
$string['error_creating_quiz'] = 'Error al crear el cuestionario';
$string['error_completing_quiz'] = 'Error al completar el cuestionario';
$string['error_loading_questions'] = 'Error al cargar las preguntas';
$string['quiz_not_found'] = 'Cuestionario no encontrado';
$string['nofailedquestions'] = 'No se encontraron preguntas falladas';
$string['quiznotfound'] = 'Cuestionario no encontrado';

// Settings
$string['settings'] = 'Configuración';
$string['enable_auto_mastery'] = 'Habilitar dominio automático';
$string['enable_auto_mastery_desc'] = 'Marcar automáticamente las preguntas como dominadas cuando se responden correctamente';
$string['mastery_threshold'] = 'Umbral de dominio';
$string['mastery_threshold_desc'] = 'Puntuación mínima para considerar una pregunta como dominada';
$string['max_recovery_questions'] = 'Máximo de preguntas de recuperación';
$string['max_recovery_questions_desc'] = 'Número máximo de preguntas que se pueden incluir en un cuestionario de recuperación';

// Configuraciones
$string['enable_logging'] = 'Habilitar registro de eventos';
$string['enable_logging_desc'] = 'Activa el registro detallado de eventos del sistema para debugging y monitoreo. Recomendado mantener activado.';
$string['default_quiz_questions'] = 'Preguntas por quiz por defecto';
$string['default_quiz_questions_desc'] = 'Número predeterminado de preguntas que aparecerán en cada quiz de recuperación. Los usuarios pueden ajustar esto al crear un quiz.';
$string['cleanup_days'] = 'Días para limpieza automática';
$string['cleanup_days_desc'] = 'Número de días después de los cuales se eliminarán automáticamente los registros antiguos de quiz de recuperación. Use 0 para deshabilitar la limpieza automática';

// Pagos
$string['payment_settings'] = 'Configuración de pagos';
$string['payment_settings_desc'] = 'Configuración para el sistema de pagos de PayPal';
$string['paypal_client_id'] = 'ID de cliente de PayPal';
$string['paypal_client_id_desc'] = 'ID de Cliente de PayPal para procesar pagos. Déjelo en blanco para usar el valor del archivo .env';
$string['enable_payments'] = 'Habilitar sistema de pagos';
$string['enable_payments_desc'] = 'Activa el sistema de pagos para acceder a la funcionalidad completa del plugin';
$string['payment_amount'] = 'Importe del pago';
$string['payment_amount_desc'] = 'Importe a cobrar por el acceso al plugin (en euros)';
$string['payment_title'] = 'Pago de acceso';
$string['payment_heading'] = 'Pago de acceso a recuperación de preguntas falladas';
$string['payment_required'] = 'Se requiere pago para acceder';
$string['payment_required_desc'] = 'Para acceder a la funcionalidad completa de Recuperación de Preguntas Falladas, es necesario realizar un pago único de 6€';
$string['payment_success'] = 'Pago completado con éxito';
$string['payment_pending'] = 'Pago pendiente';
$string['payment_failed'] = 'El pago ha fallado';
$string['payment_already_completed'] = 'Ya has realizado el pago';
$string['go_to_payment'] = 'Ir a la página de pago';
$string['event_payment_completed'] = 'Pago completado';

// Payment success page
$string['payment_success_title'] = 'Pago completado';
$string['payment_success_heading'] = 'Pago procesado correctamente';
$string['payment_details'] = 'Detalles del pago';
$string['transaction_id'] = 'ID de transacción';
$string['amount'] = 'Cantidad';
$string['status'] = 'Estado';
$string['date'] = 'Fecha';
$string['completed'] = 'Completado';
$string['payment_success_message'] = 'Tu pago ha sido procesado correctamente. Ahora tienes acceso completo a todas las funcionalidades del plugin de Recuperación de Preguntas Fallidas.';
$string['access_tools'] = 'Realizar preguntas falladas';
$string['go_to_dashboard'] = 'Ir al panel principal';
$string['payment_error_title'] = 'Error en el pago';
$string['payment_error_heading'] = 'Error al procesar el pago';
$string['try_again'] = 'Intentar de nuevo';
$string['contact_support'] = 'Contactar soporte';
$string['paypal_note'] = 'Nota: No es necesario tener una cuenta de PayPal para realizar el pago. Puedes pagar como invitado con tu tarjeta de crédito o débito.';
$string['mobile_payment_note'] = 'Si no aparece la opción de pagar con tarjeta en dispositivos móviles, puedes: limpiar las cookies del navegador, usar modo incógnito, intentar desde un ordenador, o crear una cuenta PayPal gratuita.';

// Interfaz
$string['questions_in_quiz'] = 'Preguntas en el cuestionario';
$string['create_quiz'] = 'Crear cuestionario';
$string['submit_answer'] = 'Enviar respuesta';
$string['next_question'] = 'Siguiente pregunta';
$string['finish_quiz'] = 'Finalizar cuestionario';
$string['quiz_progress'] = 'Progreso: {$a->current} de {$a->total}';
$string['correct_answer'] = '¡Correcto!';
$string['incorrect_answer'] = 'Incorrecto';
$string['quiz_results'] = 'Resultados del cuestionario';
$string['score'] = 'Puntuación';
$string['time_taken'] = 'Tiempo empleado';
$string['questions_answered'] = 'Preguntas respondidas';
$string['correct_answers'] = 'Respuestas correctas';
$string['retry_failed_questions'] = 'Reintentar preguntas falladas';
$string['back_to_dashboard'] = 'Volver al Panel';
$string['answer_saved'] = 'Respuesta guardada';
$string['quiz_in_progress'] = 'Cuestionario en progreso';
$string['quiz_results_saved'] = 'Resultados del cuestionario guardados';

// Help
$string['help_header'] = 'Ayuda - Recuperación de Preguntas Falladas';
$string['help_description'] = 'Este plugin te permite repasar las preguntas que has fallado en cuestionarios anteriores.';
$string['help_how_it_works'] = 'Cómo funciona:';
$string['help_step1'] = '1. Realiza cuestionarios normalmente en tus cursos';
$string['help_step2'] = '2. Las preguntas que falles se guardan automáticamente';
$string['help_step3'] = '3. Usa este panel para crear cuestionarios de repaso personalizados';
$string['help_step4'] = '4. Domina las preguntas respondiendo correctamente en los cuestionarios de recuperación';

// Time formats
$string['never'] = 'Nunca';
$string['today'] = 'Hoy';

// Quiz confirmation
$string['confirmsubmit'] = '¿Estás seguro de que quieres enviar tus respuestas? No podrás cambiarlas después de enviar.';
$string['submit_quiz'] = 'Enviar cuestionario';

// Estados y acciones
$string['pending'] = 'Pendiente';
$string['completed'] = 'Completado';
$string['in_progress'] = 'En progreso';
$string['mastered'] = 'Dominada';
$string['not_mastered'] = 'No dominada';
$string['answer_saved'] = 'Respuesta guardada';
$string['quiz_in_progress'] = 'Cuestionario en progreso';
$string['quiz_results_saved'] = 'Resultados del cuestionario guardados';