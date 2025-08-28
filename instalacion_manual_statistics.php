<?php
// Script de instalación manual paso a paso para statistics.php
// Alternativa cuando la instalación automática falla

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Instalación Manual de Statistics.php</h1>";
echo "<p>Este script te guía paso a paso para instalar manualmente la corrección</p>";
echo "<hr>";

// Obtener parámetro de acción
$action = optional_param('action', '', PARAM_TEXT);

// Definir rutas
$source = $CFG->dirroot . '/local/neuroopositor/classes/statistics_solucion_completa.php';
$target = $CFG->dirroot . '/local/neuroopositor/classes/statistics.php';
$backup_dir = $CFG->dirroot . '/local/neuroopositor/classes/backups/';

// Crear directorio de backups si no existe
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

if ($action === '') {
    // Mostrar estado actual y opciones
    echo "<h2>Estado Actual del Sistema</h2>";
    
    echo "<h3>1. Verificación de Archivos</h3>";
    
    // Verificar archivo fuente (corregido)
    if (file_exists($source)) {
        echo "✓ <span style='color: green;'>Archivo corregido disponible:</span> statistics_solucion_completa.php<br>";
        echo "&nbsp;&nbsp;Tamaño: " . filesize($source) . " bytes<br>";
        echo "&nbsp;&nbsp;Modificado: " . date('Y-m-d H:i:s', filemtime($source)) . "<br>";
    } else {
        echo "✗ <span style='color: red;'>Archivo corregido NO encontrado</span><br>";
        echo "<p><strong>Acción requerida:</strong> Ejecuta primero 'solucion_completa_statistics.php'</p>";
        echo "<a href='solucion_completa_statistics.php' style='background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Ejecutar Diagnóstico y Corrección</a>";
        exit;
    }
    
    // Verificar archivo actual
    if (file_exists($target)) {
        echo "✓ <span style='color: green;'>Archivo actual existe:</span> statistics.php<br>";
        echo "&nbsp;&nbsp;Tamaño: " . filesize($target) . " bytes<br>";
        echo "&nbsp;&nbsp;Modificado: " . date('Y-m-d H:i:s', filemtime($target)) . "<br>";
        
        // Verificar si ya está corregido
        $current_content = file_get_contents($target);
        $corrected_content = file_get_contents($source);
        
        if (md5($current_content) === md5($corrected_content)) {
            echo "<div style='background: #e8f5e8; padding: 15px; border: 1px solid #4CAF50; margin: 10px 0;'>";
            echo "<h3>✓ El archivo ya está actualizado</h3>";
            echo "<p>El archivo statistics.php actual es idéntico a la versión corregida.</p>";
            echo "<a href='../index.php?courseid=0&action=statistics' style='background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Probar Statistics</a>";
            echo "</div>";
            exit;
        }
        
    } else {
        echo "⚠ <span style='color: orange;'>Archivo actual NO existe:</span> statistics.php<br>";
    }
    
    echo "<h3>2. Permisos del Directorio</h3>";
    
    $target_dir = dirname($target);
    if (is_writable($target_dir)) {
        echo "✓ <span style='color: green;'>Directorio escribible:</span> {$target_dir}<br>";
    } else {
        echo "✗ <span style='color: red;'>Directorio NO escribible:</span> {$target_dir}<br>";
        echo "<p><strong>Solución:</strong> Contacta al administrador para ajustar permisos</p>";
    }
    
    echo "<h3>3. Backups Existentes</h3>";
    
    $backups = glob($backup_dir . 'statistics_backup_*.php');
    if (!empty($backups)) {
        echo "<p>Backups encontrados:</p>";
        echo "<ul>";
        foreach ($backups as $backup_file) {
            $backup_name = basename($backup_file);
            $backup_date = date('Y-m-d H:i:s', filemtime($backup_file));
            echo "<li>{$backup_name} - {$backup_date}</li>";
        }
        echo "</ul>";
    } else {
        echo "<p>No hay backups previos</p>";
    }
    
    echo "<hr>";
    
    echo "<h2>Opciones de Instalación</h2>";
    
    echo "<div style='display: flex; gap: 20px; flex-wrap: wrap;'>";
    
    // Opción 1: Instalación automática
    echo "<div style='border: 1px solid #ddd; padding: 20px; border-radius: 5px; flex: 1; min-width: 300px;'>";
    echo "<h3>Opción 1: Instalación Automática</h3>";
    echo "<p>Instala automáticamente con backup del archivo actual</p>";
    echo "<p><strong>Recomendado para:</strong> Usuarios con permisos de escritura</p>";
    echo "<a href='?action=auto_install' style='background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Instalar Automáticamente</a>";
    echo "</div>";
    
    // Opción 2: Descarga manual
    echo "<div style='border: 1px solid #ddd; padding: 20px; border-radius: 5px; flex: 1; min-width: 300px;'>";
    echo "<h3>Opción 2: Descarga Manual</h3>";
    echo "<p>Descarga el archivo corregido para subirlo manualmente</p>";
    echo "<p><strong>Recomendado para:</strong> Instalaciones con restricciones de permisos</p>";
    echo "<a href='?action=download' style='background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Descargar Archivo</a>";
    echo "</div>";
    
    // Opción 3: Ver diferencias
    echo "<div style='border: 1px solid #ddd; padding: 20px; border-radius: 5px; flex: 1; min-width: 300px;'>";
    echo "<h3>Opción 3: Ver Diferencias</h3>";
    echo "<p>Compara el archivo actual con la versión corregida</p>";
    echo "<p><strong>Útil para:</strong> Revisar qué cambios se aplicarán</p>";
    echo "<a href='?action=compare' style='background: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Ver Diferencias</a>";
    echo "</div>";
    
    echo "</div>";
    
} elseif ($action === 'auto_install') {
    
    echo "<h2>Instalación Automática</h2>";
    
    // Crear backup
    if (file_exists($target)) {
        $backup_file = $backup_dir . 'statistics_backup_' . date('Y-m-d_H-i-s') . '.php';
        
        if (copy($target, $backup_file)) {
            echo "✓ <span style='color: green;'>Backup creado:</span> " . basename($backup_file) . "<br>";
        } else {
            echo "✗ <span style='color: red;'>Error al crear backup</span><br>";
            echo "<p>No se puede continuar sin backup. <a href='?'>Volver</a></p>";
            exit;
        }
    }
    
    // Instalar archivo corregido
    if (copy($source, $target)) {
        echo "✓ <span style='color: green;'>Archivo instalado exitosamente</span><br>";
        
        echo "<div style='background: #e8f5e8; padding: 20px; border: 2px solid #4CAF50; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>✓ Instalación Completada</h3>";
        echo "<p>El archivo statistics.php ha sido actualizado con las correcciones.</p>";
        echo "<a href='../index.php?courseid=0&action=statistics' style='background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Probar Statistics</a>";
        echo "</div>";
        
    } else {
        echo "✗ <span style='color: red;'>Error al instalar archivo</span><br>";
        echo "<p>Intenta con la opción de descarga manual. <a href='?'>Volver</a></p>";
    }
    
} elseif ($action === 'download') {
    
    // Forzar descarga del archivo corregido
    if (file_exists($source)) {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="statistics.php"');
        header('Content-Length: ' . filesize($source));
        readfile($source);
        exit;
    } else {
        echo "<h2>Error en Descarga</h2>";
        echo "<p>El archivo corregido no está disponible.</p>";
        echo "<a href='?'>Volver</a>";
    }
    
} elseif ($action === 'compare') {
    
    echo "<h2>Comparación de Archivos</h2>";
    
    if (file_exists($target)) {
        $current_content = file_get_contents($target);
        $corrected_content = file_get_contents($source);
        
        echo "<h3>Información de Archivos</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Archivo</th><th>Tamaño</th><th>Líneas</th><th>Modificado</th></tr>";
        echo "<tr>";
        echo "<td>statistics.php (actual)</td>";
        echo "<td>" . filesize($target) . " bytes</td>";
        echo "<td>" . substr_count($current_content, "\n") . " líneas</td>";
        echo "<td>" . date('Y-m-d H:i:s', filemtime($target)) . "</td>";
        echo "</tr>";
        echo "<tr>";
        echo "<td>statistics.php (corregido)</td>";
        echo "<td>" . filesize($source) . " bytes</td>";
        echo "<td>" . substr_count($corrected_content, "\n") . " líneas</td>";
        echo "<td>" . date('Y-m-d H:i:s', filemtime($source)) . "</td>";
        echo "</tr>";
        echo "</table>";
        
        // Mostrar diferencias principales
        echo "<h3>Principales Diferencias Identificadas</h3>";
        echo "<ul>";
        echo "<li><strong>Columna 'nombre' → 'titulo'</strong> en neuroopositor_temas</li>";
        echo "<li><strong>Columna 'correct' → 'preguntas_correctas'</strong> en neuroopositor_user_progress</li>";
        echo "<li><strong>Columna 'time_spent' → 'tiempo_estudio_segundos'</strong> en neuroopositor_user_progress</li>";
        echo "<li><strong>Corrección de warnings</strong> en función round()</li>";
        echo "</ul>";
        
        if (md5($current_content) === md5($corrected_content)) {
            echo "<div style='background: #e8f5e8; padding: 15px; border: 1px solid #4CAF50;'>";
            echo "<h4>✓ Los archivos son idénticos</h4>";
            echo "<p>No se requieren cambios.</p>";
            echo "</div>";
        } else {
            echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffc107;'>";
            echo "<h4>⚠ Los archivos son diferentes</h4>";
            echo "<p>Se recomienda aplicar la actualización.</p>";
            echo "<a href='?action=auto_install' style='background: #4CAF50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 3px;'>Instalar Ahora</a>";
            echo "</div>";
        }
        
    } else {
        echo "<p>No existe archivo actual para comparar.</p>";
    }
    
    echo "<p><a href='?'>← Volver a opciones</a></p>";
}

echo "<hr>";
echo "<p><strong>Proceso ejecutado:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Usuario:</strong> {$USER->username} (ID: {$USER->id})</p>";

?>