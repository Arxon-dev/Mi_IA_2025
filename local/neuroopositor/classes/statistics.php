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
 * Clase para manejo de estadísticas en NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/dml/moodle_database.php');

/**
 * Clase para gestionar estadísticas y métricas del sistema
 */
class statistics {
    
    /**
     * Obtiene estadísticas generales del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return array Array con estadísticas generales
     */
    public static function get_user_general_stats($userid, $courseid) {
        global $DB;
        
        // Progreso general
        $progress_data = $DB->get_record_sql("
            SELECT 
                AVG(porcentaje_dominio) as progreso_promedio,
                COUNT(*) as temas_estudiados,
                SUM(preguntas_correctas) as total_correctas,
                SUM(preguntas_totales) as total_preguntas,
                SUM(tiempo_estudio_segundos) as tiempo_total
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND preguntas_totales > 0
        ", [$userid, $courseid]);
        
        $preguntas_correctas = $progress_data ? $progress_data->total_correctas : 0;
        $preguntas_totales = $progress_data ? $progress_data->total_preguntas : 0;
        $tiempo_total = $progress_data ? $progress_data->tiempo_total : 0;
        
        // Calcular tiempo promedio de sesión
        $session_count = $DB->count_records_select(
            'neuroopositor_user_progress',
            'userid = ? AND courseid = ? AND preguntas_totales > 0',
            [$userid, $courseid]
        );
        
        $stats = array(
            'overall_progress' => $progress_data ? round((float)($progress_data->progreso_promedio ?? 0), 1) : 0,
            'topics_studied' => $progress_data ? $progress_data->temas_estudiados : 0,
            'accuracy' => $preguntas_totales > 0 ? round(($preguntas_correctas / $preguntas_totales) * 100, 1) : 0,
            'total_study_time' => $tiempo_total,
            'total_questions' => $preguntas_totales,
            'correct_answers' => $preguntas_correctas,
            'current_streak' => self::calculate_current_streak($userid, $courseid),
            'avg_session_time' => $session_count > 0 ? round($tiempo_total / $session_count, 0) : 0,
            'total_topics' => $DB->count_records('neuroopositor_temas'),
            'completed_topics' => $DB->count_records_select(
                'neuroopositor_user_progress',
                'userid = ? AND courseid = ? AND porcentaje_dominio >= 80',
                [$userid, $courseid]
            )
        );
        
        return $stats;
    }
    
    /**
     * Obtiene estadísticas por bloque
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return array Array de estadísticas por bloque
     */
    public static function get_user_block_stats($userid, $courseid) {
        global $DB;
        
        $sql = "
            SELECT 
                t.bloque,
                COUNT(t.id) as total_temas,
                COUNT(up.id) as temas_estudiados,
                AVG(up.porcentaje_dominio) as progreso_promedio,
                SUM(up.preguntas_correctas) as correctas,
                SUM(up.preguntas_totales) as totales,
                SUM(up.tiempo_estudio_segundos) as tiempo_total
            FROM {neuroopositor_temas} t
            LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id 
                AND up.userid = ? AND up.courseid = ?
            GROUP BY t.bloque
            ORDER BY t.bloque
        ";
        
        $records = $DB->get_records_sql($sql, [$userid, $courseid]);
        $block_stats = [];
        
        foreach ($records as $record) {
            $block_stats[] = array(
                'block' => $record->bloque,
                'total_topics' => $record->total_temas,
                'studied_topics' => $record->temas_estudiados ?: 0,
                'avg_progress' => $record->progreso_promedio ? round($record->progreso_promedio, 1) : 0,
                'accuracy' => ($record->totales > 0) ? 
                    round(($record->correctas / $record->totales) * 100, 1) : 0,
                'total_time' => $record->tiempo_total ?: 0,
                'completion_percentage' => ($record->total_temas > 0) ? 
                    round(($record->temas_estudiados / $record->total_temas) * 100, 1) : 0
            );
        }
        
        return $block_stats;
    }
    
    /**
     * Obtiene el progreso histórico del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $days Número de días hacia atrás
     * @return array Array con datos históricos
     */
    public static function get_user_progress_history($userid, $courseid, $days = 30) {
        global $DB;
        
        $start_time = time() - ($days * 24 * 60 * 60);
        
        $sql = "
            SELECT 
                DATE(FROM_UNIXTIME(up.ultima_actividad)) as fecha,
                AVG(up.porcentaje_dominio) as progreso_promedio,
                SUM(up.preguntas_correctas) as correctas,
                SUM(up.preguntas_totales) as totales,
                SUM(up.tiempo_estudio_segundos) as tiempo_total,
                COUNT(DISTINCT up.tema_id) as temas_estudiados
            FROM {neuroopositor_user_progress} up
            WHERE up.userid = ? AND up.courseid = ?
                AND up.ultima_actividad >= ?
            GROUP BY DATE(FROM_UNIXTIME(up.ultima_actividad))
            ORDER BY fecha DESC
        ";
        
        $records = $DB->get_records_sql($sql, [$userid, $courseid, $start_time]);
        $history = [];
        
        foreach ($records as $record) {
            $history[] = [
                'date' => $record->fecha,
                'avg_progress' => round($record->progreso_promedio, 1),
                'accuracy' => ($record->totales > 0) ? 
                    round(($record->correctas / $record->totales) * 100, 1) : 0,
                'study_time' => $record->tiempo_total,
                'topics_studied' => $record->temas_estudiados
            ];
        }
        
        return $history;
    }
    
    /**
     * Obtiene estadísticas de rendimiento por tema
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $limit Límite de resultados
     * @return array Array de estadísticas por tema
     */
    public static function get_topic_performance($userid, $courseid, $limit = 10) {
        global $DB;
        
        $sql = "
            SELECT 
                t.id,
                t.titulo,
                t.bloque,
                t.numero,
                t.nivel_dificultad,
                up.porcentaje_dominio,
                up.preguntas_correctas,
                up.preguntas_totales,
                up.tiempo_estudio_segundos,
                up.nivel_confianza,
                up.timemodified
            FROM {neuroopositor_temas} t
            INNER JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id
            WHERE up.userid = ? AND up.courseid = ? AND up.preguntas_totales > 0
            ORDER BY up.porcentaje_dominio DESC, up.timemodified DESC
            LIMIT " . (int)$limit . "
        ";
        
        $records = $DB->get_records_sql($sql, [$userid, $courseid]);
        $performance = [];
        
        foreach ($records as $record) {
            $topic_perf = array(
                'id' => $record->id,
                'title' => $record->titulo,
                'block' => $record->bloque,
                'number' => $record->numero,
                'progress' => round((float)($record->porcentaje_dominio ?? 0), 1),
                'accuracy' => ($record->preguntas_totales > 0) ? 
                    round((($record->preguntas_correctas ?? 0) / $record->preguntas_totales) * 100, 1) : 0,
                'study_time' => $record->tiempo_estudio_segundos ?: 0,
                'difficulty' => $record->nivel_dificultad ?: 'Medium',
                'confidence' => $record->nivel_confianza ?: 0,
                'last_activity' => $record->timemodified
            );
            
            $performance[] = $topic_perf;
        }
        
        return $performance;
    }
    
    /**
     * Obtiene estadísticas comparativas con otros usuarios
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return object Objeto con estadísticas comparativas
     */
    public static function get_comparative_stats($userid, $courseid) {
        global $DB;
        
        $stats = new \stdClass();
        
        // Progreso del usuario
        $user_progress = $DB->get_field_sql("
            SELECT AVG(porcentaje_dominio)
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND preguntas_totales > 0
        ", [$userid, $courseid]);
        
        $stats->progreso_usuario = $user_progress ? round($user_progress, 1) : 0;
        
        // Progreso promedio de todos los usuarios
        $avg_progress = $DB->get_field_sql("
            SELECT AVG(porcentaje_dominio)
            FROM {neuroopositor_user_progress}
            WHERE courseid = ? AND preguntas_totales > 0
        ", [$courseid]);
        
        $stats->progreso_promedio = $avg_progress ? round($avg_progress, 1) : 0;
        
        // Ranking del usuario
        $ranking_sql = "
            SELECT COUNT(*) + 1 as ranking
            FROM (
                SELECT userid, AVG(porcentaje_dominio) as avg_progress
                FROM {neuroopositor_user_progress}
                WHERE courseid = ? AND preguntas_totales > 0
                GROUP BY userid
                HAVING avg_progress > ?
            ) as better_users
        ";
        
        $stats->ranking = $DB->get_field_sql($ranking_sql, [$courseid, $stats->progreso_usuario]);
        
        // Total de usuarios activos
        $stats->total_usuarios = $DB->get_field_sql("
            SELECT COUNT(DISTINCT userid)
            FROM {neuroopositor_user_progress}
            WHERE courseid = ? AND preguntas_totales > 0
        ", [$courseid]);
        
        // Percentil del usuario
        if ($stats->total_usuarios > 0) {
            $stats->percentil = round((($stats->total_usuarios - $stats->ranking + 1) / $stats->total_usuarios) * 100, 1);
        } else {
            $stats->percentil = 0;
        }
        
        return $stats;
    }
    
    /**
     * Obtiene estadísticas de actividad reciente
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $days Días hacia atrás
     * @return object Objeto con estadísticas de actividad
     */
    public static function get_recent_activity($userid, $courseid, $days = 7) {
        global $DB;
        
        $start_time = time() - ($days * 24 * 60 * 60);
        
        $activity = new \stdClass();
        
        // Sesiones de estudio
        $activity->sesiones_estudio = $DB->count_records_select(
            'neuroopositor_user_progress',
            'userid = ? AND courseid = ? AND ultima_actividad >= ?',
            [$userid, $courseid, $start_time]
        );
        
        // Tiempo total de estudio
        $activity->tiempo_total = $DB->get_field_sql("
            SELECT SUM(tiempo_estudio_segundos)
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND ultima_actividad >= ?
        ", [$userid, $courseid, $start_time]) ?: 0;
        
        // Preguntas respondidas
        $questions_data = $DB->get_record_sql("
            SELECT 
                SUM(preguntas_correctas) as correctas,
                SUM(preguntas_totales) as totales
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND ultima_actividad >= ?
        ", [$userid, $courseid, $start_time]);
        
        $activity->preguntas_respondidas = $questions_data ? $questions_data->totales : 0;
        $activity->preguntas_correctas = $questions_data ? $questions_data->correctas : 0;
        $activity->precision_reciente = ($activity->preguntas_respondidas > 0) ? 
            round(($activity->preguntas_correctas / $activity->preguntas_respondidas) * 100, 1) : 0;
        
        // Temas nuevos estudiados
        $activity->temas_nuevos = $DB->count_records_select(
            'neuroopositor_user_progress',
            'userid = ? AND courseid = ? AND timecreated >= ?',
            [$userid, $courseid, $start_time]
        );
        
        // Promedio diario
        $activity->promedio_tiempo_diario = round($activity->tiempo_total / $days, 1);
        $activity->promedio_preguntas_diario = round($activity->preguntas_respondidas / $days, 1);
        
        return $activity;
    }
    
    /**
     * Calcula la racha actual del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return int Días de racha actual
     */
    private static function calculate_current_streak($userid, $courseid) {
        global $DB;
        
        // Obtener actividad de los últimos 30 días
        $start_time = time() - (30 * 24 * 60 * 60);
        
        $sql = "
            SELECT DISTINCT DATE(FROM_UNIXTIME(ultima_actividad)) as fecha
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND ultima_actividad >= ?
            ORDER BY fecha DESC
        ";
        
        $activity_days = $DB->get_fieldset_sql($sql, [$userid, $courseid, $start_time]);
        
        if (empty($activity_days)) {
            return 0;
        }
        
        $streak = 0;
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        
        // Verificar si hay actividad hoy o ayer
        if (!in_array($today, $activity_days) && !in_array($yesterday, $activity_days)) {
            return 0;
        }
        
        // Contar días consecutivos
        $current_date = $today;
        foreach ($activity_days as $activity_date) {
            if ($activity_date === $current_date || $activity_date === date('Y-m-d', strtotime($current_date . ' -1 day'))) {
                $streak++;
                $current_date = date('Y-m-d', strtotime($activity_date . ' -1 day'));
            } else {
                break;
            }
        }
        
        return $streak;
    }
    
    /**
     * Obtiene estadísticas de conexiones neurales
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return object Objeto con estadísticas de conexiones
     */
    public static function get_neural_connections_stats($userid, $courseid) {
        global $DB;
        
        $stats = new \stdClass();
        
        // Obtener progreso del usuario
        $user_progress = user_progress::get_user_course_progress($userid, $courseid);
        $progress_map = [];
        foreach ($user_progress as $progress) {
            $progress_map[$progress->tema_id] = $progress->porcentaje_dominio;
        }
        
        // Obtener todas las conexiones
        $connections = connection::get_all_active();
        
        $stats->total_conexiones = count($connections);
        $stats->conexiones_activas = 0;
        $stats->fuerza_promedio = 0;
        $stats->tipos_conexion = [
            'directa' => 0,
            'conceptual' => 0,
            'practica' => 0,
            'temporal' => 0
        ];
        
        $total_strength = 0;
        
        foreach ($connections as $connection) {
            $from_progress = isset($progress_map[$connection->tema_origen]) ? $progress_map[$connection->tema_origen] : 0;
            $to_progress = isset($progress_map[$connection->tema_destino]) ? $progress_map[$connection->tema_destino] : 0;
            
            // Conexión activa si ambos temas tienen algún progreso
            if ($from_progress > 0 && $to_progress > 0) {
                $stats->conexiones_activas++;
                
                // Calcular fuerza de conexión
                $strength = min($from_progress, $to_progress) * ($connection->peso / 100);
                $total_strength += $strength;
            }
            
            // Contar tipos de conexión
            if (isset($stats->tipos_conexion[$connection->tipo])) {
                $stats->tipos_conexion[$connection->tipo]++;
            }
        }
        
        $stats->fuerza_promedio = $stats->conexiones_activas > 0 ? 
            round($total_strength / $stats->conexiones_activas, 1) : 0;
        
        return $stats;
    }
    
    /**
     * Genera reporte completo de estadísticas
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return object Objeto con reporte completo
     */
    public static function generate_complete_report($userid, $courseid) {
        $report = new \stdClass();
        
        $report->general = self::get_user_general_stats($userid, $courseid);
        $report->bloques = self::get_user_block_stats($userid, $courseid);
        $report->rendimiento_temas = self::get_topic_performance($userid, $courseid, 20);
        $report->comparativo = self::get_comparative_stats($userid, $courseid);
        $report->actividad_reciente = self::get_recent_activity($userid, $courseid);
        $report->conexiones_neurales = self::get_neural_connections_stats($userid, $courseid);
        $report->historial = self::get_user_progress_history($userid, $courseid, 30);
        
        $report->generado = time();
        $report->userid = $userid;
        $report->courseid = $courseid;
        
        return $report;
    }
}