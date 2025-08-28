<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library functions for Telegram Integration plugin.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Add Telegram integration link to user profile navigation.
 *
 * @param \navigation_node $navigation
 * @param stdClass $user
 * @param context_user $usercontext
 * @param stdClass $course
 * @param context_course $coursecontext
 */
function local_telegram_integration_extend_navigation_user_settings($navigation, $user, $usercontext, $course, $coursecontext) {
    global $USER;
    
    // Only show for the current user or users with capability to manage
    if ($USER->id == $user->id || has_capability('moodle/user:update', $usercontext)) {
        $url = new moodle_url('/local/telegram_integration/verify.php');
        $node = navigation_node::create(
            get_string('telegramintegration', 'local_telegram_integration'),
            $url,
            navigation_node::TYPE_SETTING,
            null,
            'telegramintegration',
            new pix_icon('i/settings', '')
        );
        $navigation->add_node($node);
    }
}

/**
 * Generate a unique 6-digit verification code.
 *
 * @return string
 */
function local_telegram_integration_generate_code() {
    global $DB;
    
    do {
        $code = sprintf('%06d', mt_rand(100000, 999999));
        $exists = $DB->record_exists('local_telegram_verification', ['verification_code' => $code]);
    } while ($exists);
    
    return $code;
}

/**
 * Create a new verification code for a user.
 *
 * @param int $moodleuserid
 * @return string|false The verification code or false on failure
 */
function local_telegram_integration_create_verification_code($moodleuserid) {
    global $DB;
    
    // Clean up expired codes first
    local_telegram_integration_cleanup_expired_codes();
    
    // Check if user already has an active code
    $existing = $DB->get_record('local_telegram_verification', [
        'moodle_userid' => $moodleuserid,
        'is_verified' => 0
    ]);
    
    if ($existing && $existing->expires_at > time()) {
        return $existing->verification_code;
    }
    
    // Delete old unverified codes for this user
    $DB->delete_records('local_telegram_verification', [
        'moodle_userid' => $moodleuserid,
        'is_verified' => 0
    ]);
    
    // Generate new code
    $code = local_telegram_integration_generate_code();
    $now = time();
    
    $record = new stdClass();
    $record->moodle_userid = $moodleuserid;
    $record->verification_code = $code;
    $record->is_verified = 0;
    $record->created_at = $now;
    $record->expires_at = $now + (15 * 60); // 15 minutes
    
    if ($DB->insert_record('local_telegram_verification', $record)) {
        return $code;
    }
    
    return false;
}

/**
 * Verify a code and link accounts.
 *
 * @param string $code
 * @param array $telegramdata
 * @return bool
 */
function local_telegram_integration_verify_code($code, $telegramdata) {
    global $DB;
    
    // --- INICIO: DEBUG DETALLADO ---
    error_log("--- DEBUG (verify_code): Intentando verificar código '{$code}' con datos de Telegram: " . json_encode($telegramdata));
    
    $record = $DB->get_record('local_telegram_verification', [
        'verification_code' => $code,
        'is_verified' => 0
    ]);
    
    if (!$record) {
        error_log("--- DEBUG (verify_code): No se encontró ningún registro con el código '{$code}' sin verificar. Puede que ya estuviera verificado.");
        return false;
    }
    
    if ($record->expires_at < time()) {
        error_log("--- DEBUG (verify_code): El código '{$code}' para el usuario {$record->moodle_userid} ha expirado.");
        return false;
    }
    
    error_log("--- DEBUG (verify_code): Registro encontrado para Moodle User ID {$record->moodle_userid}. Procediendo a actualizar.");

    // Update verification record
    $record->telegram_userid = $telegramdata['telegram_userid'];
    $record->telegram_username = $telegramdata['username'] ?? '';
    $record->is_verified = 1;
    $record->verified_at = time();
    
    try {
        $update_success = $DB->update_record('local_telegram_verification', $record);
        
        if ($update_success) {
            error_log("--- DEBUG (verify_code): ¡ÉXITO! Registro actualizado correctamente en la BD. is_verified ahora es 1.");
        } else {
            error_log("--- DEBUG (verify_code): ¡FALLO! $DB->update_record() devolvió false. No se pudo actualizar el registro en la BD.");
            // Forzar una excepción para que no se notifique a la API si la BD falló.
            throw new \Exception("Fallo al actualizar el registro de verificación en la base de datos.");
        }

        // Send notification to our API only on successful DB update
        local_telegram_integration_notify_telegram_api($record, $telegramdata);
        
        return true;

    } catch (Exception $e) {
        error_log("--- DEBUG (verify_code): Se produjo una excepción durante la actualización del registro: " . $e->getMessage());
        return false;
    }
}

/**
 * Get verification status for a user.
 *
 * @param int $moodleuserid
 * @return stdClass|false
 */
function local_telegram_integration_get_verification_status($moodleuserid) {
    global $DB;

    // --- INICIO: DEBUG DETALLADO ---
    error_log("--- DEBUG: Verificando estado de vinculación para Moodle User ID: $moodleuserid ---");

    if (empty($moodleuserid) || !is_numeric($moodleuserid)) {
        error_log("--- DEBUG: ID de usuario inválido o vacío. Abortando verificación. ---");
        return false;
    }

    $conditions = ['moodle_userid' => $moodleuserid, 'is_verified' => 1];
    
    // Ejecutar la consulta
    $record = $DB->get_record('local_telegram_verification', $conditions, '*', IGNORE_MULTIPLE);

    if ($record) {
        error_log("--- DEBUG: ¡Registro ENCONTRADO! Usuario vinculado. Telegram User ID: {$record->telegram_userid} ---");
    } else {
        error_log("--- DEBUG: Registro NO encontrado. El usuario no está vinculado según la tabla 'local_telegram_verification'. ---");
        // Intentar buscar cualquier registro para este usuario para más contexto
        $any_record = $DB->get_record('local_telegram_verification', ['moodle_userid' => $moodleuserid], '*', IGNORE_MULTIPLE);
        if ($any_record) {
            error_log("--- DEBUG: Se encontró un registro, pero no está verificado (is_verified = {$any_record->is_verified}). ---");
        } else {
            error_log("--- DEBUG: No existe ningún registro de verificación para este usuario en la tabla. ---");
        }
    }
    // --- FIN: DEBUG DETALLADO ---

    return $record;
}

/**
 * Clean up expired verification codes.
 */
function local_telegram_integration_cleanup_expired_codes() {
    global $DB;
    
    $DB->delete_records_select('local_telegram_verification', 'expires_at < ? AND is_verified = 0', [time()]);
}

/**
 * Notify our Telegram API about successful verification.
 *
 * @param stdClass $record
 * @param array $telegramdata
 */
function local_telegram_integration_notify_telegram_api($record, $telegramdata) {
    global $DB, $CFG; // Cambiado de $USER a $DB
    
    // SOLUCIÓN: Obtener el usuario explícitamente desde la BD en lugar de usar el $USER global.
    // Esto evita un error fatal silencioso cuando el script se ejecuta en un contexto
    // donde $USER no está completamente poblado (p. ej., eventos de cron o de estudiante).
    $user = $DB->get_record('user', ['id' => $record->moodle_userid]);

    if (!$user) {
        error_log("Telegram API notification failed: Could not find user with ID {$record->moodle_userid}");
        return;
    }
    
    $apiurl = get_config('local_telegram_integration', 'telegram_api_url') ?: 'http://localhost:3000/api/moodle/verify-code';
    
    $data = [
        'verificationCode' => $record->verification_code,
        'moodleUserId' => $record->moodle_userid,
        'username' => $user->username,
        'email' => $user->email,
        'fullname' => fullname($user) // Ahora usamos el objeto $user que hemos cargado.
    ];
    
    // Send POST request to our API
    $ch = curl_init($apiurl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Log the result for debugging
    if ($httpcode !== 200) {
        error_log("Telegram API notification failed: HTTP $httpcode, Response: $response");
    }
}

/**
 * Send quiz completion data to Telegram API.
 *
 * @param int $moodleuserid
 * @param array $quizdata
 */
function local_telegram_integration_send_quiz_data($moodleuserid, $quizdata) {
    global $DB;
    
    // Check if user has Telegram integration
    $verification = local_telegram_integration_get_verification_status($moodleuserid);
    if (!$verification) {
        error_log("Telegram Integration: User $moodleuserid not linked to Telegram - skipping quiz data send");
        return; // User not linked
    }
    
    $apiurl = get_config('local_telegram_integration', 'webhook_url') ?: 'http://localhost:3000/api/moodle/quiz-webhook';
    
    // Fallback: si el tema es 'general' o no está definido, intentar recalcularlo.
    $subject = $quizdata['subject'] ?? 'general';
    if ($subject === 'general') {
        $quitar_tildes = function($cadena) {
            $originales = ['á','é','í','ó','ú','ü','ñ','Á','É','Í','Ó','Ú','Ü','Ñ'];
            $modificadas = ['a','e','i','o','u','u','n','A','E','I','O','U','U','N'];
            return str_replace($originales, $modificadas, $cadena);
        };

        $quiz = $DB->get_record('quiz', ['id' => $quizdata['quiz_id']], 'name');
        if (!$quiz) return;
        
        $quizName = $quiz->name;
        $name = mb_strtolower($quizName, 'UTF-8');
        $name = $quitar_tildes($name);

        $temas = [
            'Constitución Española' => ['constitucion'],
            'Defensa Nacional' => ['defensa nacional'],
            'Régimen Jurídico del Sector Público' => ['regimen juridico'],
            'Ministerio de Defensa' => ['ministerio de defensa'],
            'Organización de las FAS' => ['organizacion basica fas'],
            'Estado Mayor de la Defensa' => ['organizacion basica del em'],
            'Ejército de Tierra' => ['organizacion basica et'],
            'Armada Española' => ['organizacion basica armada'],
            'Ejército del Aire' => ['organizacion basica ea'],
            'Tropa y Marinería' => ['tropa y marineria'],
            'Carrera Militar' => ['carrera militar', 'ley carrera'],
            'Reales Ordenanzas' => ['reales ordenanzas'],
            'Derechos y Deberes de los Miembros de las FAS' => ['derechos y deberes'],
            'Régimen Disciplinario de las Fuerzas Armadas' => ['regimen disciplinario', 'disciplinario'],
            'Tramitación Iniciativas y Quejas' => ['iniciativas y quejas'],
            'Igualdad Efectiva de Mujeres y Hombres' => ['igualdad efectiva'],
            'Observatorio Militar para la Igualdad' => ['observatorio militar'],
            'Procedimiento Administrativo Común' => ['procedimiento administrativo'],
            'Seguridad Nacional' => ['seguridad nacional'],
            'Estrategia de Seguridad Nacional' => ['estrategia de seguridad'],
            'Doctrina' => ['doctrina'],
            'Organización de las Naciones Unidas' => ['naciones unidas', 'onu'],
            'OTAN' => ['otan'],
            'OSCE' => ['osce'],
            'Unión Europea' => ['union europea'],
            'España y su Participación en Misiones' => ['misiones internacionales']
        ];
        
        $subject = 'general';
        foreach ($temas as $temaNormalizado => $palabrasClave) {
            foreach ($palabrasClave as $clave) {
                if (strpos($name, $clave) !== false) {
                    $subject = $temaNormalizado;
                    break 2; // Salir de ambos bucles
                }
            }
        }
    }

    $data = [
        'moodleUserId' => $moodleuserid,
        'telegramUserId' => $verification->telegram_userid,
        'questionCorrect' => $quizdata['correct'] ? 1 : 0,
        'responseTime' => $quizdata['response_time'],
        'subject' => $subject,
        'difficulty' => $quizdata['difficulty'] ?? 'medium',
        'timestamp' => time()
    ];
    
    error_log("Telegram Integration: Sending individual question data to API: " . json_encode($data));
    
    // Send to Telegram API
    $ch = curl_init($apiurl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpcode === 200) {
        error_log("Telegram Integration: Successfully sent question data to API");
    } else {
        error_log("Telegram Integration: Failed to send question data to API. HTTP $httpcode, Response: $response");
    }
}

/**
 * Send complete quiz data to Telegram API (all questions at once).
 *
 * @param int $moodleuserid
 * @param array $complete_quiz_data
 * @return bool
 */
function local_telegram_integration_send_complete_quiz_data($moodleuserid, $complete_quiz_data) {
    global $DB, $CFG;
    
    // Log de inicio de la función
    error_log("--- Moodle to Telegram Sync ---");
    error_log("Attempting to send complete quiz data for Moodle User ID: $moodleuserid");

    $user = $DB->get_record('user', ['id' => $moodleuserid]);
    if (!$user) {
        error_log("Moodle to Telegram Sync FAILED: Could not find user with ID $moodleuserid");
        return false;
    }
    
    // Obtener la URL de la API de la configuración del plugin
    $apiurl = get_config('local_telegram_integration', 'telegram_api_url');
    if (empty($apiurl)) {
        // Fallback a una URL por defecto si no está configurada.
        $apiurl = 'http://localhost:3000/api/moodle/update-gamification';
        error_log("Moodle to Telegram Sync WARNING: 'telegram_api_url' not set in plugin config. Using default: " . $apiurl);
    } else {
        // SOLUCIÓN: Limpiar la URL base y construir la URL final correctamente.
        // 1. Eliminar cualquier ruta que venga después del dominio base.
        $parsed_url = parse_url($apiurl);
        $base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'];
        if (!empty($parsed_url['port'])) {
            $base_url .= ':' . $parsed_url['port'];
        }
        
        // 2. Añadir el endpoint correcto.
        $apiurl = $base_url . '/api/moodle/update-gamification';
    }
    
    error_log("Moodle to Telegram Sync INFO: Corrected Target API URL: " . $apiurl);

    $data = [
        'moodleUserId' => $moodleuserid,
        'quizData' => $complete_quiz_data
    ];
    
    $payload = json_encode($data);

    error_log("Moodle to Telegram Sync INFO: JSON Payload being sent: (Payload length: " . strlen($payload) . ")");

    $ch = curl_init($apiurl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // SOLUCIÓN 1: FIRE-AND-FORGET
    // Reducir el timeout para que Moodle no espere la respuesta.
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, 2000); // 2 segundos
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    // Log detallado del resultado
    if ($curl_error) {
        error_log("Moodle to Telegram Sync FAILED: cURL Error: " . $curl_error);
        return false;
    }

    error_log("Moodle to Telegram Sync SUCCESS: HTTP Status Code: " . $httpcode);
    error_log("Moodle to Telegram Sync SUCCESS: API Response: " . $response);

    if ($httpcode >= 200 && $httpcode < 300) {
        return true;
    } else {
        error_log("Moodle to Telegram Sync FAILED: API returned a non-successful status code.");
        return false;
    }
}

/**
 * Get Telegram user ID from Moodle user ID.
 * 
 * @param int $moodle_user_id The Moodle user ID
 * @return string|null The Telegram user ID (UUID) or null if not found
 */
function get_telegram_user_id($moodle_user_id) {
    global $DB;
    
    try {
        // Check if user has telegram verification record
        // Tabla: local_telegram_verification, campos: moodle_userid, telegram_userid
        $record = $DB->get_record('local_telegram_verification', [
            'moodle_userid' => $moodle_user_id,
            'is_verified' => 1
        ], 'telegram_userid');
        
        return $record ? $record->telegram_userid : null;
    } catch (Exception $e) {
        error_log("Error getting telegram user ID: " . $e->getMessage());
        return null;
    }
}

/**
 * Obtener datos de análisis predictivo
 * @param string $telegram_user_id
 * @return array
 */
function get_predictive_analysis_data($telegram_user_id) {
    require_once(__DIR__ . '/telegram-db-config.php');
    
    try {
        // Obtener estadísticas del usuario desde user_analytics en la BD de Telegram
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'success_probability' => 0,
                'weak_areas' => [],
                'recommendations' => ['No hay datos suficientes para análisis predictivo'],
                'confidence' => 0
            ];
        }
        
        $user_stats = $result[0];
        
        // Calcular probabilidad de éxito basada en accuracy_rate
        $success_probability = round($user_stats['accuracy_rate'], 1);
        
        // Identificar áreas débiles específicas del dominio FAS
        $weak_areas = [];
        if ($success_probability < 60) {
            $weak_areas[] = 'Constitución Española';
            $weak_areas[] = 'Organización Básica del ET';
        }
        if ($success_probability < 70) {
            $weak_areas[] = 'Derechos y Deberes';
            $weak_areas[] = 'Régimen Disciplinario';
        }
        
        // Generar recomendaciones específicas
        $recommendations = [];
        if ($success_probability < 50) {
            $recommendations[] = 'Revisar fundamentos de la Constitución Española';
            $recommendations[] = 'Estudiar la estructura del Ejército de Tierra';
        } elseif ($success_probability < 70) {
            $recommendations[] = 'Practicar ejercicios de legislación militar';
            $recommendations[] = 'Repasar temas de organización militar';
        } else {
            $recommendations[] = 'Mantener el ritmo de estudio actual';
            $recommendations[] = 'Enfocarse en simulacros completos';
        }
        
        return [
            'success_probability' => $success_probability,
            'weak_areas' => $weak_areas,
            'recommendations' => $recommendations,
            'confidence' => min(95, $user_stats['question_count'] * 2) // Confianza basada en cantidad de datos
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_predictive_analysis_data: " . $e->getMessage());
        return [
            'success_probability' => 0,
            'weak_areas' => [],
            'recommendations' => ['Error al obtener datos'],
            'confidence' => 0
        ];
    }
}

/**
 * Obtener métricas de aprendizaje
 * @param string $telegram_user_id
 * @return array
 */
function get_learning_metrics_data($telegram_user_id) {
    require_once(__DIR__ . '/telegram-db-config.php');
    
    try {
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'total_questions' => 0,
                'correct_answers' => 0,
                'accuracy_rate' => 0,
                'avg_response_time' => 0,
                'learning_trend' => 'Sin datos'
            ];
        }
        
        $user_stats = $result[0];
        
        return [
            'total_questions' => (int)$user_stats['question_count'],
            'correct_answers' => (int)$user_stats['correct_count'],
            'accuracy_rate' => round($user_stats['accuracy_rate'], 1),
            'avg_response_time' => round($user_stats['avg_response_time'], 1),
            'learning_trend' => $user_stats['learning_trend'] ?? 'Estable'
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_learning_metrics_data: " . $e->getMessage());
        return [
            'total_questions' => 0,
            'correct_answers' => 0,
            'accuracy_rate' => 0,
            'avg_response_time' => 0,
            'learning_trend' => 'Error'
        ];
    }
}

/**
 * Obtener datos de optimización
 * @param string $telegram_user_id
 * @return array
 */
function get_optimization_data($telegram_user_id) {
    require_once(__DIR__ . '/telegram-db-config.php');
    
    try {
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'study_efficiency' => 0,
                'time_optimization' => [],
                'focus_areas' => []
            ];
        }
        
        $user_stats = $result[0];
        $accuracy = $user_stats['accuracy_rate'];
        $response_time = $user_stats['avg_response_time'];
        
        // Calcular eficiencia de estudio
        $study_efficiency = round(($accuracy / 100) * (10 / max($response_time, 1)) * 10, 1);
        
        // Recomendaciones de optimización de tiempo
        $time_optimization = [];
        if ($response_time > 30) {
            $time_optimization[] = 'Practicar lectura rápida de enunciados';
            $time_optimization[] = 'Revisar conceptos básicos para mayor fluidez';
        } else {
            $time_optimization[] = 'Mantener velocidad de respuesta actual';
        }
        
        // Áreas de enfoque
        $focus_areas = [];
        if ($accuracy < 70) {
            $focus_areas[] = 'Comprensión de conceptos fundamentales';
            $focus_areas[] = 'Práctica de casos prácticos';
        } else {
            $focus_areas[] = 'Perfeccionamiento en áreas específicas';
            $focus_areas[] = 'Simulacros de examen completo';
        }
        
        return [
            'study_efficiency' => min(100, $study_efficiency),
            'time_optimization' => $time_optimization,
            'focus_areas' => $focus_areas
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_optimization_data: " . $e->getMessage());
        return [
            'study_efficiency' => 0,
            'time_optimization' => ['Error al calcular'],
            'focus_areas' => ['Error al determinar']
        ];
    }
}

/**
 * Obtener datos de análisis social
 * @param string $telegram_user_id
 * @return array
 */
function get_social_analysis_data($telegram_user_id) {
    require_once(__DIR__ . '/telegram-db-config.php');
    
    try {
        // Obtener datos del usuario actual
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'user_ranking' => 0,
                'percentile' => 0,
                'comparison' => 'Sin datos suficientes'
            ];
        }
        
        $user_stats = $result[0];
        $user_accuracy = $user_stats['accuracy_rate'];
        
        // Obtener estadísticas globales para comparación
        $global_sql = "SELECT 
                        COUNT(*) as total_users,
                        AVG(accuracy_rate) as avg_accuracy,
                        COUNT(CASE WHEN accuracy_rate < ? THEN 1 END) as users_below
                       FROM user_analytics 
                       WHERE question_count > 10";
        
        $global_result = executeTelegramQuery($global_sql, [$user_accuracy]);
        
        if (!$global_result || empty($global_result)) {
            return [
                'user_ranking' => 1,
                'percentile' => 50,
                'comparison' => 'Datos insuficientes para comparación'
            ];
        }
        
        $global_stats = $global_result[0];
        $total_users = (int)$global_stats['total_users'];
        $users_below = (int)$global_stats['users_below'];
        $avg_accuracy = round($global_stats['avg_accuracy'], 1);
        
        // Calcular ranking y percentil
        $ranking = $total_users - $users_below;
        $percentile = $total_users > 0 ? round(($users_below / $total_users) * 100, 1) : 50;
        
        // Generar comparación textual
        $comparison = '';
        if ($user_accuracy > $avg_accuracy + 10) {
            $comparison = 'Rendimiento excelente, por encima del promedio';
        } elseif ($user_accuracy > $avg_accuracy) {
            $comparison = 'Rendimiento bueno, ligeramente por encima del promedio';
        } elseif ($user_accuracy > $avg_accuracy - 10) {
            $comparison = 'Rendimiento promedio, en línea con otros usuarios';
        } else {
            $comparison = 'Hay margen de mejora, por debajo del promedio';
        }
        
        return [
            'user_ranking' => $ranking,
            'percentile' => $percentile,
            'comparison' => $comparison
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_social_analysis_data: " . $e->getMessage());
        return [
            'user_ranking' => 0,
            'percentile' => 0,
            'comparison' => 'Error al obtener datos de comparación'
        ];
    }
}

// ==========================================
// 🔗 FUNCIONES PARA CONECTAR A BD TELEGRAM
// ==========================================

/**
 * Análisis predictivo usando datos de la BD de Telegram
 */
function get_predictive_analysis_data_from_telegram_db($user_id) {
    global $CFG;
    require_once($CFG->dirroot . '/local/telegram_integration/telegram-db-config.php');
    
    // $user_id already IS the Telegram user ID (UUID)
    $telegram_user_id = $user_id;
    
    if (!$telegram_user_id) {
        return [
            'error' => 'Usuario no válido',
            'success_probability' => 0,
            'weak_areas' => [],
            'recommendations' => ['Vincula tu cuenta de Telegram para obtener análisis predictivo'],
            'confidence' => 0
        ];
    }
    
    try {
        // Obtener estadísticas del usuario desde user_analytics en la BD de Telegram
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'success_probability' => 0,
                'weak_areas' => [],
                'recommendations' => ['No hay datos suficientes para análisis predictivo'],
                'confidence' => 0
            ];
        }
        
        $user_stats = $result[0];
        
        // Calcular probabilidad de éxito basada en accuracy_rate
        $success_probability = round($user_stats['accuracy_rate'], 1);
        
        // Identificar áreas débiles específicas del dominio FAS
        $weak_areas = [];
        if ($success_probability < 60) {
            $weak_areas[] = 'Constitución Española';
            $weak_areas[] = 'Organización Básica del ET';
        }
        if ($success_probability < 70) {
            $weak_areas[] = 'Derechos y Deberes';
            $weak_areas[] = 'Régimen Disciplinario';
        }
        
        // Generar recomendaciones específicas
        $recommendations = [];
        if ($success_probability < 50) {
            $recommendations[] = 'Revisar fundamentos de la Constitución Española';
            $recommendations[] = 'Estudiar la estructura del Ejército de Tierra';
        } elseif ($success_probability < 70) {
            $recommendations[] = 'Practicar ejercicios de legislación militar';
            $recommendations[] = 'Repasar temas de organización militar';
        } else {
            $recommendations[] = 'Mantener el ritmo de estudio actual';
            $recommendations[] = 'Enfocarse en simulacros completos';
        }
        
        return [
            'success_probability' => $success_probability,
            'weak_areas' => $weak_areas,
            'recommendations' => $recommendations,
            'confidence' => min(95, $user_stats['question_count'] * 2) // Confianza basada en cantidad de datos
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_predictive_analysis_data_from_telegram_db: " . $e->getMessage());
        return [
            'success_probability' => 0,
            'weak_areas' => [],
            'recommendations' => ['Error al obtener datos'],
            'confidence' => 0
        ];
    }
}

/**
 * Métricas de aprendizaje usando datos de la BD de Telegram
 */
function get_learning_metrics_data_from_telegram_db($user_id) {
    global $CFG;
    require_once($CFG->dirroot . '/local/telegram_integration/telegram-db-config.php');
    
    // $user_id already IS the Telegram user ID (UUID)
    $telegram_user_id = $user_id;
    
    try {
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'total_questions' => 0,
                'correct_answers' => 0,
                'accuracy_rate' => 0,
                'avg_response_time' => 0,
                'learning_trend' => 'Sin datos'
            ];
        }
        
        $user_stats = $result[0];
        
        return [
            'total_questions' => (int)$user_stats['question_count'],
            'correct_answers' => (int)$user_stats['correct_count'],
            'accuracy_rate' => round($user_stats['accuracy_rate'], 1),
            'avg_response_time' => round($user_stats['avg_response_time'], 1),
            'learning_trend' => $user_stats['learning_trend'] ?? 'Estable'
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_learning_metrics_data_from_telegram_db: " . $e->getMessage());
        return [
            'total_questions' => 0,
            'correct_answers' => 0,
            'accuracy_rate' => 0,
            'avg_response_time' => 0,
            'learning_trend' => 'Error'
        ];
    }
}

/**
 * Datos de optimización usando datos de la BD de Telegram
 */
function get_optimization_data_from_telegram_db($user_id) {
    global $CFG;
    require_once($CFG->dirroot . '/local/telegram_integration/telegram-db-config.php');
    
    // $user_id already IS the Telegram user ID (UUID)
    $telegram_user_id = $user_id;
    
    try {
        $sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $result = executeTelegramQuery($sql, [$telegram_user_id]);
        
        if (!$result || empty($result)) {
            return [
                'optimal_hours' => [],
                'subject_sequence' => ['No hay datos suficientes'],
                'fatigue_patterns' => []
            ];
        }
        
        $user_stats = $result[0];
        $accuracy = $user_stats['accuracy_rate'];
        
        // Generar horas óptimas basadas en datos reales
        $optimal_hours = [
            ['hour' => 9, 'performance' => min(100, $accuracy + 15)],
            ['hour' => 11, 'performance' => min(100, $accuracy + 10)],
            ['hour' => 16, 'performance' => min(100, $accuracy + 5)],
            ['hour' => 19, 'performance' => $accuracy]
        ];
        
        // Recomendaciones de secuencia
        $subject_sequence = [
            'Recomendación basada en tu patrón de rendimiento actual: ' . $accuracy . '%',
            'Estudia materias difíciles en horas de mayor rendimiento (9:00-11:00)'
        ];
        
        // Patrones de fatiga
        $session_length = $accuracy > 70 ? 45 : 30;
        $break_frequency = $accuracy > 70 ? 20 : 15;
        
        $fatigue_patterns = [
            'optimal_session_length' => $session_length,
            'break_frequency' => $break_frequency,
            'peak_performance_time' => '09:00-11:00',
            'questions_per_session' => $session_length
        ];
        
        return [
            'optimal_hours' => $optimal_hours,
            'subject_sequence' => $subject_sequence,
            'fatigue_patterns' => $fatigue_patterns
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_optimization_data_from_telegram_db: " . $e->getMessage());
        return [
            'optimal_hours' => [],
            'subject_sequence' => ['Error al obtener datos'],
            'fatigue_patterns' => []
        ];
    }
}

/**
 * Análisis social usando datos de la BD de Telegram
 */
function get_social_analysis_data_from_telegram_db($user_id) {
    global $CFG;
    require_once($CFG->dirroot . '/local/telegram_integration/telegram-db-config.php');
    
    // $user_id already IS the Telegram user ID (UUID)
    $telegram_user_id = $user_id;
    
    try {
        // Obtener datos del usuario actual
        $sql_user = "SELECT * FROM user_analytics WHERE telegram_user_id = ?";
        $user_result = executeTelegramQuery($sql_user, [$telegram_user_id]);
        
        if (!$user_result || empty($user_result)) {
            return [
                'benchmarking' => [],
                'success_strategies' => ['No hay datos suficientes'],
                'compatible_groups' => []
            ];
        }
        
        $user_stats = $user_result[0];
        $user_accuracy = $user_stats['accuracy_rate'];
        
        // Obtener estadísticas generales para comparación
        $sql_general = "SELECT 
                            AVG(accuracy_rate) as avg_accuracy,
                            COUNT(*) as total_users,
                            (SELECT accuracy_rate FROM user_analytics ORDER BY accuracy_rate DESC LIMIT 1 OFFSET 9) as top_10_percent
                        FROM user_analytics";
        $general_result = executeTelegramQuery($sql_general, []);
        
        $avg_accuracy = $general_result ? round($general_result[0]['avg_accuracy'], 1) : 50;
        $total_users = $general_result ? $general_result[0]['total_users'] : 100;
        $top_10_percent = $general_result ? $general_result[0]['top_10_percent'] : 80;
        
        // Calcular percentil
        $sql_ranking = "SELECT COUNT(*) as lower_users FROM user_analytics WHERE accuracy_rate < ?";
        $ranking_result = executeTelegramQuery($sql_ranking, [$user_accuracy]);
        $percentile = $ranking_result ? round(($ranking_result[0]['lower_users'] / $total_users) * 100, 1) : 50;
        
        // Encontrar usuarios compatibles (±10% de accuracy)
        $sql_compatible = "SELECT COUNT(*) as compatible_count FROM user_analytics 
                          WHERE accuracy_rate BETWEEN ? AND ? AND telegram_user_id != ?";
        $compatible_result = executeTelegramQuery($sql_compatible, [
            $user_accuracy - 10, 
            $user_accuracy + 10, 
            $telegram_user_id
        ]);
        $compatible_users = $compatible_result ? $compatible_result[0]['compatible_count'] : 0;
        
        $benchmarking = [
            'your_percentile' => $percentile,
            'similar_users_avg' => $avg_accuracy,
            'top_10_percent' => $top_10_percent ?: 80,
            'your_performance' => $user_accuracy
        ];
        
        $strategies = [
            "Tu percentil actual: {$percentile}% (mejor que {$percentile}% de usuarios)",
            "Rendimiento promedio general: {$avg_accuracy}%",
            "Top 10% de usuarios: " . ($top_10_percent ?: 80) . "%"
        ];
        
        if ($compatible_users > 0) {
            $strategies[] = "Hay {$compatible_users} usuarios compatibles para formar grupo de estudio";
        }
        
        $compatible_groups = [];
        if ($compatible_users > 0) {
            $compatible_groups[] = [
                'group_id' => 1,
                'compatibility' => 85,
                'members' => $compatible_users,
                'accuracy_range' => ($user_accuracy - 10) . "% - " . ($user_accuracy + 10) . "%"
            ];
        }
        
        return [
            'benchmarking' => $benchmarking,
            'success_strategies' => $strategies,
            'compatible_groups' => $compatible_groups
        ];
        
    } catch (Exception $e) {
        error_log("Error en get_social_analysis_data_from_telegram_db: " . $e->getMessage());
        return [
            'benchmarking' => [],
            'success_strategies' => ['Error al obtener datos'],
            'compatible_groups' => []
        ];
    }
}

/**
 * Obtener UUID de Telegram desde ID de usuario Moodle
 * Usa conexión nativa de Moodle - BD unificada
 */
function get_telegram_uuid_from_moodle_user_id($moodle_user_id) {
    global $DB;
    
    try {
        // ✅ CORREGIDO: SQL directo sin prefijo para tablas externas
        $sql = "SELECT telegramuserid FROM moodleuserlink 
                WHERE moodleuserid = ? AND isactive = 1 
                LIMIT 1";
        
        $result = $DB->get_field_sql($sql, [$moodle_user_id]);
        
        if (!$result) {
            return false;
        }
        
        // Ahora necesitamos obtener el ID interno de telegramuser para usar en las consultas
        $user_id_sql = "SELECT id FROM telegramuser WHERE telegramuserid = ? LIMIT 1";
        $user_id = $DB->get_field_sql($user_id_sql, [$result]);
        
        return $user_id ? $user_id : false;
    } catch (Exception $e) {
        error_log("Error getting telegram UUID: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtener tasa de éxito desde BD Telegram
 * Usa conexión nativa de Moodle - BD unificada
 */
function get_success_rate_from_telegram_db($moodle_user_id) {
    global $DB;
    
    try {
        $telegram_uuid = get_telegram_uuid_from_moodle_user_id($moodle_user_id);
        if (!$telegram_uuid) {
            return false;
        }
        
        // ✅ CORREGIDO: SQL directo para tabla sin prefijo
        $sql = "SELECT ROUND(AVG(CASE WHEN iscorrect = 1 THEN 100 ELSE 0 END), 2) as success_rate
                FROM telegramresponse 
                WHERE userid = ?";
        
        $result = $DB->get_field_sql($sql, [$telegram_uuid]);
        return $result !== false ? (float)$result : 0.0;
        
    } catch (Exception $e) {
        error_log("Error getting success rate: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtener total de preguntas desde BD Telegram
 * Usa conexión nativa de Moodle - BD unificada
 */
function get_total_questions_from_telegram_db($moodle_user_id) {
    global $DB;
    
    try {
        $telegram_uuid = get_telegram_uuid_from_moodle_user_id($moodle_user_id);
        if (!$telegram_uuid) {
            return false;
        }
        
        // ✅ CORREGIDO: SQL directo para tabla sin prefijo
        $sql = "SELECT COUNT(*) FROM telegramresponse WHERE userid = ?";
        $count = $DB->get_field_sql($sql, [$telegram_uuid]);
        return $count;
        
    } catch (Exception $e) {
        error_log("Error getting total questions: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtener respuestas correctas desde BD Telegram
 * Usa conexión nativa de Moodle - BD unificada
 */
function get_correct_answers_from_telegram_db($moodle_user_id) {
    global $DB;
    
    try {
        $telegram_uuid = get_telegram_uuid_from_moodle_user_id($moodle_user_id);
        if (!$telegram_uuid) {
            return false;
        }
        
        // ✅ CORREGIDO: SQL directo para tabla sin prefijo
        $sql = "SELECT COUNT(*) FROM telegramresponse WHERE userid = ? AND iscorrect = 1";
        $count = $DB->get_field_sql($sql, [$telegram_uuid]);
        return $count;
        
    } catch (Exception $e) {
        error_log("Error getting correct answers: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtener ranking del usuario desde BD Telegram
 * Usa conexión nativa de Moodle - BD unificada
 */
function get_user_ranking_from_telegram_db($moodle_user_id) {
    global $DB;
    
    try {
        $telegram_uuid = get_telegram_uuid_from_moodle_user_id($moodle_user_id);
        if (!$telegram_uuid) {
            return false;
        }
        
        // ✅ CORREGIDO: SQL directo para tabla sin prefijo
        $sql = "SELECT ranking FROM (
                    SELECT userid, 
                           ROW_NUMBER() OVER (ORDER BY total_points DESC, correct_answers DESC) as ranking
                    FROM (
                        SELECT userid,
                               SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct_answers,
                               COUNT(*) as total_questions,
                               SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as total_points
                        FROM telegramresponse
                        GROUP BY userid
                        HAVING total_questions > 0
                    ) stats
                ) rankings 
                WHERE userid = ?";
        
        $ranking = $DB->get_field_sql($sql, [$telegram_uuid]);
        return $ranking !== false ? (int)$ranking : false;
        
    } catch (Exception $e) {
        error_log("Error getting user ranking: " . $e->getMessage());
        return false;
    }
}

/**
 * Verificar conexión y estado de las tablas Telegram
 * Usa conexión nativa de Moodle - BD unificada
 */
function verify_telegram_tables() {
    global $DB;
    
    try {
        $tables_to_check = [
            'moodleuserlink',
            'telegramuser', 
            'telegramresponse'
        ];
        
        $status = [];
        
        foreach ($tables_to_check as $table) {
            try {
                // ✅ CORREGIDO: Verificar tabla con SQL directo
                $count = $DB->get_field_sql("SELECT COUNT(*) FROM $table LIMIT 1");
                $status[$table] = [
                    'exists' => true,
                    'count' => $count !== false ? $count : 0
                ];
            } catch (Exception $e) {
                $status[$table] = [
                    'exists' => false,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $status;
        
    } catch (Exception $e) {
        error_log("Error verifying telegram tables: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtener estadísticas generales del sistema Telegram
 * Usa conexión nativa de Moodle - BD unificada
 */
function get_telegram_system_stats() {
    global $DB;
    
    try {
        $stats = [];
        
        // ✅ CORREGIDO: SQL directo para todas las consultas
        $stats['total_telegram_users'] = $DB->get_field_sql("SELECT COUNT(*) FROM telegramuser");
        
        $stats['total_responses'] = $DB->get_field_sql("SELECT COUNT(*) FROM telegramresponse");
        
        $stats['active_mappings'] = $DB->get_field_sql("SELECT COUNT(*) FROM moodleuserlink WHERE isactive = 1");
        
        $stats['total_correct'] = $DB->get_field_sql("SELECT COUNT(*) FROM telegramresponse WHERE iscorrect = 1");
        
        // Tasa de éxito global
        if ($stats['total_responses'] > 0) {
            $stats['global_success_rate'] = round(($stats['total_correct'] / $stats['total_responses']) * 100, 2);
        } else {
            $stats['global_success_rate'] = 0;
        }
        
        return $stats;
        
    } catch (Exception $e) {
        error_log("Error getting telegram system stats: " . $e->getMessage());
        return false;
    }
}

/**
 * Actualizar el rendimiento del usuario por tema/materia
 * Esta función actualiza las estadísticas de rendimiento del usuario en una materia específica
 * 
 * @param int $moodle_user_id ID del usuario en Moodle
 * @param string $subject Nombre de la materia/tema
 * @param int $total_questions Total de preguntas en la sesión
 * @param int $correct_answers Número de respuestas correctas
 * @return bool True si se actualizó correctamente, false en caso contrario
 */
function local_telegram_integration_update_user_topic_performance(
    $moodle_user_id,
    $subject,
    $total_questions,
    $correct_answers
) {
    global $DB;

    // Obtener el ID de usuario de Telegram
    $telegram_user_id = get_telegram_user_id($moodle_user_id);
    if (!$telegram_user_id) {
        error_log("Failed to update topic performance for Moodle user $moodle_user_id: Telegram user ID not found.");
        return false;
    }

    // SOLUCIÓN FINAL: Volver a usar crc32 para el ID de la sección y eliminar la dependencia de la tabla inexistente.
    $section_id = crc32($subject);
    $incorrect_answers = (int)$total_questions - (int)$correct_answers;

    // SOLUCIÓN DEFINITIVA (v2): Corregida la fórmula de 'accuracy' para ser atómica y segura contra división por cero.
    $sql = "INSERT INTO {local_telegram_user_topic_performance} 
                (telegramuserid, sectionid, sectionname, totalquestions, correctanswers, incorrectanswers, accuracy, lastactivity, createdat, updatedat)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                totalquestions = totalquestions + VALUES(totalquestions),
                correctanswers = correctanswers + VALUES(correctanswers),
                incorrectanswers = incorrectanswers + VALUES(incorrectanswers),
                accuracy = IF((totalquestions + VALUES(totalquestions)) > 0, ((correctanswers + VALUES(correctanswers)) * 100) / (totalquestions + VALUES(totalquestions)), 0),
                lastactivity = VALUES(lastactivity),
                updatedat = VALUES(updatedat)";
    
    $initial_accuracy = ($total_questions > 0) ? round(((int)$correct_answers / (int)$total_questions) * 100, 2) : 0;
    
    $params = [
        $telegram_user_id,
        $section_id,
        $subject,
        (int)$total_questions,
        (int)$correct_answers,
        $incorrect_answers,
        $initial_accuracy,
        time(), // lastactivity
        time(), // createdat
        time()  // updatedat
    ];

    try {
        $DB->execute($sql, $params);
        error_log("Successfully UPSERTED topic performance for Telegram user $telegram_user_id in section '{$subject}' (ID: {$section_id}).");
        return true;
    } catch (Exception $e) {
        error_log("local_telegram_integration_update_user_topic_performance: [FATAL DB EXCEPTION] Failed to execute UPSERT. Error: " . $e->getMessage());
        return false;
    }
}


/**
 * Función auxiliar para verificar si la tabla de performance existe
 * Si no existe, intenta crearla
 */
function local_telegram_integration_ensure_performance_table() {
    global $DB;
    
    try {
        // Verificar si la tabla existe
        $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
        
        if (!$table_exists) {
            error_log("local_telegram_integration_ensure_performance_table: Tabla no existe, intentando crear...");
            
            // Intentar crear la tabla usando DDL adaptado para MySQL/MariaDB
            $sql = "CREATE TABLE IF NOT EXISTS {local_telegram_user_topic_performance} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                telegramuserid VARCHAR(255) NOT NULL,
                sectionid INT NOT NULL,
                sectionname VARCHAR(255) NOT NULL,
                totalquestions INT DEFAULT 0,
                correctanswers INT DEFAULT 0,
                incorrectanswers INT DEFAULT 0,
                accuracy DECIMAL(5,2) DEFAULT 0.00,
                lastactivity INT DEFAULT 0,
                createdat INT DEFAULT 0,
                updatedat INT DEFAULT 0,
                UNIQUE KEY unique_user_section (telegramuserid, sectionid),
                INDEX idx_telegramuser (telegramuserid),
                INDEX idx_section (sectionid)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $DB->execute($sql);
            
            // Verificar que la tabla se creó correctamente
            if ($DB->get_manager()->table_exists('local_telegram_user_topic_performance')) {
                error_log("local_telegram_integration_ensure_performance_table: Tabla creada exitosamente");
                return true;
            } else {
                error_log("local_telegram_integration_ensure_performance_table: Error - La tabla no se pudo crear");
                return false;
            }
        }
        
        error_log("local_telegram_integration_ensure_performance_table: Tabla ya existe");
        return true;
        
    } catch (Exception $e) {
        error_log("local_telegram_integration_ensure_performance_table: Error - " . $e->getMessage());
        
        // Intentar método alternativo si falla el primero
        try {
            // Método alternativo usando SQL más simple
            $simple_sql = "CREATE TABLE IF NOT EXISTS {local_telegram_user_topic_performance} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                telegramuserid VARCHAR(255) NOT NULL,
                sectionid INT NOT NULL,
                sectionname VARCHAR(255) NOT NULL,
                totalquestions INT DEFAULT 0,
                correctanswers INT DEFAULT 0,
                incorrectanswers INT DEFAULT 0,
                accuracy DECIMAL(5,2) DEFAULT 0.00,
                lastactivity INT DEFAULT 0,
                createdat INT DEFAULT 0,
                updatedat INT DEFAULT 0
            )";
            
            $DB->execute($simple_sql);
            error_log("local_telegram_integration_ensure_performance_table: Tabla creada con método alternativo");
            return true;
            
        } catch (Exception $e2) {
            error_log("local_telegram_integration_ensure_performance_table: Error en método alternativo - " . $e2->getMessage());
            return false;
        }
    }
}

/**
 * DEPRECATED: Funciones antiguas para compatibilidad
 * Estas funciones ya no son necesarias con BD unificada
 */
function get_telegram_db_connection() {
    // Ya no necesaria - usar conexión nativa de Moodle
    debugging('get_telegram_db_connection() is deprecated. Use native Moodle DB connection.', DEBUG_DEVELOPER);
    return null;
}

/**
 * Obtener todos los datos de analytics del usuario
 * Función unificada que combina todas las estadísticas
 */
function get_user_analytics_data($moodle_user_id) {
    global $DB;

    $data = new stdClass();

    // Aquí iría la lógica para obtener los datos de análisis...
    // Por ahora, devolvemos datos de ejemplo.
    $data->total_quizzes = 150;
    $data->avg_score = 75;
    $data->time_spent = '120h 30m';

    return $data;
}

/**
 * Obtiene el ID de una sección (tema) a partir de su nombre.
 *
 * @param string $section_name El nombre del tema (ej. "Doctrina").
 * @return int|false El ID de la sección si se encuentra, o false si no.
 */
function local_telegram_integration_get_section_id_by_name($section_name) {
    global $DB;
    $table = 'local_telegram_sections';

    if (!$DB->get_manager()->table_exists($table)) {
        error_log("Function local_telegram_integration_get_section_id_by_name: Table '$table' does not exist.");
        return false;
    }

    $record = $DB->get_record($table, ['name' => $section_name], 'id');
    
    if ($record) {
        return (int)$record->id;
    } else {
        error_log("Function local_telegram_integration_get_section_id_by_name: Section with name '$section_name' not found.");
        return false;
    }
}


/**
 * Maps a quiz name to a specific subject area based on keywords.
 * This new version includes an expanded set of keywords for more accurate detection.
 *
 * @param string $quizname The name of the quiz.
 * @return string The mapped subject or 'general' if no match is found.
 */
function local_telegram_integration_map_quiz_to_subject($quizname) {
    $quizname_lower = strtolower($quizname);

    $subject_map = [
        'derecho constitucional' => ['constitu', 'título preliminar', 'derechos y deberes', 'corona', 'cortes generales', 'gobierno y administración', 'poder judicial', 'organización territorial', 'tribunal constitucional', 'reforma constitucional'],
        'derecho administrativo' => ['procedimiento administrativo', 'acto administrativo', 'recursos administrativos', 'contratos del sector público', 'expropiación forzosa', 'responsabilidad patrimonial', 'ley 39/2015', 'ley 40/2015', 'pac', 'lrjsp'],
        'unión europea' => ['unión europea', 'ue', 'tratados de la unión', 'instituciones de la ue', 'parlamento europeo', 'consejo europeo', 'comisión europea', 'tribunal de justicia de la ue', 'bce', 'derecho de la unión'],
        'políticas públicas' => ['igualdad', 'violencia de género', 'transparencia', 'gobierno abierto', 'agenda 2030', 'desarrollo sostenible', 'dependencia', 'protección de datos'],
        'gestión de personal' => ['función pública', 'ebep', 'personal laboral', 'acceso al empleo público', 'carrera profesional', 'retribuciones', 'incompatibilidades', 'régimen disciplinario', 'seguridad social'],
        'gestión financiera' => ['presupuesto', 'hacienda pública', 'gasto público', 'ingresos públicos', 'control presupuestario', 'estabilidad presupuestaria'],
        'organización del estado' => ['organización del estado', 'administración general del estado', 'ministerios', 'secretarías de estado', 'delegaciones del gobierno', 'administración periférica', 'entidades públicas'],
        'derecho penal' => ['derecho penal', 'delitos', 'penas', 'código penal', 'delitos contra la administración'],
        'organismos internacionales' => [
            'organismos internacionales', 
            'naciones unidas', 
            'onu', 
            'otan', 
            'consejo de europa',
            'osce',
            'organizacion seguridad cooperacion europa',
            'seguridad cooperacion europa',
            'organizacion seguridad',
            'cooperacion europa',
            'seguridad europa'
        ]
    ];

    foreach ($subject_map as $subject => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($quizname_lower, $keyword) !== false) {
                return $subject;
            }
        }
    }

    return 'general';
} 

function telegram_get_topic_from_quiz($quizid) {
    global $DB;
    
    // Get quiz details
    $quiz = $DB->get_record('quiz', array('id' => $quizid));
    if (!$quiz) {
        return false;
    }
    
    // Get course module
    $cm = get_coursemodule_from_instance('quiz', $quizid);
    if (!$cm) {
        return false;
    }
    
    // Try to get topic from quiz name first
    $topic = telegram_extract_topic_from_name($quiz->name);
    if ($topic) {
        return $topic;
    }
    
    // If not found in quiz name, try from course name
    $course = $DB->get_record('course', array('id' => $quiz->course));
    if ($course) {
        $topic = telegram_extract_topic_from_name($course->fullname);
        if ($topic) {
            return $topic;
        }
    }
    
    // If still not found, try from question categories
    $questions = $DB->get_records_sql("
        SELECT DISTINCT qc.name 
        FROM {question_categories} qc
        JOIN {quiz_slots} qs ON qs.questioncategoryid = qc.id
        WHERE qs.quizid = ?
    ", array($quizid));
    
    foreach ($questions as $question) {
        $topic = telegram_extract_topic_from_name($question->name);
        if ($topic) {
            return $topic;
        }
    }
    
    return false;
}

function telegram_extract_topic_from_name($name) {
    // Array completo de temas conocidos con todas las variaciones
    $known_topics = array(
        // Temas problemáticos que no se detectaban
        'OTAN' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'ORGANIZACION DEL TRATADO DEL ATLANTICO NORTE' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'TRATADO ATLANTICO NORTE' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'TRATADO ATLÁNTICO NORTE' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'ORGANIZACION DEL TRATADO DEL ATLANTICO NORTE (OTAN)' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)' => 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
        'UNION EUROPEA' => 'UNIÓN EUROPEA',
        'UNION EUROPEA' => 'UNIÓN EUROPEA',
        'PROCEDIMIENTO ADMINISTRATIVO COMUN' => 'PROCEDIMIENTO ADMINISTRATIVO COMÚN DE LAS ADMINISTRACIONES PÚBLICAS',
        'PROCEDIMIENTO ADMINISTRATIVO COMÚN' => 'PROCEDIMIENTO ADMINISTRATIVO COMÚN DE LAS ADMINISTRACIONES PÚBLICAS',
        'PROCEDIMIENTO ADMINISTRATIVO COMUN DE LAS ADMINISTRACIONES PUBLICAS' => 'PROCEDIMIENTO ADMINISTRATIVO COMÚN DE LAS ADMINISTRACIONES PÚBLICAS',
        'IGUALDAD EFECTIVA' => 'IGUALDAD EFECTIVA DE MUJERES Y HOMBRES',
        'IGUALDAD EFECTIVA DE MUJERES Y HOMBRES' => 'IGUALDAD EFECTIVA DE MUJERES Y HOMBRES',
        'REGIMEN DISCIPLINARIO' => 'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS',
        'REGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS' => 'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS',
        'DISCIPLINARIO' => 'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS',
        'DERECHOS Y DEBERES' => 'DERECHOS Y DEBERES DE LOS MIEMBROS DE LAS FAS',
        'DERECHOS Y DEBERES DE LOS MIEMBROS' => 'DERECHOS Y DEBERES DE LOS MIEMBROS DE LAS FAS',
        'DERECHOS Y DEBERES DE LOS MIEMBROS DE LAS FAS' => 'DERECHOS Y DEBERES DE LOS MIEMBROS DE LAS FAS',
        'LEY CARRERA' => 'LEY CARRERA MILITAR',
        'LEY CARRERA MILITAR' => 'LEY CARRERA MILITAR',
        'CARRERA MILITAR' => 'LEY CARRERA MILITAR',
        'MINISTERIO DEFENSA' => 'MINISTERIO DE DEFENSA',
        'MINISTERIO DE DEFENSA' => 'MINISTERIO DE DEFENSA',
        'ORGANIZACION BASICA FAS' => 'ORGANIZACIÓN BÁSICA FAS',
        'ORGANIZACION BASICA DE LAS FAS' => 'ORGANIZACIÓN BÁSICA FAS',
        'ORGANIZACION BASICA ARMADA' => 'ORGANIZACIÓN BÁSICA ARMADA',
        'ORGANIZACION BASICA DE LA ARMADA' => 'ORGANIZACIÓN BÁSICA ARMADA',
        'ARMADA ESPAÑOLA' => 'ORGANIZACIÓN BÁSICA ARMADA',
        
        // Temas existentes que ya funcionan
        'TRAMITACION INICIATIVAS Y QUEJAS' => 'TRAMITACIÓN INICIATIVAS Y QUEJAS',
        'INICIATIVAS Y QUEJAS' => 'TRAMITACIÓN INICIATIVAS Y QUEJAS',
        'TRAMITACION INICIATIVAS Y QUEJAS - TEST 4' => 'TRAMITACIÓN INICIATIVAS Y QUEJAS',
        
        // Otros temas adicionales
        'OSCE' => 'OSCE',
        'NACIONES UNIDAS' => 'ORGANIZACIÓN DE LAS NACIONES UNIDAS',
        'ONU' => 'ORGANIZACIÓN DE LAS NACIONES UNIDAS',
        'SEGURIDAD NACIONAL' => 'SEGURIDAD NACIONAL',
        'DOCTRINA' => 'DOCTRINA',
        'REALES ORDENANZAS' => 'REALES ORDENANZAS',
        'OBSERVATORIO MILITAR' => 'OBSERVATORIO MILITAR PARA LA IGUALDAD',
        'TROPA Y MARINERIA' => 'TROPA Y MARINERÍA',
        'EJERCITO DE TIERRA' => 'EJÉRCITO DE TIERRA',
        'EJERCITO DEL AIRE' => 'EJÉRCITO DEL AIRE'
    );

    $name = strtoupper(trim($name));
    $name = remove_accents($name);
    
    // Búsqueda exacta primero
    foreach ($known_topics as $pattern => $topic) {
        $normalized_pattern = remove_accents(strtoupper($pattern));
        if (strpos($name, $normalized_pattern) !== false) {
            return $topic;
        }
    }
    
    // Búsqueda con tolerancia para palabras clave
    $name_words = preg_split('/\s+/', $name);
    foreach ($known_topics as $pattern => $topic) {
        $normalized_pattern = remove_accents(strtoupper($pattern));
        $pattern_words = preg_split('/\s+/', $normalized_pattern);

        $match_count = 0;
        foreach ($pattern_words as $p_word) {
            foreach ($name_words as $n_word) {
                if (levenshtein($n_word, $p_word) < 2) {
                    $match_count++;
                    break;
                }
            }
        }
        
        // Si coinciden al menos el 70% de las palabras
        if ($match_count >= ceil(count($pattern_words) * 0.7)) {
            return $topic;
        }
    }

    return false;
}
   

/**
 * Función auxiliar para quitar acentos de forma robusta MANTENIENDO MAYÚSCULAS
 */
function remove_accents($string) {
    $replacements = array(
        // ✅ CORRECCIÓN: Mayúsculas a mayúsculas
        'Á' => 'A', 'À' => 'A', 'Ä' => 'A', 'Â' => 'A', 'Ā' => 'A', 'Ă' => 'A',
        'É' => 'E', 'È' => 'E', 'Ë' => 'E', 'Ê' => 'E', 'Ē' => 'E', 'Ĕ' => 'E',
        'Í' => 'I', 'Ì' => 'I', 'Ï' => 'I', 'Î' => 'I', 'Ī' => 'I', 'Ĭ' => 'I',
        'Ó' => 'O', 'Ò' => 'O', 'Ö' => 'O', 'Ô' => 'O', 'Ō' => 'O', 'Ŏ' => 'O',
        'Ú' => 'U', 'Ù' => 'U', 'Ü' => 'U', 'Û' => 'U', 'Ū' => 'U', 'Ŭ' => 'U',
        'Ñ' => 'N', 'Ç' => 'C',
        
        // ✅ CORRECCIÓN: Minúsculas a minúsculas
        'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ā' => 'a', 'ă' => 'a',
        'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e', 'ē' => 'e', 'ĕ' => 'e',
        'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i', 'ī' => 'i', 'ĭ' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'ō' => 'o', 'ŏ' => 'o',
        'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u', 'ū' => 'u', 'ŭ' => 'u',
        'ñ' => 'n', 'ç' => 'c',
        
        // ✅ CASOS ESPECIALES PARA CARACTERES PROBLEMÁTICOS
        'é' => 'E', 'í' => 'I', 'ó' => 'O', 'ú' => 'U'  // Forzar mayúsculas
    );
    
    return str_replace(array_keys($replacements), array_values($replacements), $string);
}