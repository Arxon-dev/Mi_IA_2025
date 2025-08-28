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
 * Clase para manejo de rutas neurales en NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/dml/moodle_database.php');

/**
 * Clase para gestionar las rutas neurales de aprendizaje
 */
class neural_path {
    
    /** @var int ID de la ruta neural */
    public $id;
    
    /** @var int ID del usuario */
    public $userid;
    
    /** @var int ID del curso */
    public $courseid;
    
    /** @var string Datos de la ruta en formato JSON */
    public $path_data;
    
    /** @var string Tipo de ruta */
    public $tipo_ruta;
    
    /** @var bool Si la ruta está activa */
    public $activa;
    
    /** @var float Progreso en la ruta (0.0 - 100.0) */
    public $progreso;
    
    /** @var int Timestamp de creación */
    public $timecreated;
    
    /** @var int Timestamp de modificación */
    public $timemodified;
    
    // Tipos de ruta disponibles
    const TIPO_OPTIMA = 'optima';
    const TIPO_REFUERZO = 'refuerzo';
    const TIPO_EXPLORACION = 'exploracion';
    
    /**
     * Constructor
     *
     * @param object|null $data Datos de la ruta neural
     */
    public function __construct($data = null) {
        if ($data) {
            $this->load_from_data($data);
        }
    }
    
    /**
     * Carga datos desde un objeto
     *
     * @param object $data Datos de la ruta neural
     */
    private function load_from_data($data) {
        $this->id = isset($data->id) ? $data->id : null;
        $this->userid = $data->userid;
        $this->courseid = $data->courseid;
        $this->path_data = $data->path_data;
        $this->tipo_ruta = $data->tipo_ruta;
        $this->activa = isset($data->activa) ? (bool) $data->activa : true;
        $this->progreso = isset($data->progreso) ? (float) $data->progreso : 0.0;
        $this->timecreated = isset($data->timecreated) ? $data->timecreated : time();
        $this->timemodified = isset($data->timemodified) ? $data->timemodified : time();
    }
    
    /**
     * Guarda la ruta neural en la base de datos
     *
     * @return bool|int ID de la ruta guardada o false si falla
     */
    public function save() {
        global $DB;
        
        $data = $this->to_object();
        $data->timemodified = time();
        
        if ($this->id) {
            // Actualizar ruta existente
            $data->id = $this->id;
            $result = $DB->update_record('neuroopositor_neural_paths', $data);
            return $result ? $this->id : false;
        } else {
            // Crear nueva ruta
            $data->timecreated = time();
            $this->id = $DB->insert_record('neuroopositor_neural_paths', $data);
            return $this->id;
        }
    }
    
    /**
     * Elimina la ruta neural de la base de datos
     *
     * @return bool True si se eliminó correctamente
     */
    public function delete() {
        global $DB;
        
        if (!$this->id) {
            return false;
        }
        
        return $DB->delete_records('neuroopositor_neural_paths', ['id' => $this->id]);
    }
    
    /**
     * Convierte el objeto a un objeto estándar para la BD
     *
     * @return object Objeto con los datos de la ruta neural
     */
    public function to_object() {
        $obj = new \stdClass();
        $obj->userid = $this->userid;
        $obj->courseid = $this->courseid;
        $obj->path_data = $this->path_data;
        $obj->tipo_ruta = $this->tipo_ruta;
        $obj->activa = $this->activa ? 1 : 0;
        $obj->progreso = $this->progreso;
        $obj->timecreated = $this->timecreated;
        $obj->timemodified = $this->timemodified;
        
        return $obj;
    }
    
    /**
     * Obtiene una ruta neural por su ID
     *
     * @param int $id ID de la ruta neural
     * @return neural_path|false Objeto ruta neural o false si no existe
     */
    public static function get_by_id($id) {
        global $DB;
        
        $data = $DB->get_record('neuroopositor_neural_paths', ['id' => $id]);
        if ($data) {
            return new self($data);
        }
        
        return false;
    }
    
    /**
     * Obtiene las rutas neurales de un usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param string|null $tipo Tipo de ruta específico
     * @param bool $only_active Solo rutas activas
     * @return array Array de objetos neural_path
     */
    public static function get_user_paths($userid, $courseid, $tipo = null, $only_active = true) {
        global $DB;
        
        $conditions = [
            'userid' => $userid,
            'courseid' => $courseid
        ];
        
        if ($tipo) {
            $conditions['tipo_ruta'] = $tipo;
        }
        
        if ($only_active) {
            $conditions['activa'] = 1;
        }
        
        $records = $DB->get_records('neuroopositor_neural_paths', $conditions, 'timemodified DESC');
        $paths = [];
        
        foreach ($records as $record) {
            $paths[] = new self($record);
        }
        
        return $paths;
    }
    
    /**
     * Obtiene la ruta activa de un usuario por tipo
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param string $tipo Tipo de ruta
     * @return neural_path|false Objeto ruta neural o false si no existe
     */
    public static function get_active_path($userid, $courseid, $tipo) {
        global $DB;
        
        $data = $DB->get_record('neuroopositor_neural_paths', [
            'userid' => $userid,
            'courseid' => $courseid,
            'tipo_ruta' => $tipo,
            'activa' => 1
        ]);
        
        if ($data) {
            return new self($data);
        }
        
        return false;
    }
    
    /**
     * Genera una ruta neural óptima para el usuario
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return neural_path|false Ruta neural generada o false si falla
     */
    public static function generate_optimal_path($userid, $courseid) {
        // Obtener progreso del usuario
        $user_progress = user_progress::get_user_course_progress($userid, $courseid);
        
        // Obtener todos los temas
        $temas = tema::get_all();
        
        // Crear mapa de progreso por tema
        $progress_map = [];
        foreach ($user_progress as $progress) {
            $progress_map[$progress->tema_id] = $progress->porcentaje_dominio;
        }
        
        // Ordenar temas por dificultad y progreso actual
        $path_temas = [];
        foreach ($temas as $tema) {
            $current_progress = isset($progress_map[$tema->id]) ? $progress_map[$tema->id] : 0;
            
            $path_temas[] = [
                'tema_id' => $tema->id,
                'titulo' => $tema->titulo,
                'bloque' => $tema->bloque,
                'numero' => $tema->numero,
                'dificultad' => $tema->nivel_dificultad,
                'progreso_actual' => $current_progress,
                'prioridad' => self::calculate_priority($tema, $current_progress)
            ];
        }
        
        // Ordenar por prioridad
        usort($path_temas, function($a, $b) {
            return $b['prioridad'] <=> $a['prioridad'];
        });
        
        // Crear datos de la ruta
        $path_data = [
            'temas' => $path_temas,
            'estrategia' => 'optima',
            'descripcion' => 'Ruta optimizada basada en progreso actual y dificultad',
            'generada' => time()
        ];
        
        // Crear y guardar la ruta
        $neural_path = new self();
        $neural_path->userid = $userid;
        $neural_path->courseid = $courseid;
        $neural_path->path_data = json_encode($path_data);
        $neural_path->tipo_ruta = self::TIPO_OPTIMA;
        $neural_path->activa = true;
        $neural_path->progreso = 0.0;
        
        // Desactivar rutas óptimas anteriores
        self::deactivate_user_paths($userid, $courseid, self::TIPO_OPTIMA);
        
        if ($neural_path->save()) {
            return $neural_path;
        }
        
        return false;
    }
    
    /**
     * Genera una ruta de refuerzo para temas débiles
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return neural_path|false Ruta neural generada o false si falla
     */
    public static function generate_reinforcement_path($userid, $courseid) {
        // Obtener temas más débiles
        $weak_topics = user_progress::get_weakest_topics($userid, $courseid, 10);
        
        if (empty($weak_topics)) {
            return false; // No hay datos suficientes
        }
        
        $path_temas = [];
        foreach ($weak_topics as $topic) {
            $tema = tema::get_by_id($topic->tema_id);
            if ($tema) {
                $path_temas[] = [
                    'tema_id' => $tema->id,
                    'titulo' => $tema->titulo,
                    'bloque' => $tema->bloque,
                    'numero' => $tema->numero,
                    'progreso_actual' => $topic->porcentaje_dominio,
                    'necesidad_refuerzo' => 100 - $topic->porcentaje_dominio
                ];
            }
        }
        
        $path_data = [
            'temas' => $path_temas,
            'estrategia' => 'refuerzo',
            'descripcion' => 'Ruta de refuerzo para temas con menor dominio',
            'generada' => time()
        ];
        
        $neural_path = new self();
        $neural_path->userid = $userid;
        $neural_path->courseid = $courseid;
        $neural_path->path_data = json_encode($path_data);
        $neural_path->tipo_ruta = self::TIPO_REFUERZO;
        $neural_path->activa = true;
        $neural_path->progreso = 0.0;
        
        // Desactivar rutas de refuerzo anteriores
        self::deactivate_user_paths($userid, $courseid, self::TIPO_REFUERZO);
        
        if ($neural_path->save()) {
            return $neural_path;
        }
        
        return false;
    }
    
    /**
     * Genera una ruta de exploración para temas no estudiados
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return neural_path|false Ruta neural generada o false si falla
     */
    public static function generate_exploration_path($userid, $courseid) {
        // Obtener progreso del usuario
        $user_progress = user_progress::get_user_course_progress($userid, $courseid);
        
        // Crear mapa de temas estudiados
        $studied_topics = [];
        foreach ($user_progress as $progress) {
            if ($progress->preguntas_totales > 0) {
                $studied_topics[] = $progress->tema_id;
            }
        }
        
        // Obtener todos los temas
        $all_temas = tema::get_all();
        
        // Filtrar temas no estudiados
        $unexplored_temas = [];
        foreach ($all_temas as $tema) {
            if (!in_array($tema->id, $studied_topics)) {
                $unexplored_temas[] = [
                    'tema_id' => $tema->id,
                    'titulo' => $tema->titulo,
                    'bloque' => $tema->bloque,
                    'numero' => $tema->numero,
                    'dificultad' => $tema->nivel_dificultad,
                    'conexiones' => count($tema->get_connections())
                ];
            }
        }
        
        if (empty($unexplored_temas)) {
            return false; // Todos los temas han sido explorados
        }
        
        // Ordenar por dificultad y número de conexiones
        usort($unexplored_temas, function($a, $b) {
            if ($a['dificultad'] === $b['dificultad']) {
                return $b['conexiones'] <=> $a['conexiones'];
            }
            return $a['dificultad'] <=> $b['dificultad'];
        });
        
        $path_data = [
            'temas' => $unexplored_temas,
            'estrategia' => 'exploracion',
            'descripcion' => 'Ruta de exploración para temas no estudiados',
            'generada' => time()
        ];
        
        $neural_path = new self();
        $neural_path->userid = $userid;
        $neural_path->courseid = $courseid;
        $neural_path->path_data = json_encode($path_data);
        $neural_path->tipo_ruta = self::TIPO_EXPLORACION;
        $neural_path->activa = true;
        $neural_path->progreso = 0.0;
        
        // Desactivar rutas de exploración anteriores
        self::deactivate_user_paths($userid, $courseid, self::TIPO_EXPLORACION);
        
        if ($neural_path->save()) {
            return $neural_path;
        }
        
        return false;
    }
    
    /**
     * Calcula la prioridad de un tema para la ruta óptima
     *
     * @param tema $tema Objeto tema
     * @param float $current_progress Progreso actual
     * @return float Prioridad calculada
     */
    private static function calculate_priority($tema, $current_progress) {
        // Factor de progreso (menos progreso = mayor prioridad)
        $progress_factor = (100 - $current_progress) / 100;
        
        // Factor de dificultad (menor dificultad = mayor prioridad inicial)
        $difficulty_factor = (6 - $tema->nivel_dificultad) / 5;
        
        // Factor de bloque (bloques anteriores tienen mayor prioridad)
        $block_factor = (4 - $tema->bloque) / 3;
        
        // Combinar factores
        return ($progress_factor * 0.5) + ($difficulty_factor * 0.3) + ($block_factor * 0.2);
    }
    
    /**
     * Desactiva rutas de un usuario por tipo
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @param string $tipo Tipo de ruta
     * @return bool True si se desactivaron correctamente
     */
    private static function deactivate_user_paths($userid, $courseid, $tipo) {
        global $DB;
        
        return $DB->set_field('neuroopositor_neural_paths', 'activa', 0, [
            'userid' => $userid,
            'courseid' => $courseid,
            'tipo_ruta' => $tipo
        ]);
    }
    
    /**
     * Actualiza el progreso de la ruta
     *
     * @param int $tema_completado_id ID del tema completado
     * @return bool True si se actualizó correctamente
     */
    public function update_progress($tema_completado_id) {
        $path_data = json_decode($this->path_data, true);
        
        if (!$path_data || !isset($path_data['temas'])) {
            return false;
        }
        
        $total_temas = count($path_data['temas']);
        $completed_count = 0;
        
        // Marcar tema como completado y contar completados
        foreach ($path_data['temas'] as &$tema) {
            if ($tema['tema_id'] == $tema_completado_id) {
                $tema['completado'] = true;
                $tema['fecha_completado'] = time();
            }
            
            if (isset($tema['completado']) && $tema['completado']) {
                $completed_count++;
            }
        }
        
        // Calcular nuevo progreso
        $this->progreso = $total_temas > 0 ? ($completed_count / $total_temas) * 100 : 0;
        $this->path_data = json_encode($path_data);
        
        return $this->save();
    }
    
    /**
     * Obtiene los datos de la ruta decodificados
     *
     * @return array|false Array con los datos o false si falla
     */
    public function get_path_data() {
        return json_decode($this->path_data, true);
    }
    
    /**
     * Obtiene el siguiente tema recomendado en la ruta
     *
     * @return array|false Datos del siguiente tema o false si no hay
     */
    public function get_next_topic() {
        $path_data = $this->get_path_data();
        
        if (!$path_data || !isset($path_data['temas'])) {
            return false;
        }
        
        foreach ($path_data['temas'] as $tema) {
            if (!isset($tema['completado']) || !$tema['completado']) {
                return $tema;
            }
        }
        
        return false; // Todos los temas completados
    }
    
    /**
     * Obtiene los tipos de ruta disponibles
     *
     * @return array Array con los tipos de ruta
     */
    public static function get_path_types() {
        return [
            self::TIPO_OPTIMA => get_string('path_type_optima', 'local_neuroopositor'),
            self::TIPO_REFUERZO => get_string('path_type_refuerzo', 'local_neuroopositor'),
            self::TIPO_EXPLORACION => get_string('path_type_exploracion', 'local_neuroopositor')
        ];
    }
}