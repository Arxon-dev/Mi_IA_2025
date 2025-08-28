<?php

require_once(__DIR__ . '/../../config.php');

/**
 * Genera los datos para el gráfico de la línea de tiempo del progreso diario.
 *
 * @param int $telegram_user_id
 * @param string $date La fecha en formato Y-m-d
 * @return array
 */
function local_telegram_integration_generate_progress_timeline_data($telegram_user_id, $date) {
    global $DB;

    // Obtener el moodle user id a partir del telegram user id
    $verification = $DB->get_record('local_telegram_verification', ['telegram_user_id' => $telegram_user_id]);
    if (!$verification || !$verification->moodle_user_id) {
        // Devuelve un array con una clave de error si el usuario no está vinculado
        return ['error' => 'Usuario de Telegram no vinculado a un usuario de Moodle.'];
    }
    $moodle_user_id = $verification->moodle_user_id;

    // Consulta para obtener los intentos de cuestionario finalizados para un usuario en una fecha específica
    $sql = "
        SELECT 
            qa.id,
            qa.timefinish,
            qa.sumgrades,
            q.name as quiz_name,
            q.grade as quiz_max_grade
        FROM 
            {quiz_attempts} qa
        JOIN 
            {quiz} q ON qa.quiz = q.id
        WHERE 
            qa.userid = ? AND 
            qa.state = 'finished' AND
            " . $DB->sql_like('FROM_UNIXTIME(qa.timefinish, \'%Y-%m-%d\')', ':date') . "
        ORDER BY 
            qa.timefinish ASC
    ";

    try {
        $params = ['userid' => $moodle_user_id, 'date' => $date];
        // En Moodle, los parámetros con nombre para sql_like se pasan como un array asociativo
        $daily_attempts = $DB->get_records_sql($sql, ['userid' => $moodle_user_id, 'date' => $date]);

        if (empty($daily_attempts)) {
            // No hay intentos para esta fecha, devuelve un array vacío
            return [];
        }

        // Preparar la estructura de datos para Chart.js
        $chart_data = [
            'labels' => [],
            'datasets' => [
                [
                    'label' => 'Calificación Porcentual (%)',
                    'data' => [],
                    'borderColor' => 'rgba(75, 192, 192, 1)',
                    'backgroundColor' => 'rgba(75, 192, 192, 0.2)',
                    'fill' => true,
                    'tension' => 0.4
                ]
            ]
        ];
        
        // Procesar cada intento para calcular el porcentaje y añadirlo a los datos del gráfico
        foreach ($daily_attempts as $attempt) {
            // Formatear la hora para la etiqueta del gráfico
            $chart_data['labels'][] = userdate($attempt->timefinish, '%H:%M');
            
            // Calcular la calificación como un porcentaje
            $max_grade = (float)$attempt->quiz_max_grade > 0 ? (float)$attempt->quiz_max_grade : 100.0;
            $percentage_grade = round(((float)$attempt->sumgrades / $max_grade) * 100, 2);
            
            $chart_data['datasets'][0]['data'][] = $percentage_grade;
        }

        return $chart_data;

    } catch (Exception $e) {
        // En caso de error en la base de datos, devolver un array con el mensaje de error
        return ['error' => 'Error al consultar la base de datos: ' . $e->getMessage()];
    }
}