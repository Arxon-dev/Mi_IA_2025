<?php
/**
 * NeuroOpositor Neural Map Class
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing the neural map visualization and interactions
 */
class local_neuroopositor_neural_map {

    /**
     * Get complete neural map data for visualization
     * @param int $courseid Course ID
     * @param int $userid User ID (optional, for progress data)
     * @param string $view_mode View mode (2d, 3d, auto)
     * @return array Complete map data
     */
    public function get_map_data($courseid, $userid = null, $view_mode = '2d') {
        $topics = $this->get_topics_data($courseid, $userid);
        $connections = $this->get_connections_data($courseid);
        $layout = $this->calculate_layout($topics, $connections, $view_mode);
        
        return [
            'topics' => $topics,
            'connections' => $connections,
            'layout' => $layout,
            'view_mode' => $view_mode,
            'metadata' => $this->get_map_metadata($courseid)
        ];
    }

    /**
     * Get topics data with progress information
     * @param int $courseid Course ID
     * @param int $userid User ID (optional)
     * @return array Topics data
     */
    private function get_topics_data($courseid, $userid = null) {
        global $DB;
        
        $sql = "SELECT 
                    t.id,
                    t.bloque,
                    t.numero,
                    t.titulo,
                    t.descripcion,
                    t.nivel_dificultad,
                    t.posicion_x_2d,
                    t.posicion_y_2d,
                    t.posicion_x_3d,
                    t.posicion_y_3d,
                    t.posicion_z_3d,
                    t.color,
                    t.activo";
        
        $params = [$courseid];
        
        if ($userid) {
            $sql .= ",
                    up.porcentaje_dominio,
                    up.preguntas_correctas,
                    up.preguntas_totales,
                    up.tiempo_estudio_segundos,
                    up.nivel_confianza,
                    up.racha_actual,
                    up.mejor_racha,
                    up.ultima_actividad";
            
            $sql .= " FROM {neuroopositor_temas} t
                     LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id 
                         AND up.userid = ? AND up.courseid = ?
                     WHERE t.courseid = ? AND t.activo = 1
                     ORDER BY t.bloque, t.numero";
            
            $params = [$userid, $courseid, $courseid];
        } else {
            $sql .= " FROM {neuroopositor_temas} t
                     WHERE t.courseid = ? AND t.activo = 1
                     ORDER BY t.bloque, t.numero";
        }
        
        $records = $DB->get_records_sql($sql, $params);
        
        $topics = [];
        foreach ($records as $record) {
            $topic = [
                'id' => (int)$record->id,
                'block' => (int)$record->bloque,
                'number' => (int)$record->numero,
                'title' => $record->titulo,
                'description' => $record->descripcion,
                'difficulty' => (int)$record->nivel_dificultad,
                'position_2d' => [
                    'x' => (float)$record->posicion_x_2d,
                    'y' => (float)$record->posicion_y_2d
                ],
                'position_3d' => [
                    'x' => (float)$record->posicion_x_3d,
                    'y' => (float)$record->posicion_y_3d,
                    'z' => (float)$record->posicion_z_3d
                ],
                'color' => $record->color,
                'active' => (bool)$record->activo
            ];
            
            // Add progress data if user is specified
            if ($userid && isset($record->porcentaje_dominio)) {
                $topic['progress'] = [
                    'mastery_percentage' => (float)$record->porcentaje_dominio,
                    'correct_answers' => (int)$record->preguntas_correctas,
                    'total_questions' => (int)$record->preguntas_totales,
                    'study_time' => (int)$record->tiempo_estudio_segundos,
                    'confidence_level' => (float)$record->nivel_confianza,
                    'current_streak' => (int)$record->racha_actual,
                    'best_streak' => (int)$record->mejor_racha,
                    'last_activity' => (int)$record->ultima_actividad,
                    'status' => $this->calculate_topic_status($record)
                ];
            } else {
                $topic['progress'] = null;
            }
            
            $topics[] = $topic;
        }
        
        return $topics;
    }

    /**
     * Get connections data between topics
     * @param int $courseid Course ID
     * @return array Connections data
     */
    private function get_connections_data($courseid) {
        global $DB;
        
        $sql = "SELECT 
                    c.id,
                    c.tema_origen_id,
                    c.tema_destino_id,
                    c.tipo_conexion,
                    c.peso,
                    c.descripcion,
                    c.activo,
                    t1.titulo as origen_titulo,
                    t2.titulo as destino_titulo
                FROM {neuroopositor_connections} c
                JOIN {neuroopositor_temas} t1 ON c.tema_origen_id = t1.id
                JOIN {neuroopositor_temas} t2 ON c.tema_destino_id = t2.id
                WHERE c.courseid = ? AND c.activo = 1
                ORDER BY c.peso DESC";
        
        $records = $DB->get_records_sql($sql, [$courseid]);
        
        $connections = [];
        foreach ($records as $record) {
            $connections[] = [
                'id' => (int)$record->id,
                'source_id' => (int)$record->tema_origen_id,
                'target_id' => (int)$record->tema_destino_id,
                'type' => $record->tipo_conexion,
                'weight' => (float)$record->peso,
                'description' => $record->descripcion,
                'active' => (bool)$record->activo,
                'source_title' => $record->origen_titulo,
                'target_title' => $record->destino_titulo
            ];
        }
        
        return $connections;
    }

    /**
     * Calculate layout for topics based on connections and view mode
     * @param array $topics Topics data
     * @param array $connections Connections data
     * @param string $view_mode View mode
     * @return array Layout configuration
     */
    private function calculate_layout($topics, $connections, $view_mode) {
        $layout = [
            'algorithm' => 'force_directed',
            'view_mode' => $view_mode,
            'dimensions' => $view_mode === '3d' ? 3 : 2,
            'bounds' => $this->calculate_bounds($topics, $view_mode),
            'clusters' => $this->identify_clusters($topics, $connections),
            'force_settings' => $this->get_force_settings($view_mode)
        ];
        
        return $layout;
    }

    /**
     * Calculate bounds for the visualization
     * @param array $topics Topics data
     * @param string $view_mode View mode
     * @return array Bounds configuration
     */
    private function calculate_bounds($topics, $view_mode) {
        if (empty($topics)) {
            return $view_mode === '3d' ? 
                ['min_x' => -100, 'max_x' => 100, 'min_y' => -100, 'max_y' => 100, 'min_z' => -100, 'max_z' => 100] :
                ['min_x' => -100, 'max_x' => 100, 'min_y' => -100, 'max_y' => 100];
        }
        
        $positions = $view_mode === '3d' ? 'position_3d' : 'position_2d';
        
        $x_values = array_column(array_column($topics, $positions), 'x');
        $y_values = array_column(array_column($topics, $positions), 'y');
        
        $bounds = [
            'min_x' => min($x_values) - 50,
            'max_x' => max($x_values) + 50,
            'min_y' => min($y_values) - 50,
            'max_y' => max($y_values) + 50
        ];
        
        if ($view_mode === '3d') {
            $z_values = array_column(array_column($topics, $positions), 'z');
            $bounds['min_z'] = min($z_values) - 50;
            $bounds['max_z'] = max($z_values) + 50;
        }
        
        return $bounds;
    }

    /**
     * Identify topic clusters based on blocks and connections
     * @param array $topics Topics data
     * @param array $connections Connections data
     * @return array Clusters information
     */
    private function identify_clusters($topics, $connections) {
        $clusters = [];
        $blocks = [];
        
        // Group topics by block
        foreach ($topics as $topic) {
            $block_id = $topic['block'];
            if (!isset($blocks[$block_id])) {
                $blocks[$block_id] = [];
            }
            $blocks[$block_id][] = $topic['id'];
        }
        
        // Create cluster for each block
        foreach ($blocks as $block_id => $topic_ids) {
            $clusters[] = [
                'id' => 'block_' . $block_id,
                'name' => 'Bloque ' . $block_id,
                'topic_ids' => $topic_ids,
                'color' => $this->get_block_color($block_id),
                'type' => 'block'
            ];
        }
        
        // Identify connection-based clusters
        $connection_clusters = $this->find_connection_clusters($topics, $connections);
        $clusters = array_merge($clusters, $connection_clusters);
        
        return $clusters;
    }

    /**
     * Find clusters based on connection patterns
     * @param array $topics Topics data
     * @param array $connections Connections data
     * @return array Connection-based clusters
     */
    private function find_connection_clusters($topics, $connections) {
        // Implementation for finding highly connected topic groups
        $clusters = [];
        $adjacency = [];
        
        // Build adjacency matrix
        foreach ($connections as $connection) {
            $source = $connection['source_id'];
            $target = $connection['target_id'];
            
            if (!isset($adjacency[$source])) {
                $adjacency[$source] = [];
            }
            if (!isset($adjacency[$target])) {
                $adjacency[$target] = [];
            }
            
            $adjacency[$source][] = $target;
            $adjacency[$target][] = $source;
        }
        
        // Find densely connected components
        $visited = [];
        $cluster_id = 0;
        
        foreach (array_keys($adjacency) as $topic_id) {
            if (!isset($visited[$topic_id])) {
                $cluster = $this->dfs_cluster($topic_id, $adjacency, $visited);
                if (count($cluster) >= 3) { // Only clusters with 3+ topics
                    $clusters[] = [
                        'id' => 'connection_cluster_' . $cluster_id++,
                        'name' => 'Grupo Conectado ' . ($cluster_id),
                        'topic_ids' => $cluster,
                        'color' => $this->generate_cluster_color(),
                        'type' => 'connection'
                    ];
                }
            }
        }
        
        return $clusters;
    }

    /**
     * Depth-first search for cluster identification
     * @param int $topic_id Starting topic ID
     * @param array $adjacency Adjacency matrix
     * @param array $visited Visited topics tracker
     * @return array Cluster topic IDs
     */
    private function dfs_cluster($topic_id, $adjacency, &$visited) {
        $visited[$topic_id] = true;
        $cluster = [$topic_id];
        
        if (isset($adjacency[$topic_id])) {
            foreach ($adjacency[$topic_id] as $neighbor) {
                if (!isset($visited[$neighbor])) {
                    $cluster = array_merge($cluster, $this->dfs_cluster($neighbor, $adjacency, $visited));
                }
            }
        }
        
        return $cluster;
    }

    /**
     * Get force simulation settings for layout
     * @param string $view_mode View mode
     * @return array Force settings
     */
    private function get_force_settings($view_mode) {
        $base_settings = [
            'charge_strength' => -300,
            'link_distance' => 100,
            'link_strength' => 0.7,
            'collision_radius' => 30,
            'alpha_decay' => 0.02,
            'velocity_decay' => 0.4
        ];
        
        if ($view_mode === '3d') {
            $base_settings['charge_strength'] = -400;
            $base_settings['link_distance'] = 120;
            $base_settings['collision_radius'] = 35;
        }
        
        return $base_settings;
    }

    /**
     * Get map metadata
     * @param int $courseid Course ID
     * @return array Metadata
     */
    private function get_map_metadata($courseid) {
        global $DB;
        
        $topic_count = $DB->count_records('neuroopositor_temas', ['courseid' => $courseid, 'activo' => 1]);
        $connection_count = $DB->count_records('neuroopositor_connections', ['courseid' => $courseid, 'activo' => 1]);
        
        $blocks = $DB->get_records_sql(
            "SELECT DISTINCT bloque FROM {neuroopositor_temas} 
             WHERE courseid = ? AND activo = 1 ORDER BY bloque",
            [$courseid]
        );
        
        return [
            'total_topics' => $topic_count,
            'total_connections' => $connection_count,
            'total_blocks' => count($blocks),
            'blocks' => array_column($blocks, 'bloque'),
            'last_updated' => time(),
            'version' => '1.0'
        ];
    }

    /**
     * Calculate topic status based on progress
     * @param stdClass $record Topic progress record
     * @return string Status
     */
    private function calculate_topic_status($record) {
        if (!$record->porcentaje_dominio) {
            return 'not_started';
        }
        
        if ($record->porcentaje_dominio >= 80) {
            return 'mastered';
        } else if ($record->porcentaje_dominio >= 60) {
            return 'good_progress';
        } else if ($record->porcentaje_dominio >= 30) {
            return 'in_progress';
        } else {
            return 'struggling';
        }
    }

    /**
     * Get block color
     * @param int $block_id Block ID
     * @return string Color hex code
     */
    private function get_block_color($block_id) {
        $colors = [
            1 => '#3498db', // Blue
            2 => '#e74c3c', // Red
            3 => '#2ecc71', // Green
            4 => '#f39c12', // Orange
            5 => '#9b59b6', // Purple
            6 => '#1abc9c', // Turquoise
            7 => '#34495e', // Dark Blue
            8 => '#e67e22'  // Dark Orange
        ];
        
        return isset($colors[$block_id]) ? $colors[$block_id] : '#95a5a6';
    }

    /**
     * Generate random color for clusters
     * @return string Color hex code
     */
    private function generate_cluster_color() {
        $colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'];
        return $colors[array_rand($colors)];
    }

    /**
     * Update topic position
     * @param int $topic_id Topic ID
     * @param array $position New position
     * @param string $view_mode View mode (2d or 3d)
     * @return bool Success
     */
    public function update_topic_position($topic_id, $position, $view_mode = '2d') {
        global $DB;
        
        $update_data = ['id' => $topic_id];
        
        if ($view_mode === '2d') {
            $update_data['posicion_x_2d'] = $position['x'];
            $update_data['posicion_y_2d'] = $position['y'];
        } else {
            $update_data['posicion_x_3d'] = $position['x'];
            $update_data['posicion_y_3d'] = $position['y'];
            $update_data['posicion_z_3d'] = $position['z'] ?? 0;
        }
        
        return $DB->update_record('neuroopositor_temas', (object)$update_data);
    }

    /**
     * Calculate optimal learning path
     * @param int $courseid Course ID
     * @param int $userid User ID
     * @param array $options Path calculation options
     * @return array Optimal path
     */
    public function calculate_optimal_path($courseid, $userid, $options = []) {
        $topics = $this->get_topics_data($courseid, $userid);
        $connections = $this->get_connections_data($courseid);
        
        // Filter topics based on current progress
        $available_topics = array_filter($topics, function($topic) {
            return !$topic['progress'] || $topic['progress']['mastery_percentage'] < 80;
        });
        
        // Sort by difficulty and prerequisites
        $path = $this->sort_topics_by_learning_order($available_topics, $connections);
        
        // Apply user preferences and AI recommendations
        if (isset($options['max_topics'])) {
            $path = array_slice($path, 0, $options['max_topics']);
        }
        
        return [
            'path' => $path,
            'estimated_time' => $this->estimate_path_time($path),
            'difficulty_progression' => $this->analyze_difficulty_progression($path),
            'recommendations' => $this->generate_path_recommendations($path, $userid)
        ];
    }

    /**
     * Sort topics by optimal learning order
     * @param array $topics Available topics
     * @param array $connections Topic connections
     * @return array Sorted topics
     */
    private function sort_topics_by_learning_order($topics, $connections) {
        // Build prerequisite graph
        $prerequisites = [];
        foreach ($connections as $connection) {
            if ($connection['type'] === 'prerequisito') {
                $prerequisites[$connection['target_id']][] = $connection['source_id'];
            }
        }
        
        // Topological sort with difficulty consideration
        $sorted = [];
        $visited = [];
        $temp_visited = [];
        
        foreach ($topics as $topic) {
            if (!isset($visited[$topic['id']])) {
                $this->topological_sort_visit($topic['id'], $topics, $prerequisites, $visited, $temp_visited, $sorted);
            }
        }
        
        return array_reverse($sorted);
    }

    /**
     * Topological sort helper function
     * @param int $topic_id Current topic ID
     * @param array $topics All topics
     * @param array $prerequisites Prerequisites graph
     * @param array $visited Visited tracker
     * @param array $temp_visited Temporary visited tracker
     * @param array $sorted Sorted result
     */
    private function topological_sort_visit($topic_id, $topics, $prerequisites, &$visited, &$temp_visited, &$sorted) {
        if (isset($temp_visited[$topic_id])) {
            return; // Cycle detected, skip
        }
        
        if (isset($visited[$topic_id])) {
            return;
        }
        
        $temp_visited[$topic_id] = true;
        
        if (isset($prerequisites[$topic_id])) {
            foreach ($prerequisites[$topic_id] as $prereq_id) {
                $this->topological_sort_visit($prereq_id, $topics, $prerequisites, $visited, $temp_visited, $sorted);
            }
        }
        
        unset($temp_visited[$topic_id]);
        $visited[$topic_id] = true;
        
        // Find topic data and add to sorted list
        foreach ($topics as $topic) {
            if ($topic['id'] === $topic_id) {
                $sorted[] = $topic;
                break;
            }
        }
    }

    /**
     * Estimate time required for learning path
     * @param array $path Learning path
     * @return int Estimated time in seconds
     */
    private function estimate_path_time($path) {
        $total_time = 0;
        
        foreach ($path as $topic) {
            // Base time estimation based on difficulty
            $base_time = 1800; // 30 minutes
            $difficulty_multiplier = $topic['difficulty'] * 0.5;
            $topic_time = $base_time * (1 + $difficulty_multiplier);
            
            // Adjust based on current progress
            if ($topic['progress']) {
                $progress_factor = (100 - $topic['progress']['mastery_percentage']) / 100;
                $topic_time *= $progress_factor;
            }
            
            $total_time += $topic_time;
        }
        
        return (int)$total_time;
    }

    /**
     * Analyze difficulty progression in path
     * @param array $path Learning path
     * @return array Difficulty analysis
     */
    private function analyze_difficulty_progression($path) {
        $difficulties = array_column($path, 'difficulty');
        
        return [
            'average_difficulty' => array_sum($difficulties) / count($difficulties),
            'difficulty_range' => [min($difficulties), max($difficulties)],
            'progression_smooth' => $this->is_progression_smooth($difficulties),
            'difficulty_spikes' => $this->find_difficulty_spikes($difficulties)
        ];
    }

    /**
     * Check if difficulty progression is smooth
     * @param array $difficulties Difficulty values
     * @return bool Is smooth
     */
    private function is_progression_smooth($difficulties) {
        $max_jump = 0;
        for ($i = 1; $i < count($difficulties); $i++) {
            $jump = abs($difficulties[$i] - $difficulties[$i-1]);
            $max_jump = max($max_jump, $jump);
        }
        
        return $max_jump <= 2; // Allow max 2-level difficulty jumps
    }

    /**
     * Find difficulty spikes in progression
     * @param array $difficulties Difficulty values
     * @return array Spike positions
     */
    private function find_difficulty_spikes($difficulties) {
        $spikes = [];
        for ($i = 1; $i < count($difficulties); $i++) {
            $jump = $difficulties[$i] - $difficulties[$i-1];
            if ($jump > 2) {
                $spikes[] = $i;
            }
        }
        
        return $spikes;
    }

    /**
     * Generate recommendations for learning path
     * @param array $path Learning path
     * @param int $userid User ID
     * @return array Recommendations
     */
    private function generate_path_recommendations($path, $userid) {
        $recommendations = [];
        
        // Check for difficulty spikes
        $difficulties = array_column($path, 'difficulty');
        $spikes = $this->find_difficulty_spikes($difficulties);
        
        if (!empty($spikes)) {
            $recommendations[] = [
                'type' => 'difficulty_warning',
                'message' => 'Se detectaron saltos de dificultad en tu ruta de aprendizaje. Considera revisar temas previos.',
                'positions' => $spikes
            ];
        }
        
        // Check for long study sessions
        $estimated_time = $this->estimate_path_time($path);
        if ($estimated_time > 7200) { // 2 hours
            $recommendations[] = [
                'type' => 'break_suggestion',
                'message' => 'Esta ruta de estudio es larga. Te recomendamos dividirla en sesiones más cortas.',
                'suggested_breaks' => ceil($estimated_time / 3600)
            ];
        }
        
        // Personalized recommendations based on user history
        $user_stats = local_neuroopositor_user_progress::get_user_statistics($userid, $path[0]['id'] ?? 0);
        
        if ($user_stats && $user_stats->overall_accuracy < 70) {
            $recommendations[] = [
                'type' => 'review_suggestion',
                'message' => 'Tu precisión general es baja. Considera revisar temas básicos antes de continuar.',
                'suggested_action' => 'review_basics'
            ];
        }
        
        return $recommendations;
    }

    /**
     * Auto-arrange topics using force-directed algorithm
     * @param int $courseid Course ID
     * @param string $view_mode View mode (2d or 3d)
     * @param array $options Algorithm options
     * @return bool Success
     */
    public function auto_arrange_topics($courseid, $view_mode = '2d', $options = []) {
        $topics = $this->get_topics_data($courseid);
        $connections = $this->get_connections_data($courseid);
        
        // Run force-directed layout algorithm
        $new_positions = $this->run_force_directed_layout($topics, $connections, $view_mode, $options);
        
        // Update topic positions in database
        $success = true;
        foreach ($new_positions as $topic_id => $position) {
            if (!$this->update_topic_position($topic_id, $position, $view_mode)) {
                $success = false;
            }
        }
        
        return $success;
    }

    /**
     * Run force-directed layout algorithm
     * @param array $topics Topics data
     * @param array $connections Connections data
     * @param string $view_mode View mode
     * @param array $options Algorithm options
     * @return array New positions
     */
    private function run_force_directed_layout($topics, $connections, $view_mode, $options) {
        $iterations = $options['iterations'] ?? 100;
        $dimensions = $view_mode === '3d' ? 3 : 2;
        
        // Initialize positions
        $positions = [];
        $velocities = [];
        
        foreach ($topics as $topic) {
            $topic_id = $topic['id'];
            $current_pos = $view_mode === '3d' ? $topic['position_3d'] : $topic['position_2d'];
            
            $positions[$topic_id] = $current_pos;
            $velocities[$topic_id] = array_fill(0, $dimensions, 0);
        }
        
        // Force simulation
        for ($i = 0; $i < $iterations; $i++) {
            $forces = $this->calculate_forces($topics, $connections, $positions, $view_mode);
            
            // Update velocities and positions
            foreach ($topics as $topic) {
                $topic_id = $topic['id'];
                
                for ($d = 0; $d < $dimensions; $d++) {
                    $velocities[$topic_id][$d] = ($velocities[$topic_id][$d] + $forces[$topic_id][$d]) * 0.9;
                    $positions[$topic_id][array_keys($positions[$topic_id])[$d]] += $velocities[$topic_id][$d];
                }
            }
        }
        
        return $positions;
    }

    /**
     * Calculate forces for force-directed layout
     * @param array $topics Topics data
     * @param array $connections Connections data
     * @param array $positions Current positions
     * @param string $view_mode View mode
     * @return array Forces
     */
    private function calculate_forces($topics, $connections, $positions, $view_mode) {
        $forces = [];
        $dimensions = $view_mode === '3d' ? 3 : 2;
        
        // Initialize forces
        foreach ($topics as $topic) {
            $forces[$topic['id']] = array_fill(0, $dimensions, 0);
        }
        
        // Repulsive forces between all nodes
        foreach ($topics as $topic1) {
            foreach ($topics as $topic2) {
                if ($topic1['id'] !== $topic2['id']) {
                    $force = $this->calculate_repulsive_force($positions[$topic1['id']], $positions[$topic2['id']], $view_mode);
                    
                    for ($d = 0; $d < $dimensions; $d++) {
                        $forces[$topic1['id']][$d] += $force[$d];
                    }
                }
            }
        }
        
        // Attractive forces for connected nodes
        foreach ($connections as $connection) {
            $source_id = $connection['source_id'];
            $target_id = $connection['target_id'];
            
            $force = $this->calculate_attractive_force(
                $positions[$source_id], 
                $positions[$target_id], 
                $connection['weight'],
                $view_mode
            );
            
            for ($d = 0; $d < $dimensions; $d++) {
                $forces[$source_id][$d] += $force[$d];
                $forces[$target_id][$d] -= $force[$d];
            }
        }
        
        return $forces;
    }

    /**
     * Calculate repulsive force between two nodes
     * @param array $pos1 Position 1
     * @param array $pos2 Position 2
     * @param string $view_mode View mode
     * @return array Force vector
     */
    private function calculate_repulsive_force($pos1, $pos2, $view_mode) {
        $dimensions = $view_mode === '3d' ? ['x', 'y', 'z'] : ['x', 'y'];
        $force = [];
        $distance_sq = 0;
        
        // Calculate distance
        foreach ($dimensions as $dim) {
            $diff = $pos1[$dim] - $pos2[$dim];
            $distance_sq += $diff * $diff;
        }
        
        $distance = sqrt(max($distance_sq, 1)); // Avoid division by zero
        $force_magnitude = 1000 / ($distance * $distance);
        
        // Calculate force components
        foreach ($dimensions as $i => $dim) {
            $diff = $pos1[$dim] - $pos2[$dim];
            $force[$i] = ($diff / $distance) * $force_magnitude;
        }
        
        return $force;
    }

    /**
     * Calculate attractive force between connected nodes
     * @param array $pos1 Position 1
     * @param array $pos2 Position 2
     * @param float $weight Connection weight
     * @param string $view_mode View mode
     * @return array Force vector
     */
    private function calculate_attractive_force($pos1, $pos2, $weight, $view_mode) {
        $dimensions = $view_mode === '3d' ? ['x', 'y', 'z'] : ['x', 'y'];
        $force = [];
        $distance = 0;
        
        // Calculate distance
        foreach ($dimensions as $dim) {
            $diff = $pos2[$dim] - $pos1[$dim];
            $distance += $diff * $diff;
        }
        
        $distance = sqrt($distance);
        $force_magnitude = $distance * $weight * 0.01;
        
        // Calculate force components
        foreach ($dimensions as $i => $dim) {
            $diff = $pos2[$dim] - $pos1[$dim];
            $force[$i] = ($diff / max($distance, 1)) * $force_magnitude;
        }
        
        return $force;
    }
}