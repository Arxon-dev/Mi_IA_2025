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
 * NeuroOpositor neural map view.
 *
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Neural map header
echo html_writer::start_div('neuroopositor-neuralmap-header');
echo html_writer::tag('h2', get_string('neuralmap_title', 'local_neuroopositor'));
echo html_writer::tag('p', get_string('neuralmap_description', 'local_neuroopositor'), array('class' => 'text-muted'));
echo html_writer::end_div();

// Controls panel
echo html_writer::start_div('neuroopositor-controls card mb-3');
echo html_writer::start_div('card-body');
echo html_writer::start_div('row align-items-center');

// View mode controls
echo html_writer::start_div('col-md-4');
echo html_writer::tag('label', get_string('view_mode', 'local_neuroopositor') . ':', array('class' => 'form-label'));
echo html_writer::start_div('btn-group', array('role' => 'group'));
echo html_writer::tag('button', '2D', array(
    'type' => 'button',
    'class' => 'btn btn-outline-primary active',
    'id' => 'view-2d-btn',
    'onclick' => 'NeuroMap.switchTo2D()'
));

if ($templatedata['enable3d'] && $templatedata['can_view_3d']) {
    echo html_writer::tag('button', '3D', array(
        'type' => 'button',
        'class' => 'btn btn-outline-primary',
        'id' => 'view-3d-btn',
        'onclick' => 'NeuroMap.switchTo3D()'
    ));
}
echo html_writer::end_div();
echo html_writer::end_div();

// Filter controls
echo html_writer::start_div('col-md-4');
echo html_writer::tag('label', get_string('connection_strength', 'local_neuroopositor') . ':', array('class' => 'form-label'));
echo html_writer::tag('input', '', array(
    'type' => 'range',
    'class' => 'form-range',
    'id' => 'connection-threshold',
    'min' => '0',
    'max' => '1',
    'step' => '0.1',
    'value' => '0.3',
    'oninput' => 'NeuroMap.updateConnectionThreshold(this.value)'
));
echo html_writer::tag('small', '<span id="threshold-value">0.3</span>', array('class' => 'text-muted'));
echo html_writer::end_div();

// Legend toggle
echo html_writer::start_div('col-md-4 text-end');
echo html_writer::tag('button', get_string('legend', 'local_neuroopositor'), array(
    'type' => 'button',
    'class' => 'btn btn-outline-secondary',
    'id' => 'toggle-legend-btn',
    'onclick' => 'NeuroMap.toggleLegend()'
));
echo html_writer::tag('button', get_string('reset_view', 'local_neuroopositor'), array(
    'type' => 'button',
    'class' => 'btn btn-outline-info',
    'onclick' => 'NeuroMap.resetView()'
));
echo html_writer::end_div();

echo html_writer::end_div(); // row
echo html_writer::end_div(); // card-body
echo html_writer::end_div(); // card

// Main neural map container
echo html_writer::start_div('neuroopositor-neuralmap-container');
echo html_writer::start_div('row');

// Neural map visualization
echo html_writer::start_div('col-md-9');
echo html_writer::start_div('card');
echo html_writer::start_div('card-body p-0');

// 2D Neural map canvas
echo html_writer::div('', 'neural-map-2d', array(
    'id' => 'neural-map-2d',
    'style' => 'width: 100%; height: 600px; position: relative;'
));

// 3D Neural map canvas (hidden by default)
if ($templatedata['enable3d'] && $templatedata['can_view_3d']) {
    echo html_writer::div('', 'neural-map-3d', array(
        'id' => 'neural-map-3d',
        'style' => 'width: 100%; height: 600px; display: none;'
    ));
}

// Loading indicator
echo html_writer::start_div('neural-map-loading text-center', array('id' => 'neural-map-loading'));
echo html_writer::tag('div', '', array('class' => 'spinner-border text-primary', 'role' => 'status'));
echo html_writer::tag('p', 'Loading neural map...', array('class' => 'mt-2'));
echo html_writer::end_div();

echo html_writer::end_div(); // card-body
echo html_writer::end_div(); // card
echo html_writer::end_div(); // col-md-9

// Sidebar with details and legend
echo html_writer::start_div('col-md-3');

// Node details panel
echo html_writer::start_div('card mb-3');
echo html_writer::start_div('card-header');
echo html_writer::tag('h5', get_string('node_details', 'local_neuroopositor'));
echo html_writer::end_div();
echo html_writer::start_div('card-body', array('id' => 'node-details-panel'));
echo html_writer::tag('p', 'Click on a node to see details', array('class' => 'text-muted'));
echo html_writer::end_div();
echo html_writer::end_div();

// Legend panel
echo html_writer::start_div('card mb-3', array('id' => 'legend-panel'));
echo html_writer::start_div('card-header');
echo html_writer::tag('h5', get_string('legend', 'local_neuroopositor'));
echo html_writer::end_div();
echo html_writer::start_div('card-body');

// Node types legend
echo html_writer::tag('h6', get_string('themes', 'local_neuroopositor'));
echo html_writer::start_tag('ul', array('class' => 'list-unstyled'));
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-node mastered') . ' ' . get_string('mastery_level', 'local_neuroopositor') . ' ≥ 80%';
echo html_writer::end_tag('li');
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-node intermediate') . ' ' . get_string('mastery_level', 'local_neuroopositor') . ' 40-79%';
echo html_writer::end_tag('li');
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-node beginner') . ' ' . get_string('mastery_level', 'local_neuroopositor') . ' < 40%';
echo html_writer::end_tag('li');
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-node unexplored') . ' Not explored';
echo html_writer::end_tag('li');
echo html_writer::end_tag('ul');

// Connection types legend
echo html_writer::tag('h6', get_string('connections', 'local_neuroopositor'), array('class' => 'mt-3'));
echo html_writer::start_tag('ul', array('class' => 'list-unstyled'));
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-connection strong') . ' Strong connection (≥ 0.7)';
echo html_writer::end_tag('li');
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-connection medium') . ' Medium connection (0.4-0.6)';
echo html_writer::end_tag('li');
echo html_writer::start_tag('li');
echo html_writer::span('', 'legend-connection weak') . ' Weak connection (< 0.4)';
echo html_writer::end_tag('li');
echo html_writer::end_tag('ul');

echo html_writer::end_div();
echo html_writer::end_div();

// Neural path recommendations
if ($templatedata['enableai'] && $templatedata['can_use_advanced_ai']) {
    echo html_writer::start_div('card');
    echo html_writer::start_div('card-header');
    echo html_writer::tag('h5', get_string('recommended_path', 'local_neuroopositor'));
    echo html_writer::end_div();
    echo html_writer::start_div('card-body');
    
    // Path type selector
    echo html_writer::tag('label', 'Path Type:', array('class' => 'form-label'));
    echo html_writer::start_tag('select', array(
        'class' => 'form-select mb-3',
        'id' => 'path-type-selector',
        'onchange' => 'NeuroMap.updateRecommendedPath(this.value)'
    ));
    echo html_writer::tag('option', get_string('path_type_optimal', 'local_neuroopositor'), array('value' => 'optima'));
    echo html_writer::tag('option', get_string('path_type_reinforcement', 'local_neuroopositor'), array('value' => 'refuerzo'));
    echo html_writer::tag('option', get_string('path_type_exploration', 'local_neuroopositor'), array('value' => 'exploracion'));
    echo html_writer::end_tag('select');
    
    // Recommended path list
    echo html_writer::div('', 'recommended-path-list', array('id' => 'recommended-path-list'));
    
    echo html_writer::end_div();
    echo html_writer::end_div();
}

echo html_writer::end_div(); // col-md-3
echo html_writer::end_div(); // row
echo html_writer::end_div(); // neuroopositor-neuralmap-container

// Neural map JavaScript initialization
echo html_writer::start_tag('script');
echo "\n// Neural Map functionality\n";
echo "var NeuroMap = {\n";
echo "    currentView: '2d',\n";
echo "    neuralData: " . json_encode($neural_map) . ",\n";
echo "    progressData: " . json_encode($progress_data) . ",\n";
echo "    connectionStrengths: " . json_encode($connection_strengths) . ",\n";
echo "    \n";
echo "    init: function() {\n";
echo "        this.initializeMap();\n";
echo "        this.bindEvents();\n";
echo "    },\n";
echo "    \n";
echo "    initializeMap: function() {\n";
echo "        // Hide loading indicator\n";
echo "        document.getElementById('neural-map-loading').style.display = 'none';\n";
echo "        \n";
echo "        // Initialize 2D map\n";
echo "        this.init2DMap();\n";
echo "        \n";
echo "        // Initialize 3D map if enabled\n";
echo "        if (window.NeuroOpositor && window.NeuroOpositor.config && window.NeuroOpositor.config.enable3d && window.NeuroOpositor.config.can_view_3d) {\n";
echo "            this.init3DMap();\n";
echo "        }\n";
echo "    },\n";
echo "    \n";
echo "    init2DMap: function() {\n";
echo "        // 2D visualization using D3.js or similar\n";
echo "        console.log('Initializing 2D neural map');\n";
echo "        // Implementation would go here\n";
echo "    },\n";
echo "    \n";
echo "    init3DMap: function() {\n";
echo "        // 3D visualization using Three.js\n";
echo "        console.log('Initializing 3D neural map');\n";
echo "        // Implementation would go here\n";
echo "    },\n";
echo "    \n";
echo "    switchTo2D: function() {\n";
echo "        this.currentView = '2d';\n";
echo "        document.getElementById('neural-map-2d').style.display = 'block';\n";
echo "        if (document.getElementById('neural-map-3d')) {\n";
echo "            document.getElementById('neural-map-3d').style.display = 'none';\n";
echo "        }\n";
echo "        if (document.getElementById('view-2d-btn')) {\n";
echo "            document.getElementById('view-2d-btn').classList.add('active');\n";
echo "        }\n";
echo "        if (document.getElementById('view-3d-btn')) {\n";
echo "            document.getElementById('view-3d-btn').classList.remove('active');\n";
echo "        }\n";
echo "    },\n";
echo "    \n";
echo "    switchTo3D: function() {\n";
echo "        if (!window.NeuroOpositor || !window.NeuroOpositor.config || !window.NeuroOpositor.config.enable3d || !window.NeuroOpositor.config.can_view_3d) return;\n";
echo "        this.currentView = '3d';\n";
echo "        document.getElementById('neural-map-2d').style.display = 'none';\n";
echo "        if (document.getElementById('neural-map-3d')) {\n";
echo "            document.getElementById('neural-map-3d').style.display = 'block';\n";
echo "        }\n";
echo "        if (document.getElementById('view-2d-btn')) {\n";
echo "            document.getElementById('view-2d-btn').classList.remove('active');\n";
echo "        }\n";
echo "        if (document.getElementById('view-3d-btn')) {\n";
echo "            document.getElementById('view-3d-btn').classList.add('active');\n";
echo "        }\n";
echo "    },\n";
echo "    \n";
echo "    updateConnectionThreshold: function(value) {\n";
echo "        if (document.getElementById('threshold-value')) {\n";
echo "            document.getElementById('threshold-value').textContent = value;\n";
echo "        }\n";
echo "        // Update visualization based on threshold\n";
echo "        console.log('Updating connection threshold to:', value);\n";
echo "    },\n";
echo "    \n";
echo "    toggleLegend: function() {\n";
echo "        var legend = document.getElementById('legend-panel');\n";
echo "        if (legend) {\n";
echo "            legend.style.display = legend.style.display === 'none' ? 'block' : 'none';\n";
echo "        }\n";
echo "    },\n";
echo "    \n";
echo "    resetView: function() {\n";
echo "        console.log('Resetting view');\n";
echo "        // Reset zoom and pan\n";
echo "    },\n";
echo "    \n";
echo "    updateRecommendedPath: function(pathType) {\n";
echo "        console.log('Updating recommended path:', pathType);\n";
echo "        // Fetch and display recommended path\n";
echo "    },\n";
echo "    \n";
echo "    bindEvents: function() {\n";
echo "        // Bind mouse and keyboard events\n";
echo "        console.log('Binding neural map events');\n";
echo "    }\n";
echo "};\n";
echo "\n// Initialize neural map when NeuroOpositor is ready\n";
echo "function initNeuroMapWhenReady() {\n";
echo "    if (window.NeuroOpositor && window.NeuroOpositor.config && window.NeuroOpositor.config.action === 'neuralmap') {\n";
echo "        NeuroMap.init();\n";
echo "    } else {\n";
echo "        // Wait a bit more and try again\n";
echo "        setTimeout(initNeuroMapWhenReady, 100);\n";
echo "    }\n";
echo "}\n";
echo "\n// Start initialization\n";
echo "initNeuroMapWhenReady();\n";
echo html_writer::end_tag('script');