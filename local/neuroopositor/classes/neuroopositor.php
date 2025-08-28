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
 * Main NeuroOpositor class.
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_neuroopositor;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/filelib.php');

/**
 * Main NeuroOpositor class for managing neural map functionality.
 */
class neuroopositor {

    /** @var int Course ID */
    private $courseid;

    /** @var int User ID */
    private $userid;

    /** @var \stdClass Database connection */
    private $db;

    /** @var array Configuration settings */
    private $config;

    /**
     * Constructor.
     *
     * @param int $courseid Course ID
     * @param int $userid User ID (optional, defaults to current user)
     */
    public function __construct($courseid, $userid = null) {
        global $DB, $USER;

        $this->courseid = $courseid;
        $this->userid = $userid ?? $USER->id;
        $this->db = $DB;
        $this->load_config();
    }

    /**
     * Load plugin configuration.
     */
    private function load_config() {
        $this->config = [
            'enabled' => get_config('local_neuroopositor', 'enabled') ?? true,
            'enable_3d' => get_config('local_neuroopositor', 'enable_3d') ?? true,
            'enable_ai' => get_config('local_neuroopositor', 'enable_ai') ?? true,
            'max_nodes_per_view' => get_config('local_neuroopositor', 'max_nodes_per_view') ?? 100,
            'default_layout' => get_config('local_neuroopositor', 'default_layout') ?? 'force',
            'enable_cache' => get_config('local_neuroopositor', 'enable_cache') ?? true,
            'cache_lifetime' => get_config('local_neuroopositor', 'cache_lifetime') ?? 3600,
            'default_questions_per_session' => get_config('local_neuroopositor', 'default_questions_per_session') ?? 10,
            'question_time_limit' => get_config('local_neuroopositor', 'question_time_limit') ?? 300,
            'enable_hints' => get_config('local_neuroopositor', 'enable_hints') ?? true,
        ];
    }

    /**
     * Get neural map data for the course.
     *
     * @return array Neural map data including topics and connections
     */
    public function get_neural_map_data() {
        $cache_key = "neural_map_{$this->courseid}";
        
        if ($this->config['enable_cache']) {
            $cached_data = $this->get_from_cache($cache_key);
            if ($cached_data !== false) {
                return $cached_data;
            }
        }

        $topics = $this->get_topics();
        $connections = $this->get_connections();
        $user_progress = $this->get_user_progress();

        $data = [
            'topics' => $topics,
            'connections' => $connections,
            'user_progress' => $user_progress,
            'config' => [
                'enable_3d' => $this->config['enable_3d'],
                'default_layout' => $this->config['default_layout'],
                'max_nodes' => $this->config['max_nodes_per_view']
            ]
        ];

        if ($this->config['enable_cache']) {
            $this->save_to_cache($cache_key, $data);
        }

        return $data;
    }

    /**
     * Get all topics for the course.
     *
     * @return array Array of topic objects
     */
    public function get_topics() {
        $sql = "SELECT t.*, 
                       COALESCE(up.porcentaje_dominio, 0) as progress,
                       COALESCE(up.nivel_confianza, 0) as confidence
                FROM {neuroopositor_temas} t
                LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = :userid
                ORDER BY t.bloque, t.numero";
        
        $params = ['userid' => $this->userid];
        $topics = $this->db->get_records_sql($sql, $params);

        // Process topics for frontend
        foreach ($topics as &$topic) {
            $topic->progress = floatval($topic->progress);
            $topic->confidence = floatval($topic->confidence);
            $topic->status = $this->calculate_topic_status($topic->progress, $topic->confidence);
        }

        return array_values($topics);
    }

    /**
     * Get all connections between topics.
     *
     * @return array Array of connection objects
     */
    public function get_connections() {
        $sql = "SELECT c.*, 
                       t1.titulo as origen_titulo,
                       t2.titulo as destino_titulo
                FROM {neuroopositor_connections} c
                JOIN {neuroopositor_temas} t1 ON c.tema_origen_id = t1.id
                JOIN {neuroopositor_temas} t2 ON c.tema_destino_id = t2.id
                WHERE c.activa = 1
                ORDER BY c.peso DESC";
        
        return array_values($this->db->get_records_sql($sql));
    }

    /**
     * Get user progress for all topics.
     *
     * @return array Array of progress data
     */
    public function get_user_progress() {
        $sql = "SELECT up.*, t.titulo, t.bloque, t.numero
                FROM {neuroopositor_user_progress} up
                JOIN {neuroopositor_temas} t ON up.tema_id = t.id
                WHERE up.userid = :userid AND up.courseid = :courseid
                ORDER BY t.bloque, t.numero";
        
        $params = ['userid' => $this->userid, 'courseid' => $this->courseid];
        return array_values($this->db->get_records_sql($sql, $params));
    }

    /**
     * Calculate topic status based on progress and confidence.
     *
     * @param float $progress Progress percentage
     * @param float $confidence Confidence level
     * @return string Status (not_started, in_progress, mastered, needs_review)
     */
    private function calculate_topic_status($progress, $confidence) {
        if ($progress == 0) {
            return 'not_started';
        } elseif ($progress >= 80 && $confidence >= 0.8) {
            return 'mastered';
        } elseif ($progress >= 50 && $confidence < 0.6) {
            return 'needs_review';
        } else {
            return 'in_progress';
        }
    }

    /**
     * Update node position in the neural map.
     *
     * @param int $topicid Topic ID
     * @param float $x X coordinate
     * @param float $y Y coordinate
     * @param float $z Z coordinate (optional)
     * @return bool Success status
     */
    public function update_node_position($topicid, $x, $y, $z = null) {
        $data = [
            'id' => $topicid,
            'posicion_x' => $x,
            'posicion_y' => $y,
            'timemodified' => time()
        ];

        if ($z !== null) {
            $data['posicion_z'] = $z;
        }

        $result = $this->db->update_record('neuroopositor_temas', $data);
        
        if ($result && $this->config['enable_cache']) {
            $this->clear_cache("neural_map_{$this->courseid}");
        }

        return $result;
    }

    /**
     * Auto-organize topics using force-directed algorithm.
     *
     * @return bool Success status
     */
    public function auto_organize_topics() {
        $topics = $this->get_topics();
        $connections = $this->get_connections();

        // Simple force-directed layout algorithm
        $positions = $this->calculate_force_directed_layout($topics, $connections);

        $success = true;
        foreach ($positions as $topicid => $position) {
            $result = $this->update_node_position($topicid, $position['x'], $position['y'], $position['z'] ?? 0);
            if (!$result) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Calculate force-directed layout positions.
     *
     * @param array $topics Array of topics
     * @param array $connections Array of connections
     * @return array Calculated positions
     */
    private function calculate_force_directed_layout($topics, $connections) {
        $positions = [];
        $center_x = 0;
        $center_y = 0;
        $radius = 200;

        // Initialize positions in a circle
        $count = count($topics);
        foreach ($topics as $i => $topic) {
            $angle = (2 * M_PI * $i) / $count;
            $positions[$topic->id] = [
                'x' => $center_x + $radius * cos($angle),
                'y' => $center_y + $radius * sin($angle),
                'z' => 0
            ];
        }

        // Apply force-directed algorithm (simplified)
        for ($iteration = 0; $iteration < 50; $iteration++) {
            $forces = [];
            
            // Initialize forces
            foreach ($topics as $topic) {
                $forces[$topic->id] = ['x' => 0, 'y' => 0, 'z' => 0];
            }

            // Repulsive forces between all nodes
            foreach ($topics as $topic1) {
                foreach ($topics as $topic2) {
                    if ($topic1->id != $topic2->id) {
                        $dx = $positions[$topic1->id]['x'] - $positions[$topic2->id]['x'];
                        $dy = $positions[$topic1->id]['y'] - $positions[$topic2->id]['y'];
                        $distance = sqrt($dx * $dx + $dy * $dy);
                        
                        if ($distance > 0) {
                            $force = 1000 / ($distance * $distance);
                            $forces[$topic1->id]['x'] += ($dx / $distance) * $force;
                            $forces[$topic1->id]['y'] += ($dy / $distance) * $force;
                        }
                    }
                }
            }

            // Attractive forces for connected nodes
            foreach ($connections as $connection) {
                $dx = $positions[$connection->tema_destino_id]['x'] - $positions[$connection->tema_origen_id]['x'];
                $dy = $positions[$connection->tema_destino_id]['y'] - $positions[$connection->tema_origen_id]['y'];
                $distance = sqrt($dx * $dx + $dy * $dy);
                
                if ($distance > 0) {
                    $force = $distance * 0.01 * $connection->peso;
                    $forces[$connection->tema_origen_id]['x'] += ($dx / $distance) * $force;
                    $forces[$connection->tema_origen_id]['y'] += ($dy / $distance) * $force;
                    $forces[$connection->tema_destino_id]['x'] -= ($dx / $distance) * $force;
                    $forces[$connection->tema_destino_id]['y'] -= ($dy / $distance) * $force;
                }
            }

            // Apply forces
            foreach ($topics as $topic) {
                $positions[$topic->id]['x'] += $forces[$topic->id]['x'] * 0.1;
                $positions[$topic->id]['y'] += $forces[$topic->id]['y'] * 0.1;
            }
        }

        return $positions;
    }

    /**
     * Calculate optimal learning path for user.
     *
     * @param array $target_topics Target topic IDs (optional)
     * @return array Optimal path
     */
    public function calculate_optimal_path($target_topics = null) {
        $topics = $this->get_topics();
        $connections = $this->get_connections();
        $progress = $this->get_user_progress();

        // Build adjacency list
        $graph = [];
        foreach ($topics as $topic) {
            $graph[$topic->id] = [];
        }

        foreach ($connections as $connection) {
            $graph[$connection->tema_origen_id][] = [
                'id' => $connection->tema_destino_id,
                'weight' => $connection->peso
            ];
        }

        // Find topics that need attention
        $needs_attention = [];
        foreach ($topics as $topic) {
            if ($topic->progress < 80 || $topic->confidence < 0.7) {
                $needs_attention[] = $topic->id;
            }
        }

        if ($target_topics) {
            $needs_attention = array_intersect($needs_attention, $target_topics);
        }

        // Sort by priority (difficulty, prerequisites, etc.)
        usort($needs_attention, function($a, $b) use ($topics) {
            $topic_a = array_filter($topics, function($t) use ($a) { return $t->id == $a; })[0];
            $topic_b = array_filter($topics, function($t) use ($b) { return $t->id == $b; })[0];
            
            // Prioritize by block and number
            if ($topic_a->bloque != $topic_b->bloque) {
                return $topic_a->bloque - $topic_b->bloque;
            }
            return $topic_a->numero - $topic_b->numero;
        });

        return array_slice($needs_attention, 0, 10); // Return top 10 recommendations
    }

    /**
     * Get data from cache.
     *
     * @param string $key Cache key
     * @return mixed Cached data or false if not found
     */
    private function get_from_cache($key) {
        $cache_record = $this->db->get_record('neuroopositor_cache', ['cache_key' => $key]);
        
        if ($cache_record && ($cache_record->expires_at === null || $cache_record->expires_at > time())) {
            return json_decode($cache_record->cache_data, true);
        }
        
        return false;
    }

    /**
     * Save data to cache.
     *
     * @param string $key Cache key
     * @param mixed $data Data to cache
     */
    private function save_to_cache($key, $data) {
        $cache_record = [
            'cache_key' => $key,
            'cache_data' => json_encode($data),
            'cache_type' => 'neural_map',
            'expires_at' => time() + $this->config['cache_lifetime'],
            'timecreated' => time(),
            'timemodified' => time()
        ];

        $existing = $this->db->get_record('neuroopositor_cache', ['cache_key' => $key]);
        if ($existing) {
            $cache_record['id'] = $existing->id;
            $this->db->update_record('neuroopositor_cache', $cache_record);
        } else {
            $this->db->insert_record('neuroopositor_cache', $cache_record);
        }
    }

    /**
     * Clear cache entry.
     *
     * @param string $key Cache key
     */
    private function clear_cache($key) {
        $this->db->delete_records('neuroopositor_cache', ['cache_key' => $key]);
    }

    /**
     * Get user statistics.
     *
     * @return array Statistics data
     */
    public function get_user_statistics() {
        $stats = [];
        
        // Overall progress
        $sql = "SELECT 
                    COUNT(*) as total_topics,
                    AVG(porcentaje_dominio) as avg_progress,
                    SUM(preguntas_correctas) as total_correct,
                    SUM(preguntas_totales) as total_questions,
                    SUM(tiempo_estudio_segundos) as total_study_time
                FROM {neuroopositor_user_progress} up
                JOIN {neuroopositor_temas} t ON up.tema_id = t.id
                WHERE up.userid = :userid AND up.courseid = :courseid";
        
        $params = ['userid' => $this->userid, 'courseid' => $this->courseid];
        $overall = $this->db->get_record_sql($sql, $params);
        
        $stats['overall'] = [
            'total_topics' => intval($overall->total_topics),
            'avg_progress' => floatval($overall->avg_progress ?? 0),
            'accuracy' => $overall->total_questions > 0 ? 
                         floatval($overall->total_correct / $overall->total_questions * 100) : 0,
            'total_study_time' => intval($overall->total_study_time ?? 0),
            'total_questions' => intval($overall->total_questions ?? 0)
        ];

        // Progress by block
        $sql = "SELECT 
                    t.bloque,
                    COUNT(*) as topics_count,
                    AVG(up.porcentaje_dominio) as avg_progress,
                    SUM(up.preguntas_correctas) as correct_answers,
                    SUM(up.preguntas_totales) as total_questions
                FROM {neuroopositor_temas} t
                LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = :userid
                GROUP BY t.bloque
                ORDER BY t.bloque";
        
        $stats['by_block'] = array_values($this->db->get_records_sql($sql, $params));

        // Recent activity
        $sql = "SELECT 
                    t.titulo,
                    up.ultima_actividad,
                    up.porcentaje_dominio
                FROM {neuroopositor_user_progress} up
                JOIN {neuroopositor_temas} t ON up.tema_id = t.id
                WHERE up.userid = :userid AND up.courseid = :courseid
                ORDER BY up.ultima_actividad DESC
                LIMIT 10";
        
        $stats['recent_activity'] = array_values($this->db->get_records_sql($sql, $params));

        return $stats;
    }

    /**
     * Check if plugin is enabled.
     *
     * @return bool
     */
    public function is_enabled() {
        return $this->config['enabled'];
    }

    /**
     * Check if AI features are enabled.
     *
     * @return bool
     */
    public function is_ai_enabled() {
        return $this->config['enable_ai'];
    }

    /**
     * Check if 3D visualization is enabled.
     *
     * @return bool
     */
    public function is_3d_enabled() {
        return $this->config['enable_3d'];
    }
}