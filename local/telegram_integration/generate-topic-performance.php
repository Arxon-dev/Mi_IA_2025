<?php
require_once(__DIR__ . '/../../config.php');

/**
 * Genera los datos de rendimiento por tema para un usuario.
 *
 * @param int $telegram_user_id
 * @return array
 */
function local_telegram_integration_generate_topic_performance_data($telegram_user_id) {
    global $DB;

    $verification = $DB->get_record('local_telegram_verification', ['telegram_user_id' => $telegram_user_id]);
    if (!$verification || !$verification->moodle_user_id) {
        return ['error' => 'Usuario de Telegram no vinculado a un usuario de Moodle.'];
    }
    $moodle_user_id = $verification->moodle_user_id;

    // Esta consulta es más compleja. Se une quiz_attempts con quiz para obtener el nombre,
    // y luego se usa la función de mapeo para agrupar por tema.
    // NOTA: Esta consulta puede ser pesada en sitios grandes.
    $sql = "
        SELECT 
            q.name as quizname,
            qa.sumgrades,
            q.grade as maxgrade,
            qa.timefinish
        FROM 
            {quiz_attempts} qa
        JOIN 
            {quiz} q ON qa.quiz = q.id
        WHERE 
            qa.userid = ? AND qa.state = 'finished'
    ";

    try {
        $attempts = $DB->get_records_sql($sql, [$moodle_user_id]);

        if (empty($attempts)) {
            return [];
        }

        $topic_performance = [];

        foreach ($attempts as $attempt) {
            $subject = local_telegram_integration_map_quiz_to_subject($attempt->quizname);
            
            if (!isset($topic_performance[$subject])) {
                $topic_performance[$subject] = [
                    'correct' => 0,
                    'total' => 0,
                    'total_grade' => 0,
                    'total_max_grade' => 0,
                    'last_activity_timestamp' => 0
                ];
            }
            
            // Aquí, `sumgrades` se trata como 'correctas' y `maxgrade` como 'total' para simplificar.
            // Una implementación más precisa requeriría analizar pregunta por pregunta.
            $topic_performance[$subject]['correct'] += (float)$attempt->sumgrades;
            $topic_performance[$subject]['total'] += (float)$attempt->maxgrade;
            
            if ($attempt->timefinish > $topic_performance[$subject]['last_activity_timestamp']) {
                $topic_performance[$subject]['last_activity_timestamp'] = $attempt->timefinish;
            }
        }
        
        $chart_data = [
            'labels' => [],
            'datasets' => [
                [
                    'label' => 'Rendimiento Promedio (%)',
                    'data' => [],
                    'backgroundColor' => [],
                    'borderColor' => [],
                    'borderWidth' => 1
                ]
            ]
        ];

        foreach ($topic_performance as $topic => $data) {
            $chart_data['labels'][] = ucfirst($topic);
            $average_performance = ($data['total'] > 0) ? round(($data['correct'] / $data['total']) * 100, 2) : 0;
            $chart_data['datasets'][0]['data'][] = $average_performance;
            
            // Asignar colores basados en el rendimiento
            $color = 'rgba(255, 99, 132, 0.6)'; // Rojo por defecto
            if ($average_performance >= 75) {
                $color = 'rgba(75, 192, 192, 0.6)'; // Verde
            } elseif ($average_performance >= 50) {
                $color = 'rgba(255, 206, 86, 0.6)'; // Amarillo
            }
            $chart_data['datasets'][0]['backgroundColor'][] = $color;
            $chart_data['datasets'][0]['borderColor'][] = str_replace('0.6', '1', $color);
        }

        return $chart_data;

    } catch (Exception $e) {
        return ['error' => 'Error al consultar la base de datos: ' . $e->getMessage()];
    }
}

// Se necesita esta función aquí si no está cargada globalmente en el contexto de ejecución.
if (!function_exists('local_telegram_integration_map_quiz_to_subject')) {
    function local_telegram_integration_map_quiz_to_subject($quizname) {
        $quizname = strtolower($quizname);
        $map = [
            'constitucional' => ['constitución', 'constitucion', 'tribunal constitucional'],
            'unión europea' => ['unión europea', 'ue', 'tratados ue'],
            'organismos internacionales' => ['organismos internacionales', 'onu', 'otan', 'osce'],
            'derecho administrativo' => ['derecho administrativo', 'procedimiento administrativo', 'acto administrativo'],
            'empleo público' => ['empleo público', 'función pública', 'ebep'],
            'igualdad' => ['igualdad', 'violencia de género'],
            'interior' => ['interior', 'fuerzas y cuerpos de seguridad', 'ley 2/86'],
            'defensa nacional' => ['defensa nacional', 'ley de defensa'],
            'instituciones penitenciarias' => ['instituciones penitenciarias', 'derecho penitenciario', 'logp'],
            'protección civil' => ['protección civil', 'emergencias'],
            'unidades didácticas' => ['unidades didácticas', 'ud', 'programación didáctica'],
            'supuestos prácticos' => ['supuestos prácticos', 'casos prácticos'],
            'psicotécnicos' => ['psicotécnicos', 'psicotecnicos'],
            'legislación' => ['legislación', 'leyes', 'normativa'],
            'general' => ['general', 'conocimientos generales', 'cultura general', 'test general']
        ];

        foreach ($map as $subject => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($quizname, $keyword) !== false) {
                    return $subject;
                }
            }
        }
        return 'general';
    }
} 