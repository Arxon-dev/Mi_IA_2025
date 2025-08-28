<?php
// Script para corregir el problema de courseid en statistics.php
// Este script debe subirse al hosting para aplicar la corrección

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Corrección del problema de courseid en Statistics</h2>";
echo "<hr>";

// 1. Verificar el problema actual
echo "<h3>1. Verificando el problema actual</h3>";
$courseid = optional_param('courseid', 0, PARAM_INT);
echo "Courseid recibido: {$courseid}<br>";

if ($courseid == 0) {
    echo "✗ Problema identificado: courseid es 0<br>";
    echo "Esto puede causar problemas en las consultas SQL que esperan un courseid válido.<br>";
} else {
    echo "✓ Courseid válido: {$courseid}<br>";
}

echo "<hr>";

// 2. Probar consulta con courseid = 0
echo "<h3>2. Probando consulta con courseid = 0</h3>";
try {
    $sql = "SELECT COUNT(*) as total FROM {neuroopositor_user_progress} WHERE userid = ? AND courseid = ?";
    $count = $DB->get_field_sql($sql, [$USER->id, 0]);
    echo "✓ Consulta con courseid=0 exitosa. Registros encontrados: {$count}<br>";
} catch (Exception $e) {
    echo "✗ Error en consulta con courseid=0: " . $e->getMessage() . "<br>";
}

echo "<hr>";

// 3. Verificar si hay registros con courseid diferente de 0
echo "<h3>3. Verificando registros con courseid != 0</h3>";
try {
    $sql = "SELECT DISTINCT courseid, COUNT(*) as total FROM {neuroopositor_user_progress} GROUP BY courseid ORDER BY courseid";
    $courseids = $DB->get_records_sql($sql);
    
    if ($courseids) {
        echo "<table border='1'><tr><th>Course ID</th><th>Registros</th></tr>";
        foreach ($courseids as $record) {
            echo "<tr><td>{$record->courseid}</td><td>{$record->total}</td></tr>";
        }
        echo "</table>";
    } else {
        echo "No se encontraron registros en neuroopositor_user_progress<br>";
    }
} catch (Exception $e) {
    echo "✗ Error verificando courseids: " . $e->getMessage() . "<br>";
}

echo "<hr>";

// 4. Crear archivo statistics.php corregido
echo "<h3>4. Creando archivo statistics.php corregido</h3>";

$corrected_statistics = '<?php
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

defined(\'MOODLE_INTERNAL\') || die();

require_once($CFG->libdir . \'/dml/moodle_database.php\');

/**
 * Clase para gestionar estadísticas y métricas del sistema
 */
class statistics {
    
    /**
     * Obtiene estadísticas generales del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso (opcional, por defecto 0)
     * @return array Array con estadísticas generales
     */
    public static function get_user_general_stats($userid, $courseid = 0) {
        global $DB;
        
        try {
            // Progreso general - consulta simplificada sin courseid si es 0
            if ($courseid > 0) {
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
            } else {
                // Si courseid es 0, buscar en todos los cursos
                $progress_data = $DB->get_record_sql("
                    SELECT 
                        AVG(porcentaje_dominio) as progreso_promedio,
                        COUNT(*) as temas_estudiados,
                        SUM(preguntas_correctas) as total_correctas,
                        SUM(preguntas_totales) as total_preguntas,
                        SUM(tiempo_estudio_segundos) as tiempo_total
                    FROM {neuroopositor_user_progress}
                    WHERE userid = ? AND preguntas_totales > 0
                ", [$userid]);
            }
            
            $preguntas_correctas = $progress_data ? $progress_data->total_correctas : 0;
            $preguntas_totales = $progress_data ? $progress_data->total_preguntas : 0;
            $tiempo_total = $progress_data ? $progress_data->tiempo_total : 0;
            
            // Calcular tiempo promedio de sesión
            if ($courseid > 0) {
                $session_count = $DB->count_records_select(
                    \'neuroopositor_user_progress\',
                    \'userid = ? AND courseid = ? AND preguntas_totales > 0\',
                    [$userid, $courseid]
                );
            } else {
                $session_count = $DB->count_records_select(
                    \'neuroopositor_user_progress\',
                    \'userid = ? AND preguntas_totales > 0\',
                    [$userid]
                );
            }
            
            $stats = array(
                \'overall_progress\' => $progress_data ? round($progress_data->progreso_promedio, 1) : 0,
                \'topics_studied\' => $progress_data ? $progress_data->temas_estudiados : 0,
                \'accuracy\' => $preguntas_totales > 0 ? round(($preguntas_correctas / $preguntas_totales) * 100, 1) : 0,
                \'total_study_time\' => $tiempo_total,
                \'total_questions\' => $preguntas_totales,
                \'correct_answers\' => $preguntas_correctas,
                \'current_streak\' => self::calculate_current_streak($userid, $courseid),
                \'avg_session_time\' => $session_count > 0 ? round($tiempo_total / $session_count, 0) : 0,
                \'total_topics\' => $DB->count_records(\'neuroopositor_temas\'),
                \'completed_topics\' => $courseid > 0 ? 
                    $DB->count_records_select(
                        \'neuroopositor_user_progress\',
                        \'userid = ? AND courseid = ? AND porcentaje_dominio >= 80\',
                        [$userid, $courseid]
                    ) :
                    $DB->count_records_select(
                        \'neuroopositor_user_progress\',
                        \'userid = ? AND porcentaje_dominio >= 80\',
                        [$userid]
                    )
            );
            
            return $stats;
            
        } catch (Exception $e) {
            // En caso de error, devolver estadísticas vacías
            return array(
                \'overall_progress\' => 0,
                \'topics_studied\' => 0,
                \'accuracy\' => 0,
                \'total_study_time\' => 0,
                \'total_questions\' => 0,
                \'correct_answers\' => 0,
                \'current_streak\' => 0,
                \'avg_session_time\' => 0,
                \'total_topics\' => 0,
                \'completed_topics\' => 0,
                \'error\' => $e->getMessage()
            );
        }
    }
    
    /**
     * Obtiene estadísticas por bloque
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso (opcional, por defecto 0)
     * @return array Array de estadísticas por bloque
     */
    public static function get_user_block_stats($userid, $courseid = 0) {
        global $DB;
        
        try {
            if ($courseid > 0) {
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
            } else {
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
                        AND up.userid = ?
                    GROUP BY t.bloque
                    ORDER BY t.bloque
                ";
                $records = $DB->get_records_sql($sql, [$userid]);
            }
            
            $block_stats = [];
            
            foreach ($records as $record) {
                $block_stats[] = array(
                    \'block\' => $record->bloque,
                    \'total_topics\' => $record->total_temas,
                    \'studied_topics\' => $record->temas_estudiados ?: 0,
                    \'avg_progress\' => $record->progreso_promedio ? round($record->progreso_promedio, 1) : 0,
                    \'accuracy\' => ($record->totales > 0) ? 
                        round(($record->correctas / $record->totales) * 100, 1) : 0,
                    \'total_time\' => $record->tiempo_total ?: 0,
                    \'completion_percentage\' => ($record->total_temas > 0) ? 
                        round(($record->temas_estudiados / $record->total_temas) * 100, 1) : 0
                );
            }
            
            return $block_stats;
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Obtiene el progreso histórico del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso (opcional, por defecto 0)
     * @param int $days Número de días hacia atrás
     * @return array Array con datos históricos
     */
    public static function get_user_progress_history($userid, $courseid = 0, $days = 30) {
        global $DB;
        
        try {
            $start_time = time() - ($days * 24 * 60 * 60);
            
            if ($courseid > 0) {
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
            } else {
                $sql = "
                    SELECT 
                        DATE(FROM_UNIXTIME(up.ultima_actividad)) as fecha,
                        AVG(up.porcentaje_dominio) as progreso_promedio,
                        SUM(up.preguntas_correctas) as correctas,
                        SUM(up.preguntas_totales) as totales,
                        SUM(up.tiempo_estudio_segundos) as tiempo_total,
                        COUNT(DISTINCT up.tema_id) as temas_estudiados
                    FROM {neuroopositor_user_progress} up
                    WHERE up.userid = ?
                        AND up.ultima_actividad >= ?
                    GROUP BY DATE(FROM_UNIXTIME(up.ultima_actividad))
                    ORDER BY fecha DESC
                ";
                $records = $DB->get_records_sql($sql, [$userid, $start_time]);
            }
            
            $history = [];
            
            foreach ($records as $record) {
                $history[] = [
                    \'date\' => $record->fecha,
                    \'avg_progress\' => round($record->progreso_promedio, 1),
                    \'accuracy\' => ($record->totales > 0) ? 
                        round(($record->correctas / $record->totales) * 100, 1) : 0,
                    \'study_time\' => $record->tiempo_total,
                    \'topics_studied\' => $record->temas_estudiados
                ];
            }
            
            return $history;
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Obtiene estadísticas de rendimiento por tema
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso (opcional, por defecto 0)
     * @param int $limit Límite de resultados
     * @return array Array de estadísticas por tema
     */
    public static function get_topic_performance($userid, $courseid = 0, $limit = 10) {
        global $DB;
        
        try {
            if ($courseid > 0) {
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
                    LIMIT ?
                ";
                $records = $DB->get_records_sql($sql, [$userid, $courseid, $limit]);
            } else {
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
                    WHERE up.userid = ? AND up.preguntas_totales > 0
                    ORDER BY up.porcentaje_dominio DESC, up.timemodified DESC
                    LIMIT ?
                ";
                $records = $DB->get_records_sql($sql, [$userid, $limit]);
            }
            
            $performance = [];
            
            foreach ($records as $record) {
                $topic_perf = array(
                    \'id\' => $record->id,
                    \'title\' => $record->titulo,
                    \'block\' => $record->bloque,
                    \'number\' => $record->numero,
                    \'progress\' => round($record->porcentaje_dominio, 1),
                    \'accuracy\' => ($record->preguntas_totales > 0) ? 
                        round(($record->preguntas_correctas / $record->preguntas_totales) * 100, 1) : 0,
                    \'study_time\' => $record->tiempo_estudio_segundos ?: 0,
                    \'difficulty\' => $record->nivel_dificultad ?: \'Medium\',
                    \'confidence\' => $record->nivel_confianza ?: 0,
                    \'last_activity\' => $record->timemodified
                );
                
                $performance[] = $topic_perf;
            }
            
            return $performance;
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Calcula la racha actual del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso (opcional, por defecto 0)
     * @return int Días de racha actual
     */
    private static function calculate_current_streak($userid, $courseid = 0) {
        global $DB;
        
        try {
            // Obtener actividad de los últimos 30 días
            $start_time = time() - (30 * 24 * 60 * 60);
            
            if ($courseid > 0) {
                $sql = "
                    SELECT DISTINCT DATE(FROM_UNIXTIME(ultima_actividad)) as fecha
                    FROM {neuroopositor_user_progress}
                    WHERE userid = ? AND courseid = ? AND ultima_actividad >= ?
                    ORDER BY fecha DESC
                ";
                $activity_days = $DB->get_fieldset_sql($sql, [$userid, $courseid, $start_time]);
            } else {
                $sql = "
                    SELECT DISTINCT DATE(FROM_UNIXTIME(ultima_actividad)) as fecha
                    FROM {neuroopositor_user_progress}
                    WHERE userid = ? AND ultima_actividad >= ?
                    ORDER BY fecha DESC
                ";
                $activity_days = $DB->get_fieldset_sql($sql, [$userid, $start_time]);
            }
            
            if (empty($activity_days)) {
                return 0;
            }
            
            $streak = 0;
            $today = date(\'Y-m-d\');
            $yesterday = date(\'Y-m-d\', strtotime(\'-1 day\'));
            
            // Verificar si hay actividad hoy o ayer
            if (!in_array($today, $activity_days) && !in_array($yesterday, $activity_days)) {
                return 0;
            }
            
            // Contar días consecutivos
            $current_date = $today;
            foreach ($activity_days as $activity_date) {
                if ($activity_date === $current_date || $activity_date === date(\'Y-m-d\', strtotime($current_date . \' -1 day\'))) {
                    $streak++;
                    $current_date = date(\'Y-m-d\', strtotime($activity_date . \' -1 day\'));
                } else {
                    break;
                }
            }
            
            return $streak;
            
        } catch (Exception $e) {
            return 0;
        }
    }
}
';

// Escribir el archivo corregido
$file_path = $CFG->dirroot . '/local/neuroopositor/classes/statistics_fixed.php';
if (file_put_contents($file_path, $corrected_statistics)) {
    echo "✓ Archivo statistics_fixed.php creado exitosamente<br>";
    echo "Ubicación: {$file_path}<br>";
    echo "<br><strong>Instrucciones:</strong><br>";
    echo "1. Descarga este archivo desde el hosting<br>";
    echo "2. Renómbralo a 'statistics.php'<br>";
    echo "3. Reemplaza el archivo original en /local/neuroopositor/classes/<br>";
    echo "4. Sube el archivo corregido al hosting<br>";
} else {
    echo "✗ Error al crear el archivo corregido<br>";
}

echo "<hr>";
echo "<h3>Corrección Completada</h3>";
echo "Fecha: " . date('Y-m-d H:i:s') . "<br>";
?>