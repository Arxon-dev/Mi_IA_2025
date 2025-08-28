<?php
/**
 * Script to purge Moodle language cache
 * This script will clear the language string cache to force reload of language files
 */

// Simple cache purge without requiring full Moodle config
echo "<h2>Purging Language Cache</h2>";

// Try to find and clear language cache directories
$cache_dirs = [
    'moodledata/cache/lang',
    '../moodledata/cache/lang',
    '../../moodledata/cache/lang',
    'cache/lang'
];

$cleared = false;
foreach ($cache_dirs as $dir) {
    if (is_dir($dir)) {
        echo "<p>Found cache directory: $dir</p>";
        
        // Clear cache files
        $files = glob($dir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
                echo "<p>Deleted: " . basename($file) . "</p>";
                $cleared = true;
            }
        }
    }
}

if ($cleared) {
    echo "<p style='color: green; font-weight: bold;'>✓ Language cache cleared successfully!</p>";
    echo "<p>The missing language strings should now be loaded correctly.</p>";
    echo "<p>Please refresh your NeuroOpositor page to see the changes.</p>";
} else {
    echo "<p style='color: orange;'>No cache directories found to clear.</p>";
    echo "<p>The language strings have been added to the English language file.</p>";
    echo "<p>Please try refreshing your NeuroOpositor page.</p>";
}

echo "<hr>";
echo "<h3>What was fixed:</h3>";
echo "<ul>";
echo "<li>Added missing language strings to the English language file</li>";
echo "<li>The placeholders [[studysession]], [[selecttopic]], [[alltopics]], [[legend]], [[view_mode]] should now display correctly</li>";
echo "<li>All other missing strings (recommendedtopics, startsession, study, test, review, etc.) have also been added</li>";
echo "</ul>";

echo "<p><strong>Note:</strong> The issue was that these strings existed in the Spanish language file but were missing from the English language file. Moodle was falling back to English and showing placeholders when the strings weren't found.</p>";
?>