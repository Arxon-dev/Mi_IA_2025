<?php
// ADVERTENCIA: Este archivo (ml-analytics-mock.php) es solo para pruebas y nunca debe usarse en producción.
// Si se ejecuta en entorno real, devolver error.
if (!empty($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'campus.opomelilla.com') !== false) {
    http_response_code(403);
    echo json_encode(['error' => 'Mock endpoint disabled in production']);
    exit();
}

// Mock ML Analytics API endpoint
// This provides sample data for testing purposes

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';
$userId = $input['userId'] ?? $_GET['userId'] ?? '1';

// Mock data generator
function generateMockData($action, $userId) {
    switch ($action) {
        case 'get_predictive_data':
            // Temas reales del examen de permanencia FAS
            $temas_bloque1 = [
                'Constitución', 'Ley Orgánica 5/2005 Defensa Nacional', 'Régimen Jurídico del Sector Público',
                'Real Decreto 205/2024 Ministerio de Defensa', 'Organización básica de las Fuerzas Armadas',
                'Estado Mayor de la Defensa', 'Ejército de Tierra', 'Armada', 'Ejército del Aire y del Espacio'
            ];
            
            $temas_bloque2 = [
                'Ley 8/2006 Tropa y Marinería', 'Reales Ordenanzas para las FAS', 'Derechos y deberes FAS',
                'Régimen Disciplinario de las FAS', 'Iniciativas y quejas', 'Ley de Igualdad',
                'Observatorio militar para la igualdad', 'Procedimiento Administrativo Común'
            ];
            
            $temas_bloque3 = [
                'Ley 36/2015 Seguridad Nacional', 'PDC-01(B) Doctrina para el empleo de las FAS',
                'Organización de las Naciones Unidas (ONU)', 'OTAN', 'OSCE', 'Unión Europea (UE)',
                'España y Misiones Internacionales'
            ];
            
            $todos_temas = array_merge($temas_bloque1, $temas_bloque2, $temas_bloque3);
            
            // Seleccionar 2-3 temas aleatorios para áreas de riesgo
            $temas_riesgo = array_rand($todos_temas, rand(2, 3));
            $weak_areas = [];
            
            foreach ($temas_riesgo as $index) {
                $tema = $todos_temas[$index];
                $risk_levels = ['low', 'medium', 'high'];
                $risk_level = $risk_levels[array_rand($risk_levels)];
                
                $recommendations = [];
                if (strpos($tema, 'Constitución') !== false) {
                    $recommendations = ['Repasar artículos fundamentales', 'Memorizar estructura del Estado', 'Practicar preguntas sobre derechos fundamentales'];
                } elseif (strpos($tema, 'Ley') !== false || strpos($tema, 'Real Decreto') !== false) {
                    $recommendations = ['Estudiar articulado principal', 'Memorizar fechas de entrada en vigor', 'Repasar modificaciones recientes'];
                } elseif (strpos($tema, 'Organización') !== false) {
                    $recommendations = ['Estudiar organigramas', 'Memorizar jerarquías', 'Repasar competencias y funciones'];
                } elseif (strpos($tema, 'OTAN') !== false || strpos($tema, 'ONU') !== false || strpos($tema, 'UE') !== false) {
                    $recommendations = ['Estudiar estructura organizativa', 'Memorizar países miembros', 'Repasar misiones y objetivos'];
                } else {
                    $recommendations = ['Repasar conceptos clave', 'Memorizar definiciones importantes', 'Practicar con casos prácticos'];
                }
                
                $weak_areas[] = [
                    'subject' => $tema,
                    'risk_level' => $risk_level,
                    'confidence' => round(rand(60, 90) / 100, 2),
                    'recommendations' => array_slice($recommendations, 0, rand(2, 3))
                ];
            }
            
            return [
                'success_probability' => rand(65, 95),
                'weak_areas' => $weak_areas,
                'recommendations' => [
                    'Dedica 45 minutos diarios a repasar normativa militar',
                    'Usa técnicas de memorización para fechas y números de leyes',
                    'Realiza simulacros de examen cada 2 días',
                    'Enfócate en los bloques con mayor peso en el examen',
                    'Repasa diariamente la Constitución y las Reales Ordenanzas'
                ]
            ];
            
        case 'get_learning_metrics':
            $knowledge_gaps_pool = [
                'Artículos de la Constitución Española',
                'Estructura del Ministerio de Defensa',
                'Jerarquía militar y rangos',
                'Procedimientos disciplinarios',
                'Derechos y deberes del personal militar',
                'Organización de la OTAN',
                'Misiones internacionales de España',
                'Reales Ordenanzas para las FAS',
                'Ley de Igualdad en las FAS',
                'Seguridad Nacional y Defensa'
            ];
            
            $selected_gaps = array_rand($knowledge_gaps_pool, rand(3, 5));
            $knowledge_gaps = [];
            foreach ($selected_gaps as $index) {
                $knowledge_gaps[] = $knowledge_gaps_pool[$index];
            }
            
            return [
                'retention_curve' => [
                    ['day' => 1, 'retention' => rand(90, 98)],
                    ['day' => 3, 'retention' => rand(75, 85)],
                    ['day' => 7, 'retention' => rand(65, 75)],
                    ['day' => 14, 'retention' => rand(55, 65)],
                    ['day' => 30, 'retention' => rand(40, 55)]
                ],
                'learning_efficiency' => round(rand(70, 90) / 100, 2),
                'knowledge_gaps' => $knowledge_gaps,
                'study_consistency' => round(rand(75, 95) / 100, 2)
            ];
            
        case 'get_optimization_data':
            return [
                'optimal_schedule' => [
                    ['hour' => 9, 'performance' => 0.92, 'recommended' => true],
                    ['hour' => 14, 'performance' => 0.85, 'recommended' => true],
                    ['hour' => 19, 'performance' => 0.78, 'recommended' => false],
                    ['hour' => 22, 'performance' => 0.65, 'recommended' => false]
                ],
                'break_recommendations' => [
                    'Descanso de 15 min cada hora de estudio',
                    'Descanso largo de 30 min cada 3 horas',
                    'Ejercicio físico entre sesiones de estudio',
                    'Alternar entre bloques temáticos para mantener la concentración',
                    'Realizar repasos rápidos de 5 min cada 30 min'
                ],
                'study_duration_optimal' => 90, // minutes
                'focus_score' => 0.82
            ];
            
        case 'get_social_data':
            return [
                'performance_percentile' => rand(70, 95),
                'study_group_matches' => [
                    [
                        'compatibility' => round(rand(80, 95) / 100, 2),
                        'shared_subjects' => ['Bloque 1 - Organización', 'Constitución Española'],
                        'study_time_overlap' => round(rand(70, 85) / 100, 2),
                        'anonymous_id' => 'Opositor_' . rand(100, 999)
                    ],
                    [
                        'compatibility' => round(rand(75, 90) / 100, 2),
                        'shared_subjects' => ['Bloque 2 - Jurídico-Social', 'Régimen Disciplinario FAS'],
                        'study_time_overlap' => round(rand(65, 80) / 100, 2),
                        'anonymous_id' => 'Opositor_' . rand(100, 999)
                    ],
                    [
                        'compatibility' => round(rand(70, 85) / 100, 2),
                        'shared_subjects' => ['Bloque 3 - Seguridad Nacional', 'OTAN y Organizaciones Internacionales'],
                        'study_time_overlap' => round(rand(60, 75) / 100, 2),
                        'anonymous_id' => 'Opositor_' . rand(100, 999)
                    ]
                ],
                'peer_comparison' => [
                    'average_score' => 75,
                    'your_score' => rand(80, 95),
                    'top_10_percent' => rand(85, 98)
                ],
                'collaboration_suggestions' => [
                    'Únete a grupos de estudio de normativa militar',
                    'Participa en debates sobre organización de las FAS',
                    'Forma equipo para simulacros de examen',
                    'Colabora en el repaso de la Constitución Española',
                    'Organiza sesiones de estudio sobre Seguridad Nacional'
                ]
            ];
            
        default:
            return ['error' => 'Invalid action'];
    }
}

// Generate and return mock data
$response = generateMockData($action, $userId);
echo json_encode($response, JSON_PRETTY_PRINT);
?>