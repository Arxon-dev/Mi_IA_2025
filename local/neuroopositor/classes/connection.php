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
 * Clase para manejo de conexiones neurales en NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/dml/moodle_database.php');

/**
 * Clase para gestionar las conexiones neurales entre temas
 */
class connection {
    
    /** @var int ID de la conexión */
    public $id;
    
    /** @var int ID del tema origen */
    public $tema_origen_id;
    
    /** @var int ID del tema destino */
    public $tema_destino_id;
    
    /** @var string Tipo de conexión */
    public $tipo_conexion;
    
    /** @var float Peso de la conexión (0.0 - 1.0) */
    public $peso;
    
    /** @var string Descripción de la conexión */
    public $descripcion;
    
    /** @var bool Si la conexión está activa */
    public $activa;
    
    /** @var int Timestamp de creación */
    public $timecreated;
    
    /** @var int Timestamp de modificación */
    public $timemodified;
    
    // Tipos de conexión disponibles
    const TIPO_DIRECTA = 'directa';
    const TIPO_CONCEPTUAL = 'conceptual';
    const TIPO_PRACTICA = 'practica';
    const TIPO_TEMPORAL = 'temporal';
    
    /**
     * Constructor
     *
     * @param object|null $data Datos de la conexión
     */
    public function __construct($data = null) {
        if ($data) {
            $this->load_from_data($data);
        }
    }
    
    /**
     * Obtiene el ID del tema origen
     *
     * @return int ID del tema origen
     */
    public function get_tema_origen_id() {
        return $this->tema_origen_id;
    }
    
    /**
     * Obtiene el ID del tema destino
     *
     * @return int ID del tema destino
     */
    public function get_tema_destino_id() {
        return $this->tema_destino_id;
    }
    
    /**
     * Obtiene el tipo de conexión
     *
     * @return string Tipo de conexión
     */
    public function get_tipo_conexion() {
        return $this->tipo_conexion;
    }
    
    /**
     * Obtiene el peso de la conexión
     *
     * @return float Peso de la conexión
     */
    public function get_peso() {
        return $this->peso;
    }
    
    /**
     * Obtiene la descripción de la conexión
     *
     * @return string Descripción de la conexión
     */
    public function get_descripcion() {
        return $this->descripcion;
    }
    
    /**
     * Obtiene el ID de la conexión
     *
     * @return int ID de la conexión
     */
    public function get_id() {
        return $this->id;
    }
    
    /**
     * Verifica si la conexión está activa
     *
     * @return bool True si está activa
     */
    public function is_activa() {
        return (bool)$this->activa;
    }
    
    /**
     * Obtiene todas las conexiones de un curso
     *
     * @param int $courseid ID del curso
     * @return array Array de objetos conexión
     */
    public static function get_all_by_course($courseid) {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_connections', ['activa' => 1]);
        $connections = [];
        
        foreach ($records as $record) {
            $connections[] = new self($record);
        }
        
        return $connections;
    }
    
    /**
     * Carga datos desde un objeto
     *
     * @param object $data Datos de la conexión
     */
    private function load_from_data($data) {
        $this->id = isset($data->id) ? $data->id : null;
        $this->tema_origen_id = $data->tema_origen_id;
        $this->tema_destino_id = $data->tema_destino_id;
        $this->tipo_conexion = $data->tipo_conexion;
        $this->peso = isset($data->peso) ? (float) $data->peso : 1.0;
        $this->descripcion = isset($data->descripcion) ? $data->descripcion : '';
        $this->activa = isset($data->activa) ? (bool) $data->activa : true;
        $this->timecreated = isset($data->timecreated) ? $data->timecreated : time();
        $this->timemodified = isset($data->timemodified) ? $data->timemodified : time();
    }
    
    /**
     * Guarda la conexión en la base de datos
     *
     * @return bool|int ID de la conexión guardada o false si falla
     */
    public function save() {
        global $DB;
        
        // Validar que no sea una auto-conexión
        if ($this->tema_origen_id === $this->tema_destino_id) {
            return false;
        }
        
        $data = $this->to_object();
        $data->timemodified = time();
        
        if ($this->id) {
            // Actualizar conexión existente
            $data->id = $this->id;
            $result = $DB->update_record('neuroopositor_connections', $data);
            return $result ? $this->id : false;
        } else {
            // Verificar que no exista ya una conexión entre estos temas
            $existing = $DB->get_record('neuroopositor_connections', [
                'tema_origen_id' => $this->tema_origen_id,
                'tema_destino_id' => $this->tema_destino_id
            ]);
            
            if ($existing) {
                return false; // Ya existe la conexión
            }
            
            // Crear nueva conexión
            $data->timecreated = time();
            $this->id = $DB->insert_record('neuroopositor_connections', $data);
            return $this->id;
        }
    }
    
    /**
     * Elimina la conexión de la base de datos
     *
     * @return bool True si se eliminó correctamente
     */
    public function delete() {
        global $DB;
        
        if (!$this->id) {
            return false;
        }
        
        return $DB->delete_records('neuroopositor_connections', ['id' => $this->id]);
    }
    
    /**
     * Convierte el objeto a un objeto estándar para la BD
     *
     * @return object Objeto con los datos de la conexión
     */
    public function to_object() {
        $obj = new \stdClass();
        $obj->tema_origen_id = $this->tema_origen_id;
        $obj->tema_destino_id = $this->tema_destino_id;
        $obj->tipo_conexion = $this->tipo_conexion;
        $obj->peso = $this->peso;
        $obj->descripcion = $this->descripcion;
        $obj->activa = $this->activa ? 1 : 0;
        $obj->timecreated = $this->timecreated;
        $obj->timemodified = $this->timemodified;
        
        return $obj;
    }
    
    /**
     * Obtiene una conexión por su ID
     *
     * @param int $id ID de la conexión
     * @return connection|false Objeto conexión o false si no existe
     */
    public static function get_by_id($id) {
        global $DB;
        
        $data = $DB->get_record('neuroopositor_connections', ['id' => $id]);
        if ($data) {
            return new self($data);
        }
        
        return false;
    }
    
    /**
     * Obtiene conexiones entre dos temas específicos
     *
     * @param int $tema_origen_id ID del tema origen
     * @param int $tema_destino_id ID del tema destino
     * @param bool $bidirectional Si buscar en ambas direcciones
     * @return array Array de objetos conexión
     */
    public static function get_between_temas($tema_origen_id, $tema_destino_id, $bidirectional = true) {
        global $DB;
        
        $connections = [];
        
        // Conexión directa
        $direct = $DB->get_records('neuroopositor_connections', [
            'tema_origen_id' => $tema_origen_id,
            'tema_destino_id' => $tema_destino_id,
            'activa' => 1
        ]);
        
        foreach ($direct as $conn) {
            $connections[] = new self($conn);
        }
        
        // Conexión inversa si es bidireccional
        if ($bidirectional) {
            $inverse = $DB->get_records('neuroopositor_connections', [
                'tema_origen_id' => $tema_destino_id,
                'tema_destino_id' => $tema_origen_id,
                'activa' => 1
            ]);
            
            foreach ($inverse as $conn) {
                $connections[] = new self($conn);
            }
        }
        
        return $connections;
    }
    
    /**
     * Obtiene todas las conexiones de un tema
     *
     * @param int $tema_id ID del tema
     * @param string $direction 'out' para salientes, 'in' para entrantes, 'both' para ambas
     * @return array Array de objetos conexión
     */
    public static function get_by_tema($tema_id, $direction = 'both') {
        global $DB;
        
        $connections = [];
        
        if ($direction === 'out' || $direction === 'both') {
            $out = $DB->get_records('neuroopositor_connections', [
                'tema_origen_id' => $tema_id,
                'activa' => 1
            ]);
            
            foreach ($out as $conn) {
                $connections[] = new self($conn);
            }
        }
        
        if ($direction === 'in' || $direction === 'both') {
            $in = $DB->get_records('neuroopositor_connections', [
                'tema_destino_id' => $tema_id,
                'activa' => 1
            ]);
            
            foreach ($in as $conn) {
                $connections[] = new self($conn);
            }
        }
        
        return $connections;
    }
    
    /**
     * Obtiene conexiones por tipo
     *
     * @param string $tipo Tipo de conexión
     * @return array Array de objetos conexión
     */
    public static function get_by_tipo($tipo) {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_connections', [
            'tipo_conexion' => $tipo,
            'activa' => 1
        ]);
        
        $connections = [];
        foreach ($records as $record) {
            $connections[] = new self($record);
        }
        
        return $connections;
    }
    
    /**
     * Obtiene todas las conexiones activas
     *
     * @return array Array de objetos conexión
     */
    public static function get_all_active() {
        global $DB;
        
        $records = $DB->get_records('neuroopositor_connections', ['activa' => 1]);
        $connections = [];
        
        foreach ($records as $record) {
            $connections[] = new self($record);
        }
        
        return $connections;
    }
    
    /**
     * Crea conexiones predefinidas del sistema
     *
     * @return bool True si se crearon correctamente
     */
    public static function create_default_connections() {
        global $DB;
        
        // Verificar si ya existen conexiones
        $existing = $DB->count_records('neuroopositor_connections');
        if ($existing > 0) {
            return true; // Ya existen conexiones
        }
        
        $connections_data = [
            // Conexiones Directas (Mismo Marco Legal)
            ['origen' => 1, 'destino' => 2, 'tipo' => self::TIPO_DIRECTA, 'peso' => 0.9, 'desc' => 'Constitución y Defensa Nacional están directamente relacionadas'],
            ['origen' => 3, 'destino' => 8, 'tipo' => self::TIPO_DIRECTA, 'peso' => 0.8, 'desc' => 'Régimen Jurídico y Procedimiento Administrativo comparten marco legal'],
            ['origen' => 11, 'destino' => 12, 'tipo' => self::TIPO_DIRECTA, 'peso' => 0.9, 'desc' => 'Derechos y Deberes con Régimen Disciplinario'],
            ['origen' => 4, 'destino' => 5, 'tipo' => self::TIPO_DIRECTA, 'peso' => 0.8, 'desc' => 'Ministerio Defensa y Organización FFAA'],
            
            // Conexiones Conceptuales (Misma Área)
            ['origen' => 9, 'destino' => 10, 'tipo' => self::TIPO_CONCEPTUAL, 'peso' => 0.7, 'desc' => 'Tropa y Marinería con Reales Ordenanzas'],
            ['origen' => 14, 'destino' => 15, 'tipo' => self::TIPO_CONCEPTUAL, 'peso' => 0.8, 'desc' => 'Igualdad Efectiva y Observatorio Igualdad'],
            ['origen' => 17, 'destino' => 18, 'tipo' => self::TIPO_CONCEPTUAL, 'peso' => 0.7, 'desc' => 'ONU y OTAN - Organizaciones Internacionales'],
            ['origen' => 18, 'destino' => 19, 'tipo' => self::TIPO_CONCEPTUAL, 'peso' => 0.6, 'desc' => 'OTAN y OSCE - Organizaciones Internacionales'],
            ['origen' => 19, 'destino' => 20, 'tipo' => self::TIPO_CONCEPTUAL, 'peso' => 0.7, 'desc' => 'OSCE y UE - Organizaciones Internacionales'],
            
            // Conexiones Prácticas (Aplicación Real)
            ['origen' => 16, 'destino' => 21, 'tipo' => self::TIPO_PRACTICA, 'peso' => 0.8, 'desc' => 'Doctrina Empleo y Misiones Internacionales'],
            ['origen' => 13, 'destino' => 8, 'tipo' => self::TIPO_PRACTICA, 'peso' => 0.7, 'desc' => 'Iniciativas y Quejas con Procedimiento Administrativo'],
            ['origen' => 12, 'destino' => 11, 'tipo' => self::TIPO_PRACTICA, 'peso' => 0.9, 'desc' => 'Régimen Disciplinario aplicado a Derechos y Deberes'],
            
            // Conexiones Temporales (Secuencia Procesal)
            ['origen' => 8, 'destino' => 13, 'tipo' => self::TIPO_TEMPORAL, 'peso' => 0.6, 'desc' => 'Procedimiento Administrativo precede a Iniciativas y Quejas'],
            ['origen' => 13, 'destino' => 12, 'tipo' => self::TIPO_TEMPORAL, 'peso' => 0.7, 'desc' => 'Iniciativas y Quejas pueden llevar a Régimen Disciplinario'],
            ['origen' => 22, 'destino' => 16, 'tipo' => self::TIPO_TEMPORAL, 'peso' => 0.8, 'desc' => 'Seguridad Nacional precede a Doctrina Empleo'],
            ['origen' => 16, 'destino' => 21, 'tipo' => self::TIPO_TEMPORAL, 'peso' => 0.9, 'desc' => 'Doctrina Empleo precede a Misiones Internacionales'],
            ['origen' => 1, 'destino' => 2, 'tipo' => self::TIPO_TEMPORAL, 'peso' => 0.8, 'desc' => 'Constitución es base para Defensa Nacional'],
            ['origen' => 2, 'destino' => 5, 'tipo' => self::TIPO_TEMPORAL, 'peso' => 0.7, 'desc' => 'Defensa Nacional precede a Organización FFAA']
        ];
        
        $success = true;
        foreach ($connections_data as $conn_data) {
            $connection = new self();
            $connection->tema_origen_id = $conn_data['origen'];
            $connection->tema_destino_id = $conn_data['destino'];
            $connection->tipo_conexion = $conn_data['tipo'];
            $connection->peso = $conn_data['peso'];
            $connection->descripcion = $conn_data['desc'];
            $connection->activa = true;
            
            if (!$connection->save()) {
                $success = false;
            }
        }
        
        return $success;
    }
    
    /**
     * Calcula la fuerza total de conexión entre dos temas
     *
     * @param int $tema_origen_id ID del tema origen
     * @param int $tema_destino_id ID del tema destino
     * @return float Fuerza total de conexión (0.0 - 1.0)
     */
    public static function calculate_total_strength($tema_origen_id, $tema_destino_id) {
        $connections = self::get_between_temas($tema_origen_id, $tema_destino_id, true);
        
        if (empty($connections)) {
            return 0.0;
        }
        
        $total_weight = 0.0;
        $count = 0;
        
        foreach ($connections as $connection) {
            $total_weight += $connection->peso;
            $count++;
        }
        
        // Promedio ponderado
        return $count > 0 ? $total_weight / $count : 0.0;
    }
    
    /**
     * Obtiene los tipos de conexión disponibles
     *
     * @return array Array con los tipos de conexión
     */
    public static function get_connection_types() {
        return [
            self::TIPO_DIRECTA => get_string('connection_type_directa', 'local_neuroopositor'),
            self::TIPO_CONCEPTUAL => get_string('connection_type_conceptual', 'local_neuroopositor'),
            self::TIPO_PRACTICA => get_string('connection_type_practica', 'local_neuroopositor'),
            self::TIPO_TEMPORAL => get_string('connection_type_temporal', 'local_neuroopositor')
        ];
    }
}