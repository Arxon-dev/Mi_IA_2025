<?php
// Script de diagnóstico de sintaxis para externallib.php
require_once(dirname(__FILE__) . '/config.php');

echo "<h2>Diagnóstico de Sintaxis - externallib.php</h2>";

// Verificar si el archivo existe
$file_path = $CFG->dirroot . '/local/opomoodletools/externallib.php';
echo "<p>Verificando archivo: $file_path</p>";

if (!file_exists($file_path)) {
    echo "<p style='color: red;'>ERROR: El archivo no existe</p>";
    exit;
}

echo "<p style='color: green;'>✓ Archivo encontrado</p>";

// Leer el contenido del archivo
$content = file_get_contents($file_path);
echo "<p>Tamaño del archivo: " . strlen($content) . " bytes</p>";

// Verificar sintaxis PHP básica
echo "<h3>1. Verificación de sintaxis PHP</h3>";
$temp_file = tempnam(sys_get_temp_dir(), 'syntax_check');
file_put_contents($temp_file, $content);

$output = array();
$return_var = 0;
exec("php -l \"$temp_file\" 2>&1", $output, $return_var);

if ($return_var === 0) {
    echo "<p style='color: green;'>✓ Sintaxis PHP válida</p>";
} else {
    echo "<p style='color: red;'>✗ Error de sintaxis PHP:</p>";
    echo "<pre>" . implode("\n", $output) . "</pre>";
}

unlink($temp_file);

// Contar llaves de apertura y cierre
echo "<h3>2. Análisis de llaves</h3>";
$open_braces = substr_count($content, '{');
$close_braces = substr_count($content, '}');
echo "<p>Llaves de apertura '{': $open_braces</p>";
echo "<p>Llaves de cierre '}': $close_braces</p>";

if ($open_braces === $close_braces) {
    echo "<p style='color: green;'>✓ Llaves balanceadas</p>";
} else {
    echo "<p style='color: red;'>✗ Llaves desbalanceadas (diferencia: " . ($open_braces - $close_braces) . ")</p>";
}

// Buscar funciones públicas fuera de clase
echo "<h3>3. Análisis de funciones públicas</h3>";
$lines = explode("\n", $content);
$in_class = false;
$class_brace_count = 0;
$public_functions_outside_class = array();

for ($i = 0; $i < count($lines); $i++) {
    $line = trim($lines[$i]);
    $line_number = $i + 1;
    
    // Detectar inicio de clase
    if (preg_match('/^class\s+\w+/', $line)) {
        $in_class = true;
        $class_brace_count = 0;
        echo "<p>Línea $line_number: Inicio de clase detectado</p>";
    }
    
    // Contar llaves dentro de la clase
    if ($in_class) {
        $class_brace_count += substr_count($line, '{');
        $class_brace_count -= substr_count($line, '}');
        
        // Si las llaves se balancean, hemos salido de la clase
        if ($class_brace_count < 0) {
            $in_class = false;
            echo "<p>Línea $line_number: Fin de clase detectado</p>";
        }
    }
    
    // Buscar funciones públicas
    if (preg_match('/^public\s+static\s+function\s+(\w+)/', $line, $matches)) {
        if (!$in_class) {
            $public_functions_outside_class[] = array(
                'line' => $line_number,
                'function' => $matches[1],
                'content' => $line
            );
        }
        echo "<p>Línea $line_number: Función pública '" . $matches[1] . "' - " . ($in_class ? "DENTRO" : "FUERA") . " de clase</p>";
    }
}

if (empty($public_functions_outside_class)) {
    echo "<p style='color: green;'>✓ Todas las funciones públicas están dentro de clases</p>";
} else {
    echo "<p style='color: red;'>✗ Funciones públicas fuera de clase encontradas:</p>";
    foreach ($public_functions_outside_class as $func) {
        echo "<p style='margin-left: 20px;'>Línea {$func['line']}: {$func['function']}</p>";
    }
}

// Intentar incluir el archivo paso a paso
echo "<h3>4. Prueba de inclusión</h3>";
try {
    // Verificar si ya está incluido
    if (class_exists('local_opomoodletools_external', false)) {
        echo "<p style='color: orange;'>⚠ La clase ya está cargada en memoria</p>";
    } else {
        echo "<p>Intentando incluir el archivo...</p>";
        require_once($file_path);
        
        if (class_exists('local_opomoodletools_external')) {
            echo "<p style='color: green;'>✓ Clase cargada exitosamente</p>";
            
            // Verificar métodos de la clase
            $reflection = new ReflectionClass('local_opomoodletools_external');
            $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC | ReflectionMethod::IS_STATIC);
            echo "<p>Métodos públicos estáticos encontrados: " . count($methods) . "</p>";
            foreach ($methods as $method) {
                echo "<p style='margin-left: 20px;'>- " . $method->getName() . "</p>";
            }
        } else {
            echo "<p style='color: red;'>✗ La clase no se pudo cargar</p>";
        }
    }
} catch (ParseError $e) {
    echo "<p style='color: red;'>✗ Error de sintaxis al incluir:</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
    echo "<p>Línea: " . $e->getLine() . "</p>";
    echo "<p>Archivo: " . $e->getFile() . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error general:</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}

echo "<h3>Diagnóstico completado</h3>";
?>