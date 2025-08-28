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
 * Clase para manejo del progreso del usuario en NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/dml/moodle_database.php');

/**
 * Clase para gestionar el progreso del usuario en los temas
 */
class user_progress {
    
    /** @var int ID del progreso */
    public $id;
    
    /** @var int ID del usuario */
    public $userid;
    
    /** @var int ID del tema */
    public $tema_id;
    
    /** @var int ID del curso */
    public $courseid;
    
    /** @var float Porcentaje de dominio (0.0 - 100.0) */
    public $porcentaje_dominio;
    
    /** @var int Preguntas correctas */
    public $preguntas_correctas;
    
    /** @var int Total de preguntas respondidas */
    public $preguntas_totales;
    
    /** @var int Tiempo de estudio en segundos */
    public $tiempo_estudio_segundos;
    
    /** @var float Nivel de confianza (0.0 - 1.0) */
    public $nivel_confianza;
    
    /** @var int Timestamp de última actividad */
    public $ultima_actividad;
    
    /** @var int Timestamp de creación */
    public $timecreated;
    
    /** @var int Timestamp de modificación */
    public $timemodified;
    
    /**
     * Constructor
     *
     * @param object|null $data Datos del progreso
     */
    public function __construct($data = null) {
        if ($data) {
            $this->load_from_data($data);
        }
    }
    
    /**
     * Carga datos desde un objeto
     *
     * @param object $data Datos del progreso
     */
    private function load_from_data($data) {
        $this->id = isset($data->id) ? $data->id : null;
        $this->userid = $data->userid;
        $this->tema_id = $data->tema_id;
        $this->courseid = $data->courseid;
        $this->porcentaje_dominio = isset($data->porcentaje_dominio) ? (float) $data->porcentaje_dominio : 0.0;
        $this->preguntas_correctas = isset($data->preguntas_correctas) ? (int) $data->preguntas_correctas : 0;
        $this->preguntas_totales = isset($data->preguntas_totales) ? (int) $data->preguntas_totales : 0;
        $this->tiempo_estudio_segundos = isset($data->tiempo_estudio_segundos) ? (int) $data->tiempo_estudio_segundos : 0;
        $this->nivel_confianza = isset($data->nivel_confianza) ? (float) $data->nivel_confianza : 0.0;
        $this->ultima_actividad = isset($data->ultima_actividad) ? $data->ultima_actividad : time();
        $this->timecreated = isset($data->timecreated) ? $data->timecreated : time();
        $this->timemodified = isset($data->timemodified) ? $data->timemodified : time();
    }
    
    /**
     * Obtiene el ID del tema
     *
     * @return int ID del tema
     */
    public function get_tema_id() {
        return $this->tema_id;
    }
    
    /**
     * Obtiene el porcentaje de dominio
     *
     * @return float Porcentaje de dominio
     */
    public function get_porcentaje_dominio() {
        return $this->porcentaje_dominio;
    }
    
    /**
     * Obtiene las preguntas correctas
     *
     * @return int Preguntas correctas
     */
    public function get_preguntas_correctas() {
        return $this->preguntas_correctas;
    }
    
    /**
     * Obtiene el total de preguntas
     *
     * @return int Total de preguntas
     */
    public function get_preguntas_totales() {
        return $this->preguntas_totales;
    }
    
    /**
     * Obtiene el tiempo de estudio en segundos
     *
     * @return int Tiempo de estudio en segundos
     */
    public function get_tiempo_estudio_segundos() {
        return $this->tiempo_estudio_segundos;
    }
    
    /**
     * Obtiene el nivel de confianza
     *
     * @return float Nivel de confianza
     */
    public function get_nivel_confianza() {
        return $this->nivel_confianza;
    }
    
    /**
     * Obtiene la última actividad
     *
     * @return int Timestamp de última actividad
     */
    public function get_ultima_actividad() {
        return $this->ultima_actividad;
    }
    
    /**
     * Obtiene el progreso de un usuario para un curso
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return array Array de objetos user_progress
     */
    public static function get_user_progress($userid, $courseid) {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_user_progress', ['userid' => $userid]);
        $progress = [];
        
        foreach ($records as $record) {
            $progress[] = new self($record);
        }
        
        return $progress;
    }
    
    /**
     * Guarda el progreso en la base de datos
     *
     * @return bool|int ID del progreso guardado o false si falla
     */
    public function save() {
        global $DB;
        
        $data = $this->to_object();
        $data->timemodified = time();
        $data->ultima_actividad = time();
        
        if ($this->id) {
            // Actualizar progreso existente
            $data->id = $this->id;
            $result = $DB->update_record('neuroopositor_user_progress', $data);
            return $result ? $this->id : false;
        } else {
            // Verificar si ya existe un progreso para este usuario, tema y curso
            $existing = $DB->get_record('neuroopositor_user_progress', [
                'userid' => $this->userid,
                'tema_id' => $this->tema_id,
                'courseid' => $this->courseid
            ]);
            
            if ($existing) {
                // Actualizar el existente
                $this->id = $existing->id;
                $data->id = $this->id;
                $result = $DB->update_record('neuroopositor_user_progress', $data);
                return $result ? $this->id : false;
            } else {
                // Crear nuevo progreso
                $data->timecreated = time();
                $this->id = $DB->insert_record('neuroopositor_user_progress', $data);
                return $this->id;
            }
        }
    }
    
    /**
     * Elimina el progreso de la base de datos
     *
     * @return bool True si se eliminó correctamente
     */
    public function delete() {
        global $DB;
        
        if (!$this->id) {
            return false;
        }
        
        return $DB->delete_records('neuroopositor_user_progress', ['id' => $this->id]);
    }
    
    /**
     * Convierte el objeto a un objeto estándar para la BD
     *
     * @return object Objeto con los datos del progreso
     */
    public function to_object() {
        $obj = new \stdClass();
        $obj->userid = $this->userid;
        $obj->tema_id = $this->tema_id;
        $obj->courseid = $this->courseid;
        $obj->porcentaje_dominio = $this->porcentaje_dominio;
        $obj->preguntas_correctas = $this->preguntas_correctas;
        $obj->preguntas_totales = $this->preguntas_totales;
        $obj->tiempo_estudio_segundos = $this->tiempo_estudio_segundos;
        $obj->nivel_confianza = $this->nivel_confianza;
        $obj->ultima_actividad = $this->ultima_actividad;
        $obj->timecreated = $this->timecreated;
        $obj->timemodified = $this->timemodified;
        
        return $obj;
    }
    
    /**
     * Convierte el objeto a un array
     *
     * @return array Array con los datos del progreso
     */
    public function to_array() {
        return [
            'id' => $this->id,
            'userid' => $this->userid,
            'tema_id' => $this->tema_id,
            'courseid' => $this->courseid,
            'mastery_percentage' => $this->porcentaje_dominio,
            'questions_correct' => $this->preguntas_correctas,
            'questions_total' => $this->preguntas_totales,
            'study_time_seconds' => $this->tiempo_estudio_segundos,
            'confidence_level' => $this->nivel_confianza,
            'last_activity' => $this->ultima_actividad,
            'timecreated' => $this->timecreated,
            'timemodified' => $this->timemodified
        ];
    }
    
    /**
     * Obtiene un progreso por su ID
     *
     * @param int $id ID del progreso
     * @return user_progress|false Objeto progreso o false si no existe
     */
    public static function get_by_id($id) {
        global $DB;
        
        $data = $DB->get_record('neuroopositor_user_progress', ['id' => $id]);
        if ($data) {
            return new self($data);
        }
        
        return false;
    }
    
    /**
     * Obtiene el progreso de un usuario en un tema específico
     *
     * @param int $userid ID del usuario
     * @param int $tema_id ID del tema
     * @param int $courseid ID del curso
     * @return user_progress|false Objeto progreso o false si no existe
     */
    public static function get_user_tema_progress($userid, $tema_id, $courseid) {
        global $DB;
        
        $data = $DB->get_record('neuroopositor_user_progress', [
            'userid' => $userid,
            'tema_id' => $tema_id,
            'courseid' => $courseid
        ]);
        
        if ($data) {
            return new self($data);
        }
        
        return false;
    }
    
    /**
     * Obtiene o crea el progreso de un usuario en un tema específico
     *
     * @param int $userid ID del usuario
     * @param int $tema_id ID del tema
     * @param int $courseid ID del curso
     * @return user_progress Objeto progreso
     */
    public static function get_or_create($userid, $tema_id, $courseid = 0) {
        $progress = self::get_user_tema_progress($userid, $tema_id, $courseid);
        
        if (!$progress) {
            $progress = new self();
            $progress->userid = $userid;
            $progress->tema_id = $tema_id;
            $progress->courseid = $courseid;
            $progress->porcentaje_dominio = 0;
            $progress->preguntas_correctas = 0;
            $progress->preguntas_totales = 0;
            $progress->tiempo_estudio_segundos = 0;
            $progress->nivel_confianza = 0;
            $progress->ultima_actividad = time();
            $progress->timecreated = time();
            $progress->timemodified = time();
        }
        
        return $progress;
    }
    
    /**
     * Obtiene estadísticas del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return object Estadísticas del usuario
     */
    public static function get_user_statistics($userid, $courseid) {
        global $DB;
        
        $sql = "SELECT 
                    COUNT(*) as total_topics,
                    AVG(porcentaje_dominio) as average_mastery,
                    SUM(preguntas_correctas) as total_correct,
                    SUM(preguntas_totales) as total_questions,
                    SUM(tiempo_estudio_segundos) as total_study_time,
                    AVG(nivel_confianza) as average_confidence,
                    MAX(ultima_actividad) as last_activity
                FROM {neuroopositor_user_progress}
                WHERE userid = ? AND courseid = ?";
        
        $stats = $DB->get_record_sql($sql, [$userid, $courseid]);
        
        if (!$stats || $stats->total_topics == 0) {
            return (object) [
                'total_topics' => 0,
                'average_mastery' => 0,
                'total_correct' => 0,
                'total_questions' => 0,
                'total_study_time' => 0,
                'average_confidence' => 50,
                'last_activity' => 0,
                'accuracy_rate' => 0,
                'topics_mastered' => 0,
                'best_streak' => 0
            ];
        }
        
        $stats->accuracy_rate = $stats->total_questions > 0 ? 
            ($stats->total_correct / $stats->total_questions) * 100 : 0;
        
        // Contar temas dominados (>= 80% dominio)
        $mastered_sql = "SELECT COUNT(*) as mastered 
                        FROM {neuroopositor_user_progress} 
                        WHERE userid = ? AND courseid = ? AND porcentaje_dominio >= 80";
        $mastered = $DB->get_field_sql($mastered_sql, [$userid, $courseid]);
        $stats->topics_mastered = $mastered;
        
        // Calcular mejor racha (simplificado)
        $stats->best_streak = min($stats->total_correct, 10);
        
        return $stats;
    }
    
    /**
     * Obtiene todo el progreso de un usuario en un curso
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return array Array de objetos user_progress
     */
    public static function get_user_course_progress($userid, $courseid) {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_user_progress', [
            'userid' => $userid,
            'courseid' => $courseid
        ], 'tema_id ASC');
        
        $progress = [];
        foreach ($records as $record) {
            $progress[] = new self($record);
        }
        
        return $progress;
    }
    
    /**
     * Obtiene el progreso de todos los usuarios en un tema
     *
     * @param int $tema_id ID del tema
     * @param int $courseid ID del curso
     * @return array Array de objetos user_progress
     */
    public static function get_tema_progress($tema_id, $courseid) {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_user_progress', [
            'tema_id' => $tema_id,
            'courseid' => $courseid
        ], 'porcentaje_dominio DESC');
        
        $progress = [];
        foreach ($records as $record) {
            $progress[] = new self($record);
        }
        
        return $progress;
    }
    
    /**
     * Actualiza el progreso basado en una respuesta a una pregunta
     *
     * @param bool $correct Si la respuesta fue correcta
     * @param int $time_spent Tiempo empleado en segundos
     * @return bool True si se actualizó correctamente
     */
    public function update_from_question($correct, $time_spent = 0) {
        // Incrementar totales
        $this->preguntas_totales++;
        if ($correct) {
            $this->preguntas_correctas++;
        }
        
        // Actualizar tiempo de estudio
        $this->tiempo_estudio_segundos += $time_spent;
        
        // Calcular nuevo porcentaje de dominio
        $this->porcentaje_dominio = $this->preguntas_totales > 0 ? 
            ($this->preguntas_correctas / $this->preguntas_totales) * 100 : 0;
        
        // Calcular nivel de confianza basado en consistencia
        $this->nivel_confianza = $this->calculate_confidence_level();
        
        return $this->save();
    }
    
    /**
     * Calcula el nivel de confianza basado en el rendimiento
     *
     * @return float Nivel de confianza (0.0 - 1.0)
     */
    private function calculate_confidence_level() {
        if ($this->preguntas_totales < 5) {
            return 0.0; // Necesita más datos
        }
        
        $accuracy = $this->preguntas_totales > 0 ? 
            $this->preguntas_correctas / $this->preguntas_totales : 0;
        
        // Factor de cantidad de preguntas (más preguntas = más confianza)
        $quantity_factor = min(1.0, $this->preguntas_totales / 20);
        
        // Factor de precisión
        $accuracy_factor = $accuracy;
        
        // Combinar factores
        return ($quantity_factor * 0.3) + ($accuracy_factor * 0.7);
    }
    
    /**
     * Obtiene estadísticas generales del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return object Objeto con estadísticas
     */
    public static function get_user_stats($userid, $courseid) {
        global $DB;
        
        $sql = "
            SELECT 
                COUNT(*) as temas_estudiados,
                AVG(porcentaje_dominio) as promedio_dominio,
                SUM(preguntas_correctas) as total_correctas,
                SUM(preguntas_totales) as total_preguntas,
                SUM(tiempo_estudio_segundos) as tiempo_total,
                AVG(nivel_confianza) as confianza_promedio,
                COUNT(CASE WHEN porcentaje_dominio >= 80 THEN 1 END) as temas_dominados
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ?
        ";
        
        $stats = $DB->get_record_sql($sql, [$userid, $courseid]);
        
        if (!$stats) {
            $stats = new \stdClass();
            $stats->temas_estudiados = 0;
            $stats->promedio_dominio = 0;
            $stats->total_correctas = 0;
            $stats->total_preguntas = 0;
            $stats->tiempo_total = 0;
            $stats->confianza_promedio = 0;
            $stats->temas_dominados = 0;
        }
        
        // Calcular precisión general
        $stats->precision_general = $stats->total_preguntas > 0 ? 
            ($stats->total_correctas / $stats->total_preguntas) * 100 : 0;
        
        return $stats;
    }
    
    /**
     * Obtiene los temas más débiles del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $limit Número máximo de temas a devolver
     * @return array Array de objetos con tema_id y porcentaje_dominio
     */
    public static function get_weakest_topics($userid, $courseid, $limit = 5) {
        global $DB;
        
        $sql = "
            SELECT tema_id, porcentaje_dominio, preguntas_totales
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND preguntas_totales > 0
            ORDER BY porcentaje_dominio ASC, preguntas_totales DESC
            LIMIT ?
        ";
        
        return $DB->get_records_sql($sql, [$userid, $courseid, $limit]);
    }
    
    /**
     * Obtiene los temas más fuertes del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $limit Número máximo de temas a devolver
     * @return array Array de objetos con tema_id y porcentaje_dominio
     */
    public static function get_strongest_topics($userid, $courseid, $limit = 5) {
        global $DB;
        
        $sql = "
            SELECT tema_id, porcentaje_dominio, preguntas_totales
            FROM {neuroopositor_user_progress}
            WHERE userid = ? AND courseid = ? AND preguntas_totales > 0
            ORDER BY porcentaje_dominio DESC, preguntas_totales DESC
            LIMIT ?
        ";
        
        return $DB->get_records_sql($sql, [$userid, $courseid, $limit]);
    }
    
    /**
     * Obtiene el progreso reciente del usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param int $days Días hacia atrás
     * @return array Array de objetos user_progress
     */
    public static function get_recent_progress($userid, $courseid, $days = 7) {
        global $DB;
        
        $since = time() - ($days * 24 * 60 * 60);
        
        $records = $DB->get_records_select(
            'neuroopositor_user_progress',
            'userid = ? AND courseid = ? AND ultima_actividad >= ?',
            [$userid, $courseid, $since],
            'ultima_actividad DESC'
        );
        
        $progress = [];
        foreach ($records as $record) {
            $progress[] = new self($record);
        }
        
        return $progress;
    }
    
    /**
     * Resetea el progreso de un usuario en un tema
     *
     * @param int $userid ID del usuario
     * @param int $tema_id ID del tema
     * @param int $courseid ID del curso
     * @return bool True si se reseteó correctamente
     */
    public static function reset_progress($userid, $tema_id, $courseid) {
        global $DB;
        
        return $DB->delete_records('neuroopositor_user_progress', [
            'userid' => $userid,
            'tema_id' => $tema_id,
            'courseid' => $courseid
        ]);
    }
    
    /**
     * Obtiene el ranking de usuarios por progreso
     *
     * @param int $courseid ID del curso
     * @param int $limit Número máximo de usuarios
     * @return array Array con ranking de usuarios
     */
    public static function get_user_ranking($courseid, $limit = 10) {
        global $DB;
        
        $sql = "
            SELECT 
                u.id as userid,
                u.firstname,
                u.lastname,
                AVG(up.porcentaje_dominio) as promedio_dominio,
                SUM(up.preguntas_correctas) as total_correctas,
                SUM(up.preguntas_totales) as total_preguntas,
                COUNT(up.tema_id) as temas_estudiados
            FROM {user} u
            JOIN {neuroopositor_user_progress} up ON u.id = up.userid
            WHERE up.courseid = ?
            GROUP BY u.id, u.firstname, u.lastname
            ORDER BY promedio_dominio DESC, total_correctas DESC
            LIMIT ?
        ";
        
        return $DB->get_records_sql($sql, [$courseid, $limit]);
    }
}