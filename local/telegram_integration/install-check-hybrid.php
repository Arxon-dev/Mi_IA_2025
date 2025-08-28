<?php
/**
 * ML Analytics - Hybrid System Installation Check
 * Verifies that the API bridge system is working correctly
 */

require_once 'ml-analytics-bridge.php';

// Set content type to HTML
header('Content-Type: text/html; charset=UTF-8');

?>
<!DOCTYPE html>
<html>
<head>
    <title>🧠 ML Analytics - Verificación Sistema Híbrido</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status-ok { color: #28a745; font-weight: bold; }
        .status-error { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .error-details { background: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success-details { background: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .info-details { background: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .recommendation { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
        ul { margin: 10px 0; padding-left: 20px; }
        code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 ML Analytics - Verificación Sistema Híbrido</h1>
        <p>Este script verifica que el sistema híbrido (API Bridge) esté funcionando correctamente.</p>

        <?php
        $overall_status = true;
        $bridge = getBridge();

        // 1. Verificación de PHP
        echo '<div class="section">';
        echo '<h2>1. Verificación de PHP</h2>';
        
        $php_version = phpversion();
        if (version_compare($php_version, '7.4', '>=')) {
            echo '<span class="status-ok">✅ PHP Version: ' . $php_version . ' (Compatible)</span>';
        } else {
            echo '<span class="status-error">❌ PHP Version: ' . $php_version . ' (Requiere 7.4+)</span>';
            $overall_status = false;
        }
        echo '</div>';

        // 2. Extensiones de PHP (Solo las necesarias para el sistema híbrido)
        echo '<div class="section">';
        echo '<h2>2. Extensiones de PHP</h2>';
        
        $required_extensions = ['json', 'curl'];
        foreach ($required_extensions as $ext) {
            if (extension_loaded($ext)) {
                echo '<span class="status-ok">✅ ' . strtoupper($ext) . ': Instalado</span><br>';
            } else {
                echo '<span class="status-error">❌ ' . strtoupper($ext) . ': No instalado</span><br>';
                $overall_status = false;
            }
        }
        
        // PostgreSQL no es necesario en el hosting
        echo '<div class="info-details">';
        echo '<strong>ℹ️ Información:</strong> PostgreSQL no es necesario en el hosting. ';
        echo 'El sistema híbrido se conecta a la base de datos a través del servidor local.';
        echo '</div>';
        echo '</div>';

        // 3. Conexión al Servidor Local (API Bridge)
        echo '<div class="section">';
        echo '<h2>3. Conexión al Servidor Local</h2>';
        
        $connection_test = $bridge->testConnection();
        
        if (isset($connection_test['error'])) {
            echo '<span class="status-error">❌ Conexión API Bridge: Falló</span><br>';
            echo '<div class="error-details">';
            echo '<strong>Error:</strong> ' . htmlspecialchars($connection_test['message']) . '<br>';
            echo '</div>';
            
            echo '<div class="recommendation">';
            echo '<strong>Soluciones:</strong><br>';
            echo '<ul>';
            echo '<li>Verifica que el servidor Next.js esté ejecutándose en tu PC</li>';
            echo '<li>Confirma que el puerto esté disponible (3000, 3001, 3002, o 3003)</li>';
            echo '<li>Asegúrate de que no haya firewall bloqueando la conexión</li>';
            echo '<li>Ejecuta <code>npm run dev</code> en el directorio del proyecto</li>';
            echo '</ul>';
            echo '</div>';
            $overall_status = false;
        } elseif (isset($connection_test['status']) && $connection_test['status'] === 'success') {
            echo '<span class="status-ok">✅ Conexión API Bridge: Exitosa</span><br>';
            echo '<div class="success-details">';
            echo '<strong>✅ Servidor local accesible</strong><br>';
            echo '<strong>✅ Base de datos PostgreSQL conectada</strong>';
            echo '</div>';
        } else {
            echo '<span class="status-warning">⚠️ Conexión API Bridge: Estado desconocido</span><br>';
            echo '<div class="error-details">';
            echo '<strong>Respuesta:</strong> ' . htmlspecialchars(json_encode($connection_test));
            echo '</div>';
            $overall_status = false;
        }
        echo '</div>';

        // 4. Permisos de Archivos
        echo '<div class="section">';
        echo '<h2>4. Permisos de Archivos</h2>';
        
        $required_files = [
            'ml-analytics-bridge.php' => 'Cliente API Bridge',
            'ml-analytics-hybrid.php' => 'Proveedor de datos híbrido',
            'analytics.php' => 'Página principal',
            'js/analytics.js' => 'JavaScript del frontend',
            'styles/analytics.css' => 'Estilos CSS'
        ];
        
        foreach ($required_files as $file => $description) {
            if (file_exists($file) && is_readable($file)) {
                echo '<span class="status-ok">✅ ' . $file . ': Existe y es legible</span><br>';
            } else {
                echo '<span class="status-error">❌ ' . $file . ': No encontrado o no legible</span><br>';
                $overall_status = false;
            }
        }
        echo '</div>';

        // 5. Test de Funcionalidad
        echo '<div class="section">';
        echo '<h2>5. Test de Funcionalidad</h2>';
        
        if (!isset($connection_test['error'])) {
            // Test de datos de ejemplo
            $test_user_id = 12345; // ID de prueba
            
            echo '<strong>Probando funciones de análisis:</strong><br>';
            
            // Test predictive analysis
            $predictive = $bridge->getPredictiveData($test_user_id);
            if (!isset($predictive['error'])) {
                echo '<span class="status-ok">✅ Análisis Predictivo: Funcional</span><br>';
            } else {
                echo '<span class="status-warning">⚠️ Análisis Predictivo: ' . htmlspecialchars($predictive['message']) . '</span><br>';
            }
            
            // Test learning metrics
            $learning = $bridge->getLearningMetrics($test_user_id);
            if (!isset($learning['error'])) {
                echo '<span class="status-ok">✅ Métricas de Aprendizaje: Funcional</span><br>';
            } else {
                echo '<span class="status-warning">⚠️ Métricas de Aprendizaje: ' . htmlspecialchars($learning['message']) . '</span><br>';
            }
            
            // Test optimization
            $optimization = $bridge->getOptimizationData($test_user_id);
            if (!isset($optimization['error'])) {
                echo '<span class="status-ok">✅ Análisis de Optimización: Funcional</span><br>';
            } else {
                echo '<span class="status-warning">⚠️ Análisis de Optimización: ' . htmlspecialchars($optimization['message']) . '</span><br>';
            }
            
            // Test social analysis
            $social = $bridge->getSocialData($test_user_id);
            if (!isset($social['error'])) {
                echo '<span class="status-ok">✅ Análisis Social: Funcional</span><br>';
            } else {
                echo '<span class="status-warning">⚠️ Análisis Social: ' . htmlspecialchars($social['message']) . '</span><br>';
            }
            
        } else {
            echo '<span class="status-error">❌ No se pueden probar las funciones sin conexión al servidor</span>';
        }
        echo '</div>';

        // 6. Estado General
        echo '<div class="section">';
        echo '<h2>6. Estado General</h2>';
        
        if ($overall_status && !isset($connection_test['error'])) {
            echo '<span class="status-ok">✅ Sistema: Completamente funcional</span><br>';
            echo '<div class="success-details">';
            echo '<strong>🎉 ¡Perfecto! El sistema de ML Analytics está listo para usar.</strong><br>';
            echo 'Todos los componentes están funcionando correctamente.';
            echo '</div>';
        } elseif ($overall_status) {
            echo '<span class="status-warning">⚠️ Sistema: Parcialmente funcional</span><br>';
            echo '<div class="recommendation">';
            echo '<strong>El sistema básico está configurado, pero hay problemas de conectividad.</strong><br>';
            echo 'Revisa la conexión al servidor local.';
            echo '</div>';
        } else {
            echo '<span class="status-error">❌ Sistema: Requiere configuración</span><br>';
            echo '<div class="error-details">';
            echo '<strong>Hay problemas críticos que deben resolverse.</strong><br>';
            echo 'Revisa los errores anteriores antes de continuar.';
            echo '</div>';
        }
        echo '</div>';

        // 7. Próximos Pasos
        echo '<div class="section">';
        echo '<h2>7. Próximos Pasos</h2>';
        
        if ($overall_status && !isset($connection_test['error'])) {
            echo '<div class="success-details">';
            echo '<strong>Para usar el sistema:</strong><br>';
            echo '<ul>';
            echo '<li>✅ Accede a la página principal de analytics</li>';
            echo '<li>✅ Vincula tu cuenta de Telegram si no lo has hecho</li>';
            echo '<li>✅ Comienza a usar el bot de Telegram regularmente</li>';
            echo '</ul>';
            echo '</div>';
        } else {
            echo '<div class="recommendation">';
            echo '<strong>Para solucionar problemas:</strong><br>';
            echo '<ul>';
            echo '<li>🔧 Corrige cualquier error mostrado arriba</li>';
            echo '<li>🖥️ Asegúrate de que tu servidor Next.js esté ejecutándose</li>';
            echo '<li>🔗 Verifica la conectividad de red</li>';
            echo '<li>📊 Asegúrate de tener datos de usuario en las tablas</li>';
            echo '</ul>';
            echo '</div>';
        }
        
        echo '<div class="info-details">';
        echo '<strong>Para obtener mejores resultados:</strong><br>';
        echo '<ul>';
        echo '<li>📱 Usa el bot de Telegram regularmente</li>';
        echo '<li>📚 Completa sesiones de estudio</li>';
        echo '<li>🎯 Practica diferentes materias</li>';
        echo '<li>📈 Mantén actividad constante</li>';
        echo '</ul>';
        echo '</div>';
        echo '</div>';

        // 8. Información del Sistema
        echo '<div class="section">';
        echo '<h2>8. Información del Sistema</h2>';
        echo '<strong>Arquitectura:</strong> Sistema Híbrido (API Bridge)<br>';
        echo '<strong>Hosting:</strong> PHP + Moodle<br>';
        echo '<strong>Servidor Local:</strong> Next.js + PostgreSQL<br>';
        echo '<strong>Comunicación:</strong> HTTP API<br>';
        echo '<strong>Ventajas:</strong> No requiere PostgreSQL en hosting, datos seguros en local<br>';
        echo '</div>';
        ?>
    </div>
</body>
</html> 