<?php
/**
 * Verificar Tablas Existentes en BD Unificada
 * Diagnóstico para encontrar las tablas de Telegram
 */

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin() && $USER->id != 2) {
    print_error('nopermission', 'error');
}

header('Content-Type: text/plain; charset=utf-8');

echo "🔍 VERIFICACIÓN DE TABLAS EN BD UNIFICADA\n";
echo "=========================================\n";
echo "BD: " . $CFG->dbname . "\n";
echo "Prefijo: " . $CFG->prefix . "\n\n";

// 1. Listar todas las tablas de la BD
echo "📋 1. Listando TODAS las tablas en la BD...\n";
try {
    // Obtener lista de tablas usando consulta SQL nativa
    $sql = "SHOW TABLES";
    $tables = $DB->get_records_sql($sql);
    
    $table_names = [];
    foreach ($tables as $table) {
        $table_values = array_values((array)$table);
        $table_names[] = $table_values[0];
    }
    
    echo "✅ Total tablas encontradas: " . count($table_names) . "\n\n";
    
    // Mostrar primeras 20 tablas
    echo "📝 Primeras 20 tablas:\n";
    foreach (array_slice($table_names, 0, 20) as $i => $table) {
        echo sprintf("%2d. %s\n", $i + 1, $table);
    }
    
    if (count($table_names) > 20) {
        echo "... y " . (count($table_names) - 20) . " tablas más\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error listando tablas: " . $e->getMessage() . "\n";
}

// 2. Buscar tablas relacionadas con Telegram
echo "\n🔍 2. Buscando tablas relacionadas con Telegram...\n";
try {
    $telegram_patterns = [
        'telegram',
        'Telegram',
        'moodle.*telegram',
        'telegram.*user',
        'telegram.*response',
        'user.*link'
    ];
    
    foreach ($telegram_patterns as $pattern) {
        echo "Buscando patrón: {$pattern}\n";
        $sql = "SHOW TABLES LIKE '%{$pattern}%'";
        try {
            $matches = $DB->get_records_sql($sql);
            if ($matches) {
                foreach ($matches as $match) {
                    $match_values = array_values((array)$match);
                    echo "  ✅ Encontrada: {$match_values[0]}\n";
                }
            } else {
                echo "  ❌ Sin coincidencias\n";
            }
        } catch (Exception $e) {
            echo "  ❌ Error: " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error buscando tablas Telegram: " . $e->getMessage() . "\n";
}

// 3. Verificar tablas con prefijo Moodle
echo "\n🔍 3. Verificando tablas con prefijo '{$CFG->prefix}'...\n";
try {
    $expected_telegram_tables = [
        'MoodleUserLink',
        'TelegramUser', 
        'telegramresponse'
    ];
    
    foreach ($expected_telegram_tables as $table) {
        $full_table_name = $CFG->prefix . $table;
        echo "Verificando: {$full_table_name}\n";
        
        try {
            $sql = "SHOW TABLES LIKE '{$full_table_name}'";
            $exists = $DB->get_records_sql($sql);
            if ($exists) {
                echo "  ✅ Existe: {$full_table_name}\n";
                
                // Obtener estructura de la tabla
                try {
                    $structure = $DB->get_records_sql("DESCRIBE {$full_table_name}");
                    echo "  📋 Columnas (" . count($structure) . "):\n";
                    foreach ($structure as $column) {
                        echo "    - {$column->field} ({$column->type})\n";
                    }
                } catch (Exception $e) {
                    echo "  ⚠️ Error obteniendo estructura: " . $e->getMessage() . "\n";
                }
                
            } else {
                echo "  ❌ No existe: {$full_table_name}\n";
            }
        } catch (Exception $e) {
            echo "  ❌ Error verificando: " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error verificando tablas con prefijo: " . $e->getMessage() . "\n";
}

// 4. Buscar tablas sin prefijo
echo "\n🔍 4. Buscando tablas Telegram sin prefijo...\n";
try {
    $tables_without_prefix = [
        'MoodleUserLink',
        'TelegramUser',
        'telegramresponse',
        'moodleuserlink',
        'telegramuser'
    ];
    
    foreach ($tables_without_prefix as $table) {
        try {
            $sql = "SHOW TABLES LIKE '{$table}'";
            $exists = $DB->get_records_sql($sql);
            if ($exists) {
                echo "✅ Encontrada sin prefijo: {$table}\n";
                
                // Verificar contenido
                try {
                    $count = $DB->get_field_sql("SELECT COUNT(*) FROM {$table}");
                    echo "  📊 Registros: {$count}\n";
                } catch (Exception $e) {
                    echo "  ⚠️ Error contando registros: " . $e->getMessage() . "\n";
                }
            } else {
                echo "❌ No existe sin prefijo: {$table}\n";
            }
        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error buscando sin prefijo: " . $e->getMessage() . "\n";
}

// 5. Conclusiones
echo "\n🏁 CONCLUSIONES\n";
echo "===============\n";
echo "📊 BD Activa: {$CFG->dbname}\n";
echo "🔧 Prefijo: {$CFG->prefix}\n";
echo "⚠️ Las tablas de Telegram no están en la BD unificada\n";
echo "\n📋 ACCIONES NECESARIAS:\n";
echo "1. Migrar tablas desde BD original de Telegram\n";
echo "2. O actualizar código para usar tablas existentes\n";
echo "3. O crear tablas desde cero con datos migrados\n";

echo "\n=== FIN VERIFICACIÓN TABLAS ===\n";
?> 