<?php
/**
 * Script para instalar las tablas del plugin NeuroOpositor manualmente
 * 
 * INSTRUCCIONES:
 * 1. Ejecuta este script desde la línea de comandos: php install_neuroopositor_tables.php
 * 2. O accede a él desde el navegador si está en el servidor web
 * 
 * Este script creará todas las tablas necesarias para el plugin NeuroOpositor
 */

require_once('../../config.php');
require_once($CFG->libdir . '/ddllib.php');
require_once($CFG->libdir . '/xmlize.php');

// Verificar permisos de administrador
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Instalación de tablas del plugin NeuroOpositor</h2>";

// Leer el archivo install.xml
$xmlfile = __DIR__ . '/local/neuroopositor/db/install.xml';
if (!file_exists($xmlfile)) {
    die("Error: No se encontró el archivo install.xml en: $xmlfile");
}

$xmlcontent = file_get_contents($xmlfile);
$xmldb = xmlize($xmlcontent);

if (!isset($xmldb['XMLDB']['#']['TABLES'][0]['#']['TABLE'])) {
    die("Error: Estructura XML inválida");
}

$dbman = $DB->get_manager();
$tables_created = 0;
$tables_skipped = 0;

// Procesar cada tabla
foreach ($xmldb['XMLDB']['#']['TABLES'][0]['#']['TABLE'] as $tabledata) {
    $tablename = $tabledata['@']['NAME'];
    
    // Verificar si la tabla ya existe
    if ($dbman->table_exists($tablename)) {
        echo "<p>✓ Tabla '$tablename' ya existe - omitida</p>";
        $tables_skipped++;
        continue;
    }
    
    try {
        // Crear objeto xmldb_table
        $table = new xmldb_table($tablename);
        
        // Agregar campos
        if (isset($tabledata['#']['FIELDS'][0]['#']['FIELD'])) {
            foreach ($tabledata['#']['FIELDS'][0]['#']['FIELD'] as $fielddata) {
                $fieldname = $fielddata['@']['NAME'];
                $fieldtype = constant('XMLDB_TYPE_' . strtoupper($fielddata['@']['TYPE']));
                $fieldlength = isset($fielddata['@']['LENGTH']) ? $fielddata['@']['LENGTH'] : null;
                $fieldnotnull = isset($fielddata['@']['NOTNULL']) && $fielddata['@']['NOTNULL'] === 'true';
                $fieldsequence = isset($fielddata['@']['SEQUENCE']) && $fielddata['@']['SEQUENCE'] === 'true';
                $fielddefault = isset($fielddata['@']['DEFAULT']) ? $fielddata['@']['DEFAULT'] : null;
                $fielddecimals = isset($fielddata['@']['DECIMALS']) ? $fielddata['@']['DECIMALS'] : null;
                
                $field = new xmldb_field($fieldname, $fieldtype, $fieldlength, $fielddecimals, $fieldnotnull, $fieldsequence, $fielddefault);
                $table->add_field($field);
            }
        }
        
        // Agregar claves
        if (isset($tabledata['#']['KEYS'][0]['#']['KEY'])) {
            foreach ($tabledata['#']['KEYS'][0]['#']['KEY'] as $keydata) {
                $keyname = $keydata['@']['NAME'];
                $keytype = constant('XMLDB_KEY_' . strtoupper($keydata['@']['TYPE']));
                $keyfields = explode(',', str_replace(' ', '', $keydata['@']['FIELDS']));
                $reftable = isset($keydata['@']['REFTABLE']) ? $keydata['@']['REFTABLE'] : null;
                $reffields = isset($keydata['@']['REFFIELDS']) ? explode(',', str_replace(' ', '', $keydata['@']['REFFIELDS'])) : null;
                
                $key = new xmldb_key($keyname, $keytype, $keyfields, $reftable, $reffields);
                $table->add_key($key);
            }
        }
        
        // Agregar índices
        if (isset($tabledata['#']['INDEXES'][0]['#']['INDEX'])) {
            foreach ($tabledata['#']['INDEXES'][0]['#']['INDEX'] as $indexdata) {
                $indexname = $indexdata['@']['NAME'];
                $indexunique = isset($indexdata['@']['UNIQUE']) && $indexdata['@']['UNIQUE'] === 'true';
                $indexfields = explode(',', str_replace(' ', '', $indexdata['@']['FIELDS']));
                
                $index = new xmldb_index($indexname, $indexunique ? XMLDB_INDEX_UNIQUE : XMLDB_INDEX_NOTUNIQUE, $indexfields);
                $table->add_index($index);
            }
        }
        
        // Crear la tabla
        $dbman->create_table($table);
        echo "<p>✓ Tabla '$tablename' creada exitosamente</p>";
        $tables_created++;
        
    } catch (Exception $e) {
        echo "<p>✗ Error creando tabla '$tablename': " . $e->getMessage() . "</p>";
    }
}

echo "<h3>Resumen:</h3>";
echo "<p>Tablas creadas: $tables_created</p>";
echo "<p>Tablas omitidas (ya existían): $tables_skipped</p>";
echo "<p><strong>Instalación completada. Ahora puedes usar el plugin NeuroOpositor.</strong></p>";

?>