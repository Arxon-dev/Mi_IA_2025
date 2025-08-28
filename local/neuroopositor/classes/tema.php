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
 * Clase para manejo de temas en NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/dml/moodle_database.php');

/**
 * Clase para gestionar los temas del sistema neural
 */
class tema {
    
    /** @var int ID del tema */
    public $id;
    
    /** @var int Bloque al que pertenece (1, 2, 3) */
    public $bloque;
    
    /** @var int Número del tema dentro del bloque */
    public $numero;
    
    /** @var string Título del tema */
    public $titulo;
    
    /** @var string Descripción del tema */
    public $descripcion;
    
    /** @var int Nivel de dificultad (1-5) */
    public $nivel_dificultad;
    
    /** @var float Posición X en el mapa neural */
    public $posicion_x;
    
    /** @var float Posición Y en el mapa neural */
    public $posicion_y;
    
    /** @var float Posición Z en el mapa neural */
    public $posicion_z;
    
    /** @var string Color del nodo en formato hex */
    public $color;
    
    /** @var int Timestamp de creación */
    public $timecreated;
    
    /** @var int Timestamp de modificación */
    public $timemodified;
    
    /**
     * Constructor
     *
     * @param object|null $data Datos del tema
     */
    public function __construct($data = null) {
        if ($data) {
            $this->load_from_data($data);
        }
    }
    
    /**
     * Carga datos desde un objeto
     *
     * @param object $data Datos del tema
     */
    private function load_from_data($data) {
        $this->id = isset($data->id) ? $data->id : null;
        $this->bloque = $data->bloque;
        $this->numero = $data->numero;
        $this->titulo = $data->titulo;
        $this->descripcion = isset($data->descripcion) ? $data->descripcion : '';
        $this->nivel_dificultad = isset($data->nivel_dificultad) ? $data->nivel_dificultad : 1;
        $this->posicion_x = isset($data->posicion_x) ? $data->posicion_x : 0;
        $this->posicion_y = isset($data->posicion_y) ? $data->posicion_y : 0;
        $this->posicion_z = isset($data->posicion_z) ? $data->posicion_z : 0;
        $this->color = isset($data->color) ? $data->color : '#3498db';
        $this->timecreated = isset($data->timecreated) ? $data->timecreated : time();
        $this->timemodified = isset($data->timemodified) ? $data->timemodified : time();
    }
    
    /**
     * Guarda el tema en la base de datos
     *
     * @return bool|int ID del tema guardado o false si falla
     */
    public function save() {
        global $DB;
        
        $data = $this->to_object();
        $data->timemodified = time();
        
        if ($this->id) {
            // Actualizar tema existente
            $data->id = $this->id;
            $result = $DB->update_record('neuroopositor_temas', $data);
            return $result ? $this->id : false;
        } else {
            // Crear nuevo tema
            $data->timecreated = time();
            $this->id = $DB->insert_record('neuroopositor_temas', $data);
            return $this->id;
        }
    }
    
    /**
     * Elimina el tema de la base de datos
     *
     * @return bool True si se eliminó correctamente
     */
    public function delete() {
        global $DB;
        
        if (!$this->id) {
            return false;
        }
        
        // Eliminar conexiones relacionadas
        $DB->delete_records('neuroopositor_connections', ['tema_origen_id' => $this->id]);
        $DB->delete_records('neuroopositor_connections', ['tema_destino_id' => $this->id]);
        
        // Eliminar progreso de usuarios
        $DB->delete_records('neuroopositor_user_progress', ['tema_id' => $this->id]);
        
        // Eliminar el tema
        return $DB->delete_records('neuroopositor_temas', ['id' => $this->id]);
    }
    
    /**
     * Convierte el objeto a un objeto estándar para la BD
     *
     * @return object Objeto con los datos del tema
     */
    public function to_object() {
        $obj = new \stdClass();
        $obj->bloque = $this->bloque;
        $obj->numero = $this->numero;
        $obj->titulo = $this->titulo;
        $obj->descripcion = $this->descripcion;
        $obj->nivel_dificultad = $this->nivel_dificultad;
        $obj->posicion_x = $this->posicion_x;
        $obj->posicion_y = $this->posicion_y;
        $obj->posicion_z = $this->posicion_z;
        $obj->color = $this->color;
        $obj->timecreated = $this->timecreated;
        $obj->timemodified = $this->timemodified;
        
        return $obj;
    }
    
    /**
     * Obtiene el ID del tema
     *
     * @return int|null ID del tema
     */
    public function get_id() {
        return $this->id;
    }
    
    /**
     * Obtiene el bloque del tema
     *
     * @return int Bloque del tema
     */
    public function get_bloque() {
        return $this->bloque;
    }
    
    /**
     * Obtiene el número del tema
     *
     * @return int Número del tema
     */
    public function get_numero() {
        return $this->numero;
    }
    
    /**
     * Obtiene el título del tema
     *
     * @return string Título del tema
     */
    public function get_titulo() {
        return $this->titulo;
    }
    
    /**
     * Obtiene la descripción del tema
     *
     * @return string Descripción del tema
     */
    public function get_descripcion() {
        return $this->descripcion;
    }
    
    /**
     * Obtiene el nivel de dificultad del tema
     *
     * @return int Nivel de dificultad (1-5)
     */
    public function get_nivel_dificultad() {
        return $this->nivel_dificultad;
    }
    
    /**
     * Obtiene la posición X del tema
     *
     * @return float Posición X
     */
    public function get_posicion_x() {
        return $this->posicion_x;
    }
    
    /**
     * Obtiene la posición Y del tema
     *
     * @return float Posición Y
     */
    public function get_posicion_y() {
        return $this->posicion_y;
    }
    
    /**
     * Obtiene la posición Z del tema
     *
     * @return float Posición Z
     */
    public function get_posicion_z() {
        return $this->posicion_z;
    }
    
    /**
     * Obtiene el color del tema
     *
     * @return string Color en formato hexadecimal
     */
    public function get_color() {
        return $this->color;
    }
    
    /**
     * Obtiene un tema por su ID
     *
     * @param int $id ID del tema
     * @return tema|false Objeto tema o false si no existe
     */
    public static function get_by_id($id) {
        global $DB;
        
        $data = $DB->get_record('neuroopositor_temas', ['id' => $id]);
        if ($data) {
            return new self($data);
        }
        
        return false;
    }
    
    /**
     * Obtiene todos los temas de un bloque
     *
     * @param int $bloque Número del bloque (1, 2, 3)
     * @return array Array de objetos tema
     */
    public static function get_by_bloque($bloque) {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_temas', ['bloque' => $bloque], 'numero ASC');
        $temas = [];
        
        foreach ($records as $record) {
            $temas[] = new self($record);
        }
        
        return $temas;
    }
    
    /**
     * Obtiene todos los temas
     *
     * @return array Array de objetos tema
     */
    public static function get_all() {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_temas', null, 'bloque ASC, numero ASC');
        $temas = [];
        
        foreach ($records as $record) {
            $temas[] = new self($record);
        }
        
        return $temas;
    }
    
    /**
     * Obtiene el progreso del usuario en este tema
     *
     * @param int $userid ID del usuario
     * @param int $courseid ID del curso
     * @return object|false Objeto con el progreso o false si no existe
     */
    public function get_user_progress($userid, $courseid) {
        global $DB;
        
        return $DB->get_record('neuroopositor_user_progress', [
            'userid' => $userid,
            'tema_id' => $this->id,
            'courseid' => $courseid
        ]);
    }
    
    /**
     * Obtiene las conexiones de este tema
     *
     * @param string $direction 'out' para salientes, 'in' para entrantes, 'both' para ambas
     * @return array Array de conexiones
     */
    public function get_connections($direction = 'both') {
        global $DB;
        
        $connections = [];
        
        if ($direction === 'out' || $direction === 'both') {
            $out = $DB->get_records('neuroopositor_connections', ['tema_origen_id' => $this->id, 'activa' => 1]);
            $connections = array_merge($connections, array_values($out));
        }
        
        if ($direction === 'in' || $direction === 'both') {
            $in = $DB->get_records('neuroopositor_connections', ['tema_destino_id' => $this->id, 'activa' => 1]);
            $connections = array_merge($connections, array_values($in));
        }
        
        return $connections;
    }
    
    /**
     * Calcula la fuerza de conexión con otro tema
     *
     * @param int $tema_destino_id ID del tema destino
     * @return float Fuerza de la conexión (0.0 - 1.0)
     */
    public function calculate_connection_strength($tema_destino_id) {
        global $DB;
        
        $connection = $DB->get_record('neuroopositor_connections', [
            'tema_origen_id' => $this->id,
            'tema_destino_id' => $tema_destino_id,
            'activa' => 1
        ]);
        
        if ($connection) {
            return (float) $connection->peso;
        }
        
        // Verificar conexión inversa
        $connection = $DB->get_record('neuroopositor_connections', [
            'tema_origen_id' => $tema_destino_id,
            'tema_destino_id' => $this->id,
            'activa' => 1
        ]);
        
        if ($connection) {
            return (float) $connection->peso;
        }
        
        return 0.0;
    }
    
    /**
     * Obtiene el nombre de la tabla de preguntas asociada
     *
     * @return string|false Nombre de la tabla o false si no existe
     */
    public function get_questions_table() {
        // Mapeo de temas a tablas de preguntas existentes
        $mapping = [
            // Bloque I
            '1.1' => 'constitucion',
            '1.2' => 'defensanacional', 
            '1.3' => 'rio',
            '1.4' => 'minisdef',
            '1.5' => 'organizacionfas',
            '1.6.1' => 'emad',
            '1.6.2' => 'et',
            '1.6.3' => 'armada',
            '1.6.4' => 'aire',
            '1.6.5' => 'carrera',
            // Bloque II
            '2.1' => 'tropa',
            '2.2' => 'rroo',
            '2.3' => 'derechosydeberes',
            '2.4' => 'regimendisciplinario',
            '2.5' => 'iniciativasyquejas',
            '2.6' => 'igualdad',
            '2.7' => 'omi',
            '2.8' => 'pac',
            // Bloque III
            '3.1' => 'seguridadnacional',
            '3.2' => 'pdc',
            '3.3' => 'onu',
            '3.4' => 'otan',
            '3.5' => 'osce',
            '3.6' => 'ue',
            '3.7' => 'misionesinternacionales'
        ];
        
        $key = $this->bloque . '.' . $this->numero;
        return isset($mapping[$key]) ? $mapping[$key] : false;
    }
}