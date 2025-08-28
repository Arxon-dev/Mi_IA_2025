<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Clase para manejo de preguntas en NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/dml/moodle_database.php');
require_once($CFG->dirroot . '/question/engine/lib.php');

/**
 * Clase para gestionar preguntas y su integración con el sistema neural
 */
class question_manager {
    
    /**
     * Obtiene preguntas de un tema específico
     *
     * @param int $tema_id ID del tema
     * @param int $limit Límite de preguntas
     * @param array $exclude_ids IDs de preguntas a excluir
     * @return array Array de preguntas
     */
    public static function get_tema_questions($tema_id, $limit = 10, $exclude_ids = []) {
        global $DB;
        
        // Obtener mapeo de preguntas para el tema
        $mappings = $DB->get_records('neuroopositor_question_mapping', ['tema_id' => $tema_id]);
        
        if (empty($mappings)) {
            return [];
        }
        
        $question_ids = [];
        foreach ($mappings as $mapping) {
            if (!in_array($mapping->question_id, $exclude_ids)) {
                $question_ids[] = $mapping->question_id;
            }
        }
        
        if (empty($question_ids)) {
            return [];
        }
        
        // Obtener preguntas de la tabla de Moodle
        list($in_sql, $params) = $DB->get_in_or_equal($question_ids, SQL_PARAMS_NUMBERED);
        $params[] = $limit;
        
        $sql = "
            SELECT q.*, qc.name as category_name
            FROM {question} q
            LEFT JOIN {question_categories} qc ON q.category = qc.id
            WHERE q.id $in_sql
            AND q.qtype IN ('multichoice', 'truefalse', 'shortanswer')
            ORDER BY RAND()
            LIMIT ?
        ";
        
        $questions = $DB->get_records_sql($sql, $params);
        
        // Enriquecer preguntas con datos adicionales
        foreach ($questions as &$question) {
            $question->answers = self::get_question_answers($question->id);
            $question->tema_id = $tema_id;
        }
        
        return array_values($questions);
    }
    
    /**
     * Obtiene las respuestas de una pregunta
     *
     * @param int $question_id ID de la pregunta
     * @return array Array de respuestas
     */
    public static function get_question_answers($question_id) {
        global $DB;
        
        $answers = $DB->get_records('question_answers', 
            ['question' => $question_id], 
            'id ASC'
        );
        
        $formatted_answers = [];
        foreach ($answers as $answer) {
            $formatted_answers[] = [
                'id' => $answer->id,
                'answer' => $answer->answer,
                'fraction' => $answer->fraction,
                'feedback' => $answer->feedback
            ];
        }
        
        return $formatted_answers;
    }
    
    /**
     * Procesa la respuesta de un usuario a una pregunta
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $question_id ID de la pregunta
     * @param mixed $user_answer Respuesta del usuario
     * @param int $time_spent Tiempo empleado en segundos
     * @return object Resultado del procesamiento
     */
    public static function process_user_answer($userid, $courseid, $question_id, $user_answer, $time_spent = 0) {
        global $DB;
        
        $result = new \stdClass();
        $result->correct = false;
        $result->score = 0;
        $result->feedback = '';
        
        // Obtener la pregunta
        $question = $DB->get_record('question', ['id' => $question_id]);
        if (!$question) {
            $result->error = 'Pregunta no encontrada';
            return $result;
        }
        
        // Obtener el tema asociado
        $mapping = $DB->get_record('neuroopositor_question_mapping', ['question_id' => $question_id]);
        if (!$mapping) {
            $result->error = 'Mapeo de tema no encontrado';
            return $result;
        }
        
        // Evaluar respuesta según el tipo de pregunta
        switch ($question->qtype) {
            case 'multichoice':
                $result = self::evaluate_multichoice($question_id, $user_answer);
                break;
            case 'truefalse':
                $result = self::evaluate_truefalse($question_id, $user_answer);
                break;
            case 'shortanswer':
                $result = self::evaluate_shortanswer($question_id, $user_answer);
                break;
            default:
                $result->error = 'Tipo de pregunta no soportado';
                return $result;
        }
        
        // Actualizar progreso del usuario
        if (!isset($result->error)) {
            self::update_user_progress($userid, $courseid, $mapping->tema_id, $result->correct, $time_spent);
            
            // Registrar la respuesta
            self::log_user_response($userid, $courseid, $question_id, $mapping->tema_id, $user_answer, $result->correct, $time_spent);
        }
        
        return $result;
    }
    
    /**
     * Evalúa una pregunta de opción múltiple
     *
     * @param int $question_id ID de la pregunta
     * @param int $answer_id ID de la respuesta seleccionada
     * @return object Resultado de la evaluación
     */
    private static function evaluate_multichoice($question_id, $answer_id) {
        global $DB;
        
        $result = new \stdClass();
        
        $answer = $DB->get_record('question_answers', ['id' => $answer_id, 'question' => $question_id]);
        
        if (!$answer) {
            $result->error = 'Respuesta no válida';
            return $result;
        }
        
        $result->correct = $answer->fraction > 0;
        $result->score = $answer->fraction;
        $result->feedback = $answer->feedback;
        $result->selected_answer = $answer->answer;
        
        return $result;
    }
    
    /**
     * Evalúa una pregunta verdadero/falso
     *
     * @param int $question_id ID de la pregunta
     * @param bool $user_answer Respuesta del usuario
     * @return object Resultado de la evaluación
     */
    private static function evaluate_truefalse($question_id, $user_answer) {
        global $DB;
        
        $result = new \stdClass();
        
        // Obtener la respuesta correcta
        $correct_answer = $DB->get_record_select(
            'question_answers',
            'question = ? AND fraction > 0',
            [$question_id]
        );
        
        if (!$correct_answer) {
            $result->error = 'No se encontró respuesta correcta';
            return $result;
        }
        
        // Comparar respuestas (1 = true, 0 = false)
        $is_true = (bool) $user_answer;
        $correct_is_true = strpos(strtolower($correct_answer->answer), 'true') !== false;
        
        $result->correct = $is_true === $correct_is_true;
        $result->score = $result->correct ? 1 : 0;
        $result->feedback = $correct_answer->feedback;
        $result->user_answer = $is_true ? 'Verdadero' : 'Falso';
        $result->correct_answer = $correct_is_true ? 'Verdadero' : 'Falso';
        
        return $result;
    }
    
    /**
     * Evalúa una pregunta de respuesta corta
     *
     * @param int $question_id ID de la pregunta
     * @param string $user_answer Respuesta del usuario
     * @return object Resultado de la evaluación
     */
    private static function evaluate_shortanswer($question_id, $user_answer) {
        global $DB;
        
        $result = new \stdClass();
        
        // Obtener todas las respuestas posibles
        $answers = $DB->get_records('question_answers', ['question' => $question_id], 'fraction DESC');
        
        if (empty($answers)) {
            $result->error = 'No se encontraron respuestas';
            return $result;
        }
        
        $user_answer = trim(strtolower($user_answer));
        $best_match = null;
        $best_score = 0;
        
        foreach ($answers as $answer) {
            $answer_text = trim(strtolower($answer->answer));
            
            // Coincidencia exacta
            if ($answer_text === $user_answer) {
                $best_match = $answer;
                $best_score = $answer->fraction;
                break;
            }
            
            // Coincidencia parcial usando similar_text
            $similarity = 0;
            similar_text($answer_text, $user_answer, $similarity);
            
            if ($similarity > 80 && $answer->fraction > $best_score) {
                $best_match = $answer;
                $best_score = $answer->fraction * ($similarity / 100);
            }
        }
        
        if ($best_match) {
            $result->correct = $best_score > 0.5;
            $result->score = $best_score;
            $result->feedback = $best_match->feedback;
            $result->user_answer = $user_answer;
            $result->expected_answer = $best_match->answer;
        } else {
            $result->correct = false;
            $result->score = 0;
            $result->feedback = 'Respuesta incorrecta';
            $result->user_answer = $user_answer;
        }
        
        return $result;
    }
    
    /**
     * Actualiza el progreso del usuario en un tema
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $tema_id ID del tema
     * @param bool $correct Si la respuesta fue correcta
     * @param int $time_spent Tiempo empleado
     */
    private static function update_user_progress($userid, $courseid, $tema_id, $correct, $time_spent) {
        // Obtener o crear progreso del usuario
        $progress = user_progress::get_by_user_tema_course($userid, $tema_id, $courseid);
        
        if (!$progress) {
            $progress = new user_progress();
            $progress->userid = $userid;
            $progress->tema_id = $tema_id;
            $progress->courseid = $courseid;
            $progress->porcentaje_dominio = 0;
            $progress->preguntas_correctas = 0;
            $progress->preguntas_totales = 0;
            $progress->tiempo_estudio = 0;
            $progress->nivel_confianza = 0;
        }
        
        // Actualizar estadísticas
        $progress->preguntas_totales++;
        if ($correct) {
            $progress->preguntas_correctas++;
        }
        $progress->tiempo_estudio += $time_spent;
        
        // Recalcular porcentaje de dominio
        $accuracy = $progress->preguntas_totales > 0 ? 
            ($progress->preguntas_correctas / $progress->preguntas_totales) * 100 : 0;
        
        // Aplicar curva de aprendizaje (más preguntas = mayor confianza en el porcentaje)
        $confidence_factor = min(1, $progress->preguntas_totales / 20); // Máxima confianza con 20 preguntas
        $progress->porcentaje_dominio = $accuracy * $confidence_factor;
        
        // Actualizar nivel de confianza
        $progress->nivel_confianza = $progress->calculate_confidence_level();
        
        $progress->save();
    }
    
    /**
     * Registra la respuesta del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $question_id ID de la pregunta
     * @param int $tema_id ID del tema
     * @param mixed $user_answer Respuesta del usuario
     * @param bool $correct Si fue correcta
     * @param int $time_spent Tiempo empleado
     */
    private static function log_user_response($userid, $courseid, $question_id, $tema_id, $user_answer, $correct, $time_spent) {
        global $DB;
        
        $log = new \stdClass();
        $log->userid = $userid;
        $log->courseid = $courseid;
        $log->question_id = $question_id;
        $log->tema_id = $tema_id;
        $log->user_answer = is_array($user_answer) ? json_encode($user_answer) : $user_answer;
        $log->correct = $correct ? 1 : 0;
        $log->time_spent = $time_spent;
        $log->timecreated = time();
        
        $DB->insert_record('neuroopositor_user_responses', $log);
    }
    
    /**
     * Mapea preguntas existentes a temas
     *
     * @param array $mappings Array de mapeos [question_id => tema_id]
     * @return bool True si se mapearon correctamente
     */
    public static function map_questions_to_temas($mappings) {
        global $DB;
        
        $success = true;
        
        foreach ($mappings as $question_id => $tema_id) {
            // Verificar que la pregunta existe
            if (!$DB->record_exists('question', ['id' => $question_id])) {
                continue;
            }
            
            // Verificar que el tema existe
            if (!$DB->record_exists('neuroopositor_temas', ['id' => $tema_id])) {
                continue;
            }
            
            // Verificar si ya existe el mapeo
            if ($DB->record_exists('neuroopositor_question_mapping', 
                ['question_id' => $question_id, 'tema_id' => $tema_id])) {
                continue;
            }
            
            // Crear el mapeo
            $mapping = new \stdClass();
            $mapping->question_id = $question_id;
            $mapping->tema_id = $tema_id;
            $mapping->weight = 1.0; // Peso por defecto
            $mapping->timecreated = time();
            
            if (!$DB->insert_record('neuroopositor_question_mapping', $mapping)) {
                $success = false;
            }
        }
        
        return $success;
    }
    
    /**
     * Obtiene estadísticas de preguntas por tema
     *
     * @param int $tema_id ID del tema
     * @return object Estadísticas del tema
     */
    public static function get_tema_question_stats($tema_id) {
        global $DB;
        
        $stats = new \stdClass();
        
        // Total de preguntas mapeadas
        $stats->total_questions = $DB->count_records('neuroopositor_question_mapping', ['tema_id' => $tema_id]);
        
        // Estadísticas de respuestas
        $response_stats = $DB->get_record_sql("
            SELECT 
                COUNT(*) as total_responses,
                SUM(correct) as correct_responses,
                AVG(time_spent) as avg_time_spent
            FROM {neuroopositor_user_responses}
            WHERE tema_id = ?
        ", [$tema_id]);
        
        $stats->total_responses = $response_stats ? $response_stats->total_responses : 0;
        $stats->correct_responses = $response_stats ? $response_stats->correct_responses : 0;
        $stats->avg_time_spent = $response_stats ? round($response_stats->avg_time_spent, 1) : 0;
        $stats->accuracy_rate = $stats->total_responses > 0 ? 
            round(($stats->correct_responses / $stats->total_responses) * 100, 1) : 0;
        
        // Dificultad estimada (basada en tasa de aciertos)
        if ($stats->accuracy_rate >= 80) {
            $stats->difficulty_level = 'Fácil';
        } elseif ($stats->accuracy_rate >= 60) {
            $stats->difficulty_level = 'Medio';
        } elseif ($stats->accuracy_rate >= 40) {
            $stats->difficulty_level = 'Difícil';
        } else {
            $stats->difficulty_level = 'Muy Difícil';
        }
        
        return $stats;
    }
    
    /**
     * Obtiene preguntas recomendadas para un usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $limit Límite de preguntas
     * @return array Array de preguntas recomendadas
     */
    public static function get_recommended_questions($userid, $courseid, $limit = 10) {
        // Obtener temas más débiles del usuario
        $weak_topics = user_progress::get_weakest_topics($userid, $courseid, 5);
        
        $recommended_questions = [];
        $questions_per_topic = max(1, floor($limit / count($weak_topics)));
        
        foreach ($weak_topics as $topic) {
            // Obtener preguntas ya respondidas por el usuario
            $answered_questions = self::get_user_answered_questions($userid, $topic->tema_id);
            
            // Obtener nuevas preguntas del tema
            $topic_questions = self::get_tema_questions(
                $topic->tema_id, 
                $questions_per_topic, 
                $answered_questions
            );
            
            $recommended_questions = array_merge($recommended_questions, $topic_questions);
        }
        
        // Si no hay suficientes preguntas, completar con preguntas aleatorias
        if (count($recommended_questions) < $limit) {
            $remaining = $limit - count($recommended_questions);
            $random_questions = self::get_random_questions($userid, $courseid, $remaining);
            $recommended_questions = array_merge($recommended_questions, $random_questions);
        }
        
        return array_slice($recommended_questions, 0, $limit);
    }
    
    /**
     * Obtiene preguntas ya respondidas por un usuario en un tema
     *
     * @param int $userid ID del usuario
     * @param int $tema_id ID del tema
     * @return array Array de IDs de preguntas
     */
    private static function get_user_answered_questions($userid, $tema_id) {
        global $DB;
        
        return $DB->get_fieldset_select(
            'neuroopositor_user_responses',
            'question_id',
            'userid = ? AND tema_id = ?',
            [$userid, $tema_id]
        );
    }
    
    /**
     * Obtiene preguntas aleatorias
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $limit Límite de preguntas
     * @return array Array de preguntas
     */
    private static function get_random_questions($userid, $courseid, $limit) {
        global $DB;
        
        // Obtener todas las preguntas ya respondidas por el usuario
        $answered_questions = $DB->get_fieldset_select(
            'neuroopositor_user_responses',
            'question_id',
            'userid = ? AND courseid = ?',
            [$userid, $courseid]
        );
        
        // Obtener preguntas no respondidas
        $exclude_sql = '';
        $params = [];
        
        if (!empty($answered_questions)) {
            list($exclude_sql, $params) = $DB->get_in_or_equal($answered_questions, SQL_PARAMS_NUMBERED, 'param', false);
            $exclude_sql = ' AND q.id ' . $exclude_sql;
        }
        
        $params[] = $limit;
        
        $sql = "
            SELECT q.*, qm.tema_id
            FROM {question} q
            INNER JOIN {neuroopositor_question_mapping} qm ON q.id = qm.question_id
            WHERE q.qtype IN ('multichoice', 'truefalse', 'shortanswer')
            $exclude_sql
            ORDER BY RAND()
            LIMIT ?
        ";
        
        $questions = $DB->get_records_sql($sql, $params);
        
        // Enriquecer con respuestas
        foreach ($questions as &$question) {
            $question->answers = self::get_question_answers($question->id);
        }
        
        return array_values($questions);
    }
}