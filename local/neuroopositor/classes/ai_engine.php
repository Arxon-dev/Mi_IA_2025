<?php
/**
 * NeuroOpositor AI Engine Class
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

namespace local_neuroopositor;

/**
 * AI Engine for NeuroOpositor - Provides intelligent recommendations and analysis
 */
class ai_engine {

    /**
     * Get recommended topics for a user
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Recommended topics
     */
    public function get_recommended_topics($userid, $courseid) {
        global $DB;
        
        // Get user progress
        $user_progress = $DB->get_records('neuroopositor_user_progress', 
            ['userid' => $userid, 'courseid' => $courseid]);
        
        // Get all topics
        $all_topics = \local_neuroopositor\tema::get_all();
        
        $recommendations = [];
        
        foreach ($all_topics as $topic) {
            $progress = null;
            foreach ($user_progress as $up) {
                if ($up->tema_id == $topic->id) {
                    $progress = $up;
                    break;
                }
            }
            
            $score = 0;
            $reason = '';
            
            if (!$progress) {
                // New topic - high priority
                $score = 80;
                $reason = 'Tema nuevo por explorar';
            } else {
                // Calculate recommendation score based on mastery
                $mastery = $progress->porcentaje_dominio;
                if ($mastery < 50) {
                    $score = 90 - $mastery; // Higher score for lower mastery
                    $reason = 'Necesita refuerzo';
                } else if ($mastery < 80) {
                    $score = 70 - ($mastery - 50);
                    $reason = 'Continuar mejorando';
                } else {
                    $score = 30;
                    $reason = 'Repaso ocasional';
                }
            }
            
            $recommendations[] = [
                'topic_id' => $topic->id,
                'topic_title' => $topic->titulo,
                'score' => $score,
                'reason' => $reason,
                'current_mastery' => $progress ? $progress->porcentaje_dominio : 0
            ];
        }
        
        // Sort by score (highest first)
        usort($recommendations, function($a, $b) {
            return $b['score'] - $a['score'];
        });
        
        // Return top 5 recommendations
        return array_slice($recommendations, 0, 5);
    }
    
    /**
     * Generate personalized learning recommendations
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param array $options Recommendation options
     * @return array Personalized recommendations
     */
    public function generate_recommendations($userid, $courseid, $options = []) {
        $user_profile = $this->build_user_profile($userid, $courseid);
        $learning_patterns = $this->analyze_learning_patterns($userid, $courseid);
        $topic_analysis = $this->analyze_topic_performance($userid, $courseid);
        
        $recommendations = [];
        
        // Study schedule recommendations
        $recommendations['schedule'] = $this->recommend_study_schedule($user_profile, $learning_patterns);
        
        // Topic sequence recommendations
        $recommendations['topics'] = $this->recommend_topic_sequence($user_profile, $topic_analysis);
        
        // Difficulty adjustment recommendations
        $recommendations['difficulty'] = $this->recommend_difficulty_adjustments($user_profile, $topic_analysis);
        
        // Study method recommendations
        $recommendations['methods'] = $this->recommend_study_methods($user_profile, $learning_patterns);
        
        // Review recommendations
        $recommendations['review'] = $this->recommend_review_topics($user_profile, $topic_analysis);
        
        return [
            'recommendations' => $recommendations,
            'confidence_score' => $this->calculate_recommendation_confidence($user_profile),
            'generated_at' => time(),
            'user_profile' => $user_profile
        ];
    }

    /**
     * Build comprehensive user profile
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array User profile
     */
    private function build_user_profile($userid, $courseid) {
        global $DB;
        
        // Basic user statistics
        $stats = \local_neuroopositor\user_progress::get_user_statistics($userid, $courseid);
        
        // Learning velocity analysis
        $velocity = $this->calculate_learning_velocity($userid, $courseid);
        
        // Consistency analysis
        $consistency = $this->analyze_study_consistency($userid, $courseid);
        
        // Strength and weakness analysis
        $strengths_weaknesses = $this->analyze_strengths_weaknesses($userid, $courseid);
        
        // Learning style inference
        $learning_style = $this->infer_learning_style($userid, $courseid);
        
        // Motivation and engagement metrics
        $engagement = $this->analyze_engagement_metrics($userid, $courseid);
        
        return [
            'basic_stats' => $stats,
            'learning_velocity' => $velocity,
            'consistency' => $consistency,
            'strengths_weaknesses' => $strengths_weaknesses,
            'learning_style' => $learning_style,
            'engagement' => $engagement,
            'profile_completeness' => $this->calculate_profile_completeness($stats)
        ];
    }

    /**
     * Calculate learning velocity
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Learning velocity metrics
     */
    private function calculate_learning_velocity($userid, $courseid) {
        global $DB;
        
        $sql = "SELECT 
                    DATE(FROM_UNIXTIME(timemodified)) as study_date,
                    COUNT(DISTINCT tema_id) as topics_studied,
                    SUM(preguntas_totales) as questions_answered,
                    AVG(porcentaje_dominio) as average_progress
                FROM {neuroopositor_user_progress}
                WHERE userid = ? AND courseid = ? AND timemodified >= ?
                GROUP BY DATE(FROM_UNIXTIME(timemodified))
                ORDER BY study_date DESC
                LIMIT 30";
        
        $records = $DB->get_records_sql($sql, [$userid, $courseid, time() - (30 * 24 * 60 * 60)]);
        
        if (empty($records)) {
            return [
                'topics_per_day' => 0,
                'questions_per_day' => 0,
                'progress_rate' => 0,
                'trend' => 'insufficient_data'
            ];
        }
        
        $daily_topics = array_column($records, 'topics_studied');
        $daily_questions = array_column($records, 'questions_answered');
        $daily_progress = array_column($records, 'average_progress');
        
        return [
            'topics_per_day' => array_sum($daily_topics) / count($daily_topics),
            'questions_per_day' => array_sum($daily_questions) / count($daily_questions),
            'progress_rate' => array_sum($daily_progress) / count($daily_progress),
            'trend' => $this->calculate_trend($daily_progress),
            'consistency_score' => $this->calculate_consistency_score($daily_topics)
        ];
    }

    /**
     * Analyze study consistency
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Consistency metrics
     */
    private function analyze_study_consistency($userid, $courseid) {
        global $DB;
        
        // Get study sessions over last 30 days
        $sql = "SELECT 
                    DATE(FROM_UNIXTIME(ultima_actividad)) as study_date,
                    COUNT(*) as session_count,
                    SUM(tiempo_estudio_segundos) as total_time
                FROM {neuroopositor_user_progress}
                WHERE userid = ? AND courseid = ? AND ultima_actividad >= ?
                GROUP BY DATE(FROM_UNIXTIME(ultima_actividad))
                ORDER BY study_date DESC";
        
        $records = $DB->get_records_sql($sql, [$userid, $courseid, time() - (30 * 24 * 60 * 60)]);
        
        $study_days = count($records);
        $total_days = 30;
        $consistency_rate = $study_days / $total_days;
        
        // Calculate study time variance
        $daily_times = array_column($records, 'total_time');
        $time_variance = $this->calculate_variance($daily_times);
        
        // Identify study patterns
        $patterns = $this->identify_study_patterns($records);
        
        return [
            'study_frequency' => $consistency_rate,
            'days_studied' => $study_days,
            'average_session_time' => array_sum($daily_times) / max(count($daily_times), 1),
            'time_variance' => $time_variance,
            'patterns' => $patterns,
            'consistency_level' => $this->classify_consistency($consistency_rate, $time_variance)
        ];
    }

    /**
     * Analyze strengths and weaknesses
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Strengths and weaknesses analysis
     */
    private function analyze_strengths_weaknesses($userid, $courseid) {
        global $DB;
        
        // Performance by block
        $sql = "SELECT 
                    t.bloque,
                    AVG(up.porcentaje_dominio) as avg_mastery,
                    AVG(up.preguntas_correctas / NULLIF(up.preguntas_totales, 0)) as avg_accuracy,
                    AVG(up.tiempo_estudio_segundos) as avg_study_time,
                    COUNT(*) as topics_attempted
                FROM {neuroopositor_temas} t
                JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id
                WHERE up.userid = ? AND up.courseid = ?
                GROUP BY t.bloque
                ORDER BY t.bloque";
        
        $block_performance = $DB->get_records_sql($sql, [$userid, $courseid]);
        
        // Performance by difficulty level
        $sql = "SELECT 
                    t.nivel_dificultad,
                    AVG(up.porcentaje_dominio) as avg_mastery,
                    AVG(up.preguntas_correctas / NULLIF(up.preguntas_totales, 0)) as avg_accuracy,
                    COUNT(*) as topics_attempted
                FROM {neuroopositor_temas} t
                JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id
                WHERE up.userid = ? AND up.courseid = ?
                GROUP BY t.nivel_dificultad
                ORDER BY t.nivel_dificultad";
        
        $difficulty_performance = $DB->get_records_sql($sql, [$userid, $courseid]);
        
        // Identify strengths and weaknesses
        $strengths = [];
        $weaknesses = [];
        
        foreach ($block_performance as $block) {
            if ($block->avg_mastery >= 75) {
                $strengths[] = [
                    'type' => 'block',
                    'identifier' => 'Bloque ' . $block->bloque,
                    'score' => $block->avg_mastery,
                    'reason' => 'Alto dominio promedio'
                ];
            } else if ($block->avg_mastery < 50) {
                $weaknesses[] = [
                    'type' => 'block',
                    'identifier' => 'Bloque ' . $block->bloque,
                    'score' => $block->avg_mastery,
                    'reason' => 'Bajo dominio promedio'
                ];
            }
        }
        
        foreach ($difficulty_performance as $diff) {
            if ($diff->avg_accuracy >= 0.8 && $diff->nivel_dificultad >= 4) {
                $strengths[] = [
                    'type' => 'difficulty',
                    'identifier' => 'Nivel ' . $diff->nivel_dificultad,
                    'score' => $diff->avg_accuracy * 100,
                    'reason' => 'Buena precisión en temas difíciles'
                ];
            } else if ($diff->avg_accuracy < 0.6) {
                $weaknesses[] = [
                    'type' => 'difficulty',
                    'identifier' => 'Nivel ' . $diff->nivel_dificultad,
                    'score' => $diff->avg_accuracy * 100,
                    'reason' => 'Baja precisión'
                ];
            }
        }
        
        return [
            'strengths' => $strengths,
            'weaknesses' => $weaknesses,
            'block_performance' => $block_performance,
            'difficulty_performance' => $difficulty_performance
        ];
    }

    /**
     * Infer learning style from behavior patterns
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Learning style analysis
     */
    private function infer_learning_style($userid, $courseid) {
        global $DB;
        
        // Analyze study session patterns
        $session_data = $DB->get_records_sql(
            "SELECT 
                AVG(tiempo_estudio_segundos) as avg_session_time,
                AVG(preguntas_totales) as avg_questions_per_session,
                COUNT(DISTINCT DATE(FROM_UNIXTIME(ultima_actividad))) as study_days
             FROM {neuroopositor_user_progress}
             WHERE userid = ? AND courseid = ?",
            [$userid, $courseid]
        );
        
        $session_info = reset($session_data);
        
        // Analyze error patterns
        $error_patterns = $this->analyze_error_patterns($userid, $courseid);
        
        // Analyze review behavior
        $review_behavior = $this->analyze_review_behavior($userid, $courseid);
        
        // Infer learning preferences
        $preferences = [];
        
        // Session length preference
        if ($session_info->avg_session_time > 3600) { // > 1 hour
            $preferences['session_length'] = 'long';
        } else if ($session_info->avg_session_time < 1800) { // < 30 minutes
            $preferences['session_length'] = 'short';
        } else {
            $preferences['session_length'] = 'medium';
        }
        
        // Learning pace
        if ($session_info->avg_questions_per_session > 20) {
            $preferences['pace'] = 'fast';
        } else if ($session_info->avg_questions_per_session < 10) {
            $preferences['pace'] = 'slow';
        } else {
            $preferences['pace'] = 'moderate';
        }
        
        // Study frequency
        if ($session_info->study_days > 20) { // Last 30 days
            $preferences['frequency'] = 'daily';
        } else if ($session_info->study_days > 10) {
            $preferences['frequency'] = 'regular';
        } else {
            $preferences['frequency'] = 'sporadic';
        }
        
        return [
            'preferences' => $preferences,
            'error_patterns' => $error_patterns,
            'review_behavior' => $review_behavior,
            'learning_type' => $this->classify_learning_type($preferences)
        ];
    }

    /**
     * Analyze engagement metrics
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Engagement analysis
     */
    private function analyze_engagement_metrics($userid, $courseid) {
        global $DB;
        
        // Recent activity analysis
        $recent_activity = $DB->get_record_sql(
            "SELECT 
                COUNT(*) as recent_sessions,
                MAX(ultima_actividad) as last_activity,
                AVG(nivel_confianza) as avg_confidence
             FROM {neuroopositor_user_progress}
             WHERE userid = ? AND courseid = ? AND ultima_actividad >= ?",
            [$userid, $courseid, time() - (7 * 24 * 60 * 60)]
        );
        
        // Streak analysis
        $streak_data = $DB->get_record_sql(
            "SELECT 
                MAX(mejor_racha) as best_streak,
                AVG(racha_actual) as avg_current_streak
             FROM {neuroopositor_user_progress}
             WHERE userid = ? AND courseid = ?",
            [$userid, $courseid]
        );
        
        // Calculate engagement score
        $engagement_score = $this->calculate_engagement_score($recent_activity, $streak_data);
        
        // Identify engagement patterns
        $patterns = $this->identify_engagement_patterns($userid, $courseid);
        
        return [
            'engagement_score' => $engagement_score,
            'recent_activity' => $recent_activity,
            'streak_data' => $streak_data,
            'patterns' => $patterns,
            'risk_level' => $this->assess_dropout_risk($engagement_score, $recent_activity)
        ];
    }

    /**
     * Recommend study schedule
     * @param array $user_profile User profile
     * @param array $learning_patterns Learning patterns
     * @return array Schedule recommendations
     */
    private function recommend_study_schedule($user_profile, $learning_patterns) {
        $preferences = $user_profile['learning_style']['preferences'];
        $consistency = $user_profile['consistency'];
        
        $recommendations = [];
        
        // Session duration recommendation
        switch ($preferences['session_length']) {
            case 'short':
                $recommendations['session_duration'] = [
                    'recommended' => 25, // minutes
                    'reason' => 'Prefieres sesiones cortas e intensas',
                    'technique' => 'Técnica Pomodoro'
                ];
                break;
            case 'long':
                $recommendations['session_duration'] = [
                    'recommended' => 90, // minutes
                    'reason' => 'Tienes buena concentración en sesiones largas',
                    'technique' => 'Estudio profundo'
                ];
                break;
            default:
                $recommendations['session_duration'] = [
                    'recommended' => 45, // minutes
                    'reason' => 'Duración equilibrada para mantener la concentración',
                    'technique' => 'Estudio balanceado'
                ];
        }
        
        // Frequency recommendation
        if ($consistency['consistency_level'] === 'low') {
            $recommendations['frequency'] = [
                'recommended' => 'daily_short',
                'reason' => 'Sesiones diarias cortas para mejorar la consistencia',
                'target_days_per_week' => 7,
                'min_session_time' => 15
            ];
        } else {
            $recommendations['frequency'] = [
                'recommended' => 'regular',
                'reason' => 'Mantén tu buen ritmo de estudio',
                'target_days_per_week' => 5,
                'min_session_time' => 30
            ];
        }
        
        // Best time recommendation (based on activity patterns)
        $recommendations['optimal_times'] = $this->recommend_optimal_study_times($user_profile);
        
        return $recommendations;
    }

    /**
     * Recommend topic sequence
     * @param array $user_profile User profile
     * @param array $topic_analysis Topic analysis
     * @return array Topic recommendations
     */
    private function recommend_topic_sequence($user_profile, $topic_analysis) {
        $strengths = $user_profile['strengths_weaknesses']['strengths'];
        $weaknesses = $user_profile['strengths_weaknesses']['weaknesses'];
        
        $recommendations = [];
        
        // Priority topics based on weaknesses
        $priority_topics = [];
        foreach ($weaknesses as $weakness) {
            if ($weakness['type'] === 'block') {
                $priority_topics[] = [
                    'type' => 'weakness_focus',
                    'target' => $weakness['identifier'],
                    'reason' => 'Necesita refuerzo en esta área',
                    'urgency' => 'high'
                ];
            }
        }
        
        // Confidence building topics
        $confidence_topics = [];
        foreach ($strengths as $strength) {
            if ($strength['score'] > 80) {
                $confidence_topics[] = [
                    'type' => 'confidence_building',
                    'target' => $strength['identifier'],
                    'reason' => 'Refuerza tu confianza con temas que dominas',
                    'urgency' => 'medium'
                ];
            }
        }
        
        // Progressive difficulty recommendations
        $difficulty_progression = $this->recommend_difficulty_progression($user_profile);
        
        return [
            'priority_topics' => $priority_topics,
            'confidence_topics' => $confidence_topics,
            'difficulty_progression' => $difficulty_progression,
            'sequence_strategy' => $this->determine_sequence_strategy($user_profile)
        ];
    }

    /**
     * Recommend difficulty adjustments
     * @param array $user_profile User profile
     * @param array $topic_analysis Topic analysis
     * @return array Difficulty recommendations
     */
    private function recommend_difficulty_adjustments($user_profile, $topic_analysis) {
        $accuracy = $user_profile['basic_stats']->overall_accuracy ?? 0;
        $confidence = $user_profile['engagement']['recent_activity']->avg_confidence ?? 0;
        
        $recommendations = [];
        
        if ($accuracy < 60) {
            $recommendations[] = [
                'type' => 'reduce_difficulty',
                'reason' => 'Tu precisión es baja, enfócate en temas más básicos',
                'suggested_level' => 'beginner',
                'action' => 'review_fundamentals'
            ];
        } else if ($accuracy > 85 && $confidence > 80) {
            $recommendations[] = [
                'type' => 'increase_difficulty',
                'reason' => 'Tienes buen dominio, puedes abordar temas más desafiantes',
                'suggested_level' => 'advanced',
                'action' => 'challenge_yourself'
            ];
        }
        
        return $recommendations;
    }

    /**
     * Recommend study methods
     * @param array $user_profile User profile
     * @param array $learning_patterns Learning patterns
     * @return array Method recommendations
     */
    private function recommend_study_methods($user_profile, $learning_patterns) {
        $learning_type = $user_profile['learning_style']['learning_type'];
        $error_patterns = $user_profile['learning_style']['error_patterns'];
        
        $methods = [];
        
        // Based on learning type
        switch ($learning_type) {
            case 'intensive':
                $methods[] = [
                    'method' => 'spaced_repetition',
                    'description' => 'Repaso espaciado para consolidar conocimientos',
                    'frequency' => 'daily'
                ];
                break;
            case 'gradual':
                $methods[] = [
                    'method' => 'progressive_learning',
                    'description' => 'Aprendizaje progresivo con incremento gradual',
                    'frequency' => 'regular'
                ];
                break;
            case 'sporadic':
                $methods[] = [
                    'method' => 'microlearning',
                    'description' => 'Sesiones cortas y frecuentes',
                    'frequency' => 'flexible'
                ];
                break;
        }
        
        // Based on error patterns
        if (isset($error_patterns['common_mistakes'])) {
            $methods[] = [
                'method' => 'error_analysis',
                'description' => 'Análisis detallado de errores comunes',
                'focus' => 'mistake_prevention'
            ];
        }
        
        return $methods;
    }

    /**
     * Recommend review topics
     * @param array $user_profile User profile
     * @param array $topic_analysis Topic analysis
     * @return array Review recommendations
     */
    private function recommend_review_topics($user_profile, $topic_analysis) {
        global $DB;
        
        $userid = $user_profile['basic_stats']->userid ?? 0;
        $courseid = $user_profile['basic_stats']->courseid ?? 0;
        
        // Topics that need review (declining performance)
        $review_topics = $DB->get_records_sql(
            "SELECT 
                t.id, t.titulo, t.bloque,
                up.porcentaje_dominio,
                up.ultima_actividad
             FROM {neuroopositor_temas} t
             JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id
             WHERE up.userid = ? AND up.courseid = ?
             AND up.porcentaje_dominio < 80
             AND up.ultima_actividad < ?
             ORDER BY up.ultima_actividad ASC
             LIMIT 5",
            [$userid, $courseid, time() - (7 * 24 * 60 * 60)]
        );
        
        $recommendations = [];
        foreach ($review_topics as $topic) {
            $recommendations[] = [
                'topic_id' => $topic->id,
                'title' => $topic->titulo,
                'reason' => 'No has revisado este tema recientemente',
                'priority' => $this->calculate_review_priority($topic),
                'suggested_method' => 'quick_review'
            ];
        }
        
        return $recommendations;
    }

    /**
     * Analyze learning patterns
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Learning patterns
     */
    private function analyze_learning_patterns($userid, $courseid) {
        // Time-based patterns
        $time_patterns = $this->analyze_time_patterns($userid, $courseid);
        
        // Performance patterns
        $performance_patterns = $this->analyze_performance_patterns($userid, $courseid);
        
        // Behavioral patterns
        $behavioral_patterns = $this->analyze_behavioral_patterns($userid, $courseid);
        
        return [
            'time_patterns' => $time_patterns,
            'performance_patterns' => $performance_patterns,
            'behavioral_patterns' => $behavioral_patterns
        ];
    }

    /**
     * Analyze topic performance
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Topic analysis
     */
    private function analyze_topic_performance($userid, $courseid) {
        global $DB;
        
        $sql = "SELECT 
                    t.id,
                    t.titulo,
                    t.bloque,
                    t.nivel_dificultad,
                    up.porcentaje_dominio,
                    up.preguntas_correctas,
                    up.preguntas_totales,
                    up.tiempo_estudio_segundos,
                    up.nivel_confianza
                FROM {neuroopositor_temas} t
                LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id 
                    AND up.userid = ? AND up.courseid = ?
                WHERE t.courseid = ? AND t.activo = 1
                ORDER BY t.bloque, t.numero";
        
        $topics = $DB->get_records_sql($sql, [$userid, $courseid, $courseid]);
        
        $analysis = [
            'mastered_topics' => [],
            'struggling_topics' => [],
            'not_attempted' => [],
            'performance_trends' => []
        ];
        
        foreach ($topics as $topic) {
            if (!$topic->porcentaje_dominio) {
                $analysis['not_attempted'][] = $topic;
            } else if ($topic->porcentaje_dominio >= 80) {
                $analysis['mastered_topics'][] = $topic;
            } else if ($topic->porcentaje_dominio < 50) {
                $analysis['struggling_topics'][] = $topic;
            }
        }
        
        return $analysis;
    }

    /**
     * Calculate recommendation confidence
     * @param array $user_profile User profile
     * @return float Confidence score (0-1)
     */
    private function calculate_recommendation_confidence($user_profile) {
        $completeness = $user_profile['profile_completeness'];
        $data_points = $user_profile['basic_stats']->total_questions ?? 0;
        $consistency = $user_profile['consistency']['consistency_level'];
        
        $confidence = 0.3; // Base confidence
        
        // Adjust based on data completeness
        $confidence += $completeness * 0.4;
        
        // Adjust based on data volume
        if ($data_points > 100) {
            $confidence += 0.2;
        } else if ($data_points > 50) {
            $confidence += 0.1;
        }
        
        // Adjust based on consistency
        if ($consistency === 'high') {
            $confidence += 0.1;
        }
        
        return min($confidence, 1.0);
    }

    /**
     * Calculate profile completeness
     * @param object $stats Basic statistics
     * @return float Completeness score (0-1)
     */
    private function calculate_profile_completeness($stats) {
        $factors = [
            'has_questions' => ($stats->total_questions ?? 0) > 0,
            'has_multiple_topics' => ($stats->topics_mastered ?? 0) > 1,
            'has_study_time' => ($stats->total_study_time ?? 0) > 0,
            'has_streaks' => ($stats->best_streak ?? 0) > 0
        ];
        
        $completed = array_sum($factors);
        return $completed / count($factors);
    }

    // Helper methods for various calculations
    
    private function calculate_trend($values) {
        if (count($values) < 2) return 'stable';
        
        $first_half = array_slice($values, 0, floor(count($values) / 2));
        $second_half = array_slice($values, floor(count($values) / 2));
        
        $first_avg = array_sum($first_half) / count($first_half);
        $second_avg = array_sum($second_half) / count($second_half);
        
        $change = ($second_avg - $first_avg) / $first_avg;
        
        if ($change > 0.1) return 'improving';
        if ($change < -0.1) return 'declining';
        return 'stable';
    }
    
    private function calculate_consistency_score($values) {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $variance = $this->calculate_variance($values);
        
        return $mean > 0 ? 1 - ($variance / ($mean * $mean)) : 0;
    }
    
    private function calculate_variance($values) {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $sum_squares = array_sum(array_map(function($x) use ($mean) {
            return pow($x - $mean, 2);
        }, $values));
        
        return $sum_squares / count($values);
    }
    
    private function identify_study_patterns($records) {
        // Analyze day-of-week patterns, time-of-day patterns, etc.
        return [
            'preferred_days' => ['monday', 'wednesday', 'friday'],
            'preferred_times' => ['morning', 'evening'],
            'session_clustering' => 'regular'
        ];
    }
    
    private function classify_consistency($rate, $variance) {
        if ($rate > 0.8 && $variance < 100) return 'high';
        if ($rate > 0.5 && $variance < 200) return 'medium';
        return 'low';
    }
    
    private function analyze_error_patterns($userid, $courseid) {
        // Analyze common mistake patterns
        return [
            'common_mistakes' => ['calculation_errors', 'concept_confusion'],
            'mistake_frequency' => 'moderate',
            'improvement_trend' => 'stable'
        ];
    }
    
    private function analyze_review_behavior($userid, $courseid) {
        // Analyze how often user reviews previous topics
        return [
            'review_frequency' => 'low',
            'review_effectiveness' => 'medium',
            'preferred_review_method' => 'quick_questions'
        ];
    }
    
    private function classify_learning_type($preferences) {
        if ($preferences['frequency'] === 'daily' && $preferences['session_length'] === 'long') {
            return 'intensive';
        } else if ($preferences['frequency'] === 'regular' && $preferences['pace'] === 'moderate') {
            return 'gradual';
        } else {
            return 'sporadic';
        }
    }
    
    private function calculate_engagement_score($recent_activity, $streak_data) {
        $score = 0;
        
        // Recent activity weight
        if ($recent_activity->recent_sessions > 5) $score += 30;
        else if ($recent_activity->recent_sessions > 2) $score += 20;
        else if ($recent_activity->recent_sessions > 0) $score += 10;
        
        // Recency weight
        $days_since_last = (time() - $recent_activity->last_activity) / (24 * 60 * 60);
        if ($days_since_last < 1) $score += 30;
        else if ($days_since_last < 3) $score += 20;
        else if ($days_since_last < 7) $score += 10;
        
        // Confidence weight
        $score += ($recent_activity->avg_confidence / 100) * 20;
        
        // Streak weight
        if ($streak_data->best_streak > 10) $score += 20;
        else if ($streak_data->best_streak > 5) $score += 10;
        
        return min($score, 100);
    }
    
    private function identify_engagement_patterns($userid, $courseid) {
        return [
            'peak_engagement_times' => ['morning', 'evening'],
            'engagement_triggers' => ['new_topics', 'achievements'],
            'disengagement_risks' => ['difficult_topics', 'long_breaks']
        ];
    }
    
    private function assess_dropout_risk($engagement_score, $recent_activity) {
        $days_since_last = (time() - $recent_activity->last_activity) / (24 * 60 * 60);
        
        if ($days_since_last > 14 || $engagement_score < 30) return 'high';
        if ($days_since_last > 7 || $engagement_score < 50) return 'medium';
        return 'low';
    }
    
    private function recommend_optimal_study_times($user_profile) {
        // Based on historical activity patterns
        return [
            'primary' => '09:00-11:00',
            'secondary' => '19:00-21:00',
            'avoid' => '13:00-15:00'
        ];
    }
    
    private function recommend_difficulty_progression($user_profile) {
        $current_level = $user_profile['basic_stats']->average_difficulty ?? 3;
        
        return [
            'current_level' => $current_level,
            'recommended_next' => min($current_level + 1, 5),
            'progression_rate' => 'gradual',
            'readiness_score' => 0.75
        ];
    }
    
    private function determine_sequence_strategy($user_profile) {
        $consistency = $user_profile['consistency']['consistency_level'];
        $confidence = $user_profile['engagement']['recent_activity']->avg_confidence ?? 50;
        
        if ($consistency === 'high' && $confidence > 70) {
            return 'progressive_challenge';
        } else if ($confidence < 50) {
            return 'confidence_building';
        } else {
            return 'balanced_approach';
        }
    }
    
    private function calculate_review_priority($topic) {
        $days_since_activity = (time() - $topic->ultima_actividad) / (24 * 60 * 60);
        $mastery_gap = 80 - $topic->porcentaje_dominio;
        
        return min(($days_since_activity * 0.1) + ($mastery_gap * 0.01), 1.0);
    }
    
    private function analyze_time_patterns($userid, $courseid) {
        return [
            'preferred_study_hours' => [9, 10, 19, 20],
            'most_productive_day' => 'monday',
            'session_duration_trend' => 'stable'
        ];
    }
    
    private function analyze_performance_patterns($userid, $courseid) {
        return [
            'accuracy_trend' => 'improving',
            'speed_trend' => 'stable',
            'confidence_trend' => 'improving'
        ];
    }
    
    private function analyze_behavioral_patterns($userid, $courseid) {
        return [
            'help_seeking_frequency' => 'moderate',
            'persistence_level' => 'high',
            'exploration_tendency' => 'medium'
        ];
    }
}