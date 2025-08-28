<?php
/**
 * NeuroOpositor Statistics View
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Get statistics data
use local_neuroopositor\statistics;

$user_stats = statistics::get_user_general_stats($userid, $courseid);
$block_stats = statistics::get_user_block_stats($userid, $courseid);
$progress_history = statistics::get_user_progress_history($userid, $courseid, 30); // Last 30 days
$topic_performance = statistics::get_topic_performance($userid, $courseid);

// Get time period filter
$timeperiod = optional_param('timeperiod', '30', PARAM_INT); // days
$view_type = optional_param('view', 'overview', PARAM_ALPHA); // overview, detailed, comparison

echo html_writer::start_div('statistics-container');

// Statistics header
echo html_writer::start_div('statistics-header');
echo html_writer::tag('h2', get_string('statistics', 'local_neuroopositor'));

// Time period selector
echo html_writer::start_div('time-period-selector');
echo html_writer::tag('label', get_string('timeperiod', 'local_neuroopositor'));
echo html_writer::select(
    array(
        '7' => get_string('last7days', 'local_neuroopositor'),
        '30' => get_string('last30days', 'local_neuroopositor'),
        '90' => get_string('last90days', 'local_neuroopositor'),
        '365' => get_string('lastyear', 'local_neuroopositor')
    ),
    'timeperiod',
    $timeperiod,
    false,
    array('id' => 'timeperiod-selector')
);
echo html_writer::end_div();

// View type selector
echo html_writer::start_div('view-type-selector');
echo html_writer::tag('label', get_string('viewtype', 'local_neuroopositor'));
echo html_writer::select(
    array(
        'overview' => get_string('overview', 'local_neuroopositor'),
        'detailed' => get_string('detailed', 'local_neuroopositor'),
        'comparison' => get_string('comparison', 'local_neuroopositor')
    ),
    'view',
    $view_type,
    false,
    array('id' => 'view-type-selector')
);
echo html_writer::end_div();

// Export button
if (has_capability('local/neuroopositor:export', $context)) {
    echo html_writer::tag('button', 
        get_string('exportdata', 'local_neuroopositor'),
        array('id' => 'export-stats-btn', 'class' => 'btn btn-secondary')
    );
}

echo html_writer::end_div(); // statistics-header

// Main statistics content
echo html_writer::start_div('statistics-main');

switch ($view_type) {
    case 'detailed':
        render_detailed_statistics($user_stats, $block_stats, $progress_history, $topic_performance);
        break;
    case 'comparison':
        render_comparison_statistics($user_stats, $courseid, $context);
        break;
    default: // overview
        render_overview_statistics($user_stats, $block_stats, $progress_history, $topic_performance);
        break;
}

echo html_writer::end_div(); // statistics-main
echo html_writer::end_div(); // statistics-container

/**
 * Render overview statistics
 */
function render_overview_statistics($user_stats, $block_stats, $progress_history, $topic_performance) {
    // Key metrics cards
    echo html_writer::start_div('metrics-grid');
    
    // Overall progress card
    echo html_writer::start_div('metric-card progress-card');
    echo html_writer::tag('h3', get_string('overallprogress', 'local_neuroopositor'));
    echo html_writer::div($user_stats['overall_progress'] . '%', 'metric-value');
    echo html_writer::div(get_string('topicscompleted', 'local_neuroopositor'), 'metric-label');
    echo html_writer::end_div();
    
    // Accuracy card
    echo html_writer::start_div('metric-card accuracy-card');
    echo html_writer::tag('h3', get_string('accuracy', 'local_neuroopositor'));
    echo html_writer::div($user_stats['accuracy'] . '%', 'metric-value');
    echo html_writer::div(get_string('correctanswers', 'local_neuroopositor'), 'metric-label');
    echo html_writer::end_div();
    
    // Study time card
    echo html_writer::start_div('metric-card time-card');
    echo html_writer::tag('h3', get_string('studytime', 'local_neuroopositor'));
    echo html_writer::div(format_time($user_stats['total_study_time'] ?? 0), 'metric-value');
    echo html_writer::div(get_string('totaltime', 'local_neuroopositor'), 'metric-label');
    echo html_writer::end_div();
    
    // Current streak card
    echo html_writer::start_div('metric-card streak-card');
    echo html_writer::tag('h3', get_string('currentstreak', 'local_neuroopositor'));
    echo html_writer::div($user_stats['current_streak'], 'metric-value');
    echo html_writer::div(get_string('days', 'local_neuroopositor'), 'metric-label');
    echo html_writer::end_div();
    
    // Questions answered card
    echo html_writer::start_div('metric-card questions-card');
    echo html_writer::tag('h3', get_string('questionsanswered', 'local_neuroopositor'));
    echo html_writer::div($user_stats['total_questions'], 'metric-value');
    echo html_writer::div(get_string('totalquestions', 'local_neuroopositor'), 'metric-label');
    echo html_writer::end_div();
    
    // Average session time card
    echo html_writer::start_div('metric-card session-card');
    echo html_writer::tag('h3', get_string('avgsessiontime', 'local_neuroopositor'));
    echo html_writer::div(format_time($user_stats['avg_session_time'] ?? 0), 'metric-value');
    echo html_writer::div(get_string('persession', 'local_neuroopositor'), 'metric-label');
    echo html_writer::end_div();
    
    echo html_writer::end_div(); // metrics-grid
    
    // Charts section
    echo html_writer::start_div('charts-section');
    
    // Progress over time chart
    echo html_writer::start_div('chart-container');
    echo html_writer::tag('h3', get_string('progressovertime', 'local_neuroopositor'));
    echo html_writer::div('', 'chart', array('id' => 'progress-time-chart'));
    echo html_writer::end_div();
    
    // Block performance chart
    echo html_writer::start_div('chart-container');
    echo html_writer::tag('h3', get_string('blockperformance', 'local_neuroopositor'));
    echo html_writer::div('', 'chart', array('id' => 'block-performance-chart'));
    echo html_writer::end_div();
    
    echo html_writer::end_div(); // charts-section
    
    // Recent activity section
    echo html_writer::start_div('recent-activity-section');
    echo html_writer::tag('h3', get_string('recentactivity', 'local_neuroopositor'));
    echo html_writer::div('', 'activity-timeline', array('id' => 'activity-timeline'));
    echo html_writer::end_div();
}

/**
 * Render detailed statistics
 */
function render_detailed_statistics($user_stats, $block_stats, $progress_history, $topic_performance) {
    // Detailed performance analysis
    echo html_writer::start_div('detailed-stats');
    
    // Performance by topic
    echo html_writer::start_div('topic-performance-section');
    echo html_writer::tag('h3', get_string('topicperformance', 'local_neuroopositor'));
    
    echo html_writer::start_tag('table', array('class' => 'table table-striped topic-performance-table'));
    echo html_writer::start_tag('thead');
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('topic', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('block', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('progress', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('accuracy', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('studytime', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('difficulty', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('lastactivity', 'local_neuroopositor'));
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');
    
    echo html_writer::start_tag('tbody');
    foreach ($topic_performance as $topic) {
        echo html_writer::start_tag('tr');
        echo html_writer::tag('td', $topic['title']);
        echo html_writer::tag('td', $topic['block']);
        echo html_writer::tag('td', $topic['progress'] . '%');
        echo html_writer::tag('td', $topic['accuracy'] . '%');
        echo html_writer::tag('td', format_time($topic['study_time']));
        echo html_writer::tag('td', $topic['difficulty']);
        echo html_writer::tag('td', $topic['last_activity'] ? userdate($topic['last_activity']) : '-');
        echo html_writer::end_tag('tr');
    }
    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
    
    echo html_writer::end_div(); // topic-performance-section
    
    // Learning patterns analysis
    echo html_writer::start_div('learning-patterns-section');
    echo html_writer::tag('h3', get_string('learningpatterns', 'local_neuroopositor'));
    
    // Study time distribution
    echo html_writer::start_div('pattern-chart');
    echo html_writer::tag('h4', get_string('studytimedistribution', 'local_neuroopositor'));
    echo html_writer::div('', 'chart', array('id' => 'study-time-distribution-chart'));
    echo html_writer::end_div();
    
    // Difficulty progression
    echo html_writer::start_div('pattern-chart');
    echo html_writer::tag('h4', get_string('difficultyprogression', 'local_neuroopositor'));
    echo html_writer::div('', 'chart', array('id' => 'difficulty-progression-chart'));
    echo html_writer::end_div();
    
    echo html_writer::end_div(); // learning-patterns-section
    
    echo html_writer::end_div(); // detailed-stats
}

/**
 * Render comparison statistics
 */
function render_comparison_statistics($user_stats, $courseid, $context) {
    global $DB;
    
    // Only show if user has permission to view all stats
    if (!has_capability('local/neuroopositor:viewallstats', $context)) {
        echo html_writer::div(get_string('nopermission', 'local_neuroopositor'), 'alert alert-warning');
        return;
    }
    
    echo html_writer::start_div('comparison-stats');
    
    // Course averages comparison
    echo html_writer::start_div('course-comparison-section');
    echo html_writer::tag('h3', get_string('coursecomparison', 'local_neuroopositor'));
    
    // Get course averages
    $course_averages = get_course_averages($courseid);
    
    echo html_writer::start_div('comparison-grid');
    
    // Progress comparison
    echo html_writer::start_div('comparison-card');
    echo html_writer::tag('h4', get_string('progresscomparison', 'local_neuroopositor'));
    echo html_writer::div('Your Progress: ' . $user_stats['overall_progress'] . '%', 'user-stat');
    echo html_writer::div('Course Average: ' . $course_averages['avg_progress'] . '%', 'course-stat');
    $progress_diff = $user_stats['overall_progress'] - $course_averages['avg_progress'];
    $progress_class = $progress_diff >= 0 ? 'positive' : 'negative';
    echo html_writer::div(($progress_diff >= 0 ? '+' : '') . $progress_diff . '%', 'difference ' . $progress_class);
    echo html_writer::end_div();
    
    // Accuracy comparison
    echo html_writer::start_div('comparison-card');
    echo html_writer::tag('h4', get_string('accuracycomparison', 'local_neuroopositor'));
    echo html_writer::div('Your Accuracy: ' . $user_stats['accuracy'] . '%', 'user-stat');
    echo html_writer::div('Course Average: ' . $course_averages['avg_accuracy'] . '%', 'course-stat');
    $accuracy_diff = $user_stats['accuracy'] - $course_averages['avg_accuracy'];
    $accuracy_class = $accuracy_diff >= 0 ? 'positive' : 'negative';
    echo html_writer::div(($accuracy_diff >= 0 ? '+' : '') . $accuracy_diff . '%', 'difference ' . $accuracy_class);
    echo html_writer::end_div();
    
    // Study time comparison
    echo html_writer::start_div('comparison-card');
    echo html_writer::tag('h4', get_string('studytimecomparison', 'local_neuroopositor'));
    echo html_writer::div('Your Time: ' . format_time($user_stats['total_study_time']), 'user-stat');
    echo html_writer::div('Course Average: ' . format_time($course_averages['avg_study_time']), 'course-stat');
    $time_diff = $user_stats['total_study_time'] - $course_averages['avg_study_time'];
    $time_class = $time_diff >= 0 ? 'positive' : 'negative';
    echo html_writer::div(($time_diff >= 0 ? '+' : '') . format_time(abs($time_diff)), 'difference ' . $time_class);
    echo html_writer::end_div();
    
    echo html_writer::end_div(); // comparison-grid
    
    // Ranking section
    echo html_writer::start_div('ranking-section');
    echo html_writer::tag('h4', get_string('yourranking', 'local_neuroopositor'));
    
    $user_ranking = get_user_ranking($courseid, $user_stats);
    echo html_writer::div('Overall Rank: ' . $user_ranking['overall_rank'] . ' of ' . $user_ranking['total_users'], 'ranking-stat');
    echo html_writer::div('Progress Rank: ' . $user_ranking['progress_rank'] . ' of ' . $user_ranking['total_users'], 'ranking-stat');
    echo html_writer::div('Accuracy Rank: ' . $user_ranking['accuracy_rank'] . ' of ' . $user_ranking['total_users'], 'ranking-stat');
    
    echo html_writer::end_div(); // ranking-section
    
    echo html_writer::end_div(); // course-comparison-section
    
    // Leaderboard (top 10)
    echo html_writer::start_div('leaderboard-section');
    echo html_writer::tag('h3', get_string('leaderboard', 'local_neuroopositor'));
    
    $leaderboard = get_course_leaderboard($courseid, 10);
    
    echo html_writer::start_tag('table', array('class' => 'table table-striped leaderboard-table'));
    echo html_writer::start_tag('thead');
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('rank', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('student', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('progress', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('accuracy', 'local_neuroopositor'));
    echo html_writer::tag('th', get_string('studytime', 'local_neuroopositor'));
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');
    
    echo html_writer::start_tag('tbody');
    foreach ($leaderboard as $index => $student) {
        $row_class = ($student['userid'] == $GLOBALS['USER']->id) ? 'current-user' : '';
        echo html_writer::start_tag('tr', array('class' => $row_class));
        echo html_writer::tag('td', $index + 1);
        echo html_writer::tag('td', $student['fullname']);
        echo html_writer::tag('td', $student['progress'] . '%');
        echo html_writer::tag('td', $student['accuracy'] . '%');
        echo html_writer::tag('td', format_time($student['study_time']));
        echo html_writer::end_tag('tr');
    }
    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
    
    echo html_writer::end_div(); // leaderboard-section
    
    echo html_writer::end_div(); // comparison-stats
}

/**
 * Get course averages
 */
function get_course_averages($courseid) {
    global $DB;
    
    // This would be implemented with actual database queries
    // For now, return sample data
    return array(
        'avg_progress' => 65,
        'avg_accuracy' => 78,
        'avg_study_time' => 3600 // 1 hour
    );
}

/**
 * Get user ranking
 */
function get_user_ranking($courseid, $user_stats) {
    global $DB;
    
    // This would be implemented with actual database queries
    // For now, return sample data
    return array(
        'overall_rank' => 15,
        'progress_rank' => 12,
        'accuracy_rank' => 18,
        'total_users' => 45
    );
}

/**
 * Get course leaderboard
 */
function get_course_leaderboard($courseid, $limit = 10) {
    global $DB;
    
    // This would be implemented with actual database queries
    // For now, return sample data
    return array(
        array('userid' => 1, 'fullname' => 'John Doe', 'progress' => 95, 'accuracy' => 92, 'study_time' => 7200),
        array('userid' => 2, 'fullname' => 'Jane Smith', 'progress' => 88, 'accuracy' => 89, 'study_time' => 6800),
        array('userid' => 3, 'fullname' => 'Bob Johnson', 'progress' => 82, 'accuracy' => 85, 'study_time' => 6200)
    );
}

// Initialize statistics JavaScript
echo html_writer::script("
    // Statistics specific initialization
    NeuroOpositor.initStatistics = function() {
        console.log('Statistics initialized');
        
        this.currentTimeperiod = " . $timeperiod . ";
        this.currentViewType = '" . $view_type . "';
        
        // Bind event handlers
        this.bindStatisticsEvents();
        
        // Initialize charts
        this.initializeCharts();
    };
    
    NeuroOpositor.bindStatisticsEvents = function() {
        var self = this;
        
        // Time period selector
        document.getElementById('timeperiod-selector').addEventListener('change', function() {
            self.updateTimeperiod(this.value);
        });
        
        // View type selector
        document.getElementById('view-type-selector').addEventListener('change', function() {
            self.updateViewType(this.value);
        });
        
        // Export button
        var exportBtn = document.getElementById('export-stats-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                self.exportStatistics();
            });
        }
    };
    
    NeuroOpositor.updateTimeperiod = function(timeperiod) {
        this.currentTimeperiod = timeperiod;
        this.refreshStatistics();
    };
    
    NeuroOpositor.updateViewType = function(viewType) {
        var url = new URL(window.location);
        url.searchParams.set('view', viewType);
        window.location = url;
    };
    
    NeuroOpositor.refreshStatistics = function() {
        // Refresh statistics data via AJAX
        var url = new URL(window.location);
        url.searchParams.set('timeperiod', this.currentTimeperiod);
        window.location = url;
    };
    
    NeuroOpositor.initializeCharts = function() {
        // Initialize progress over time chart
        this.initProgressTimeChart();
        
        // Initialize block performance chart
        this.initBlockPerformanceChart();
        
        // Initialize other charts based on view type
        if (this.currentViewType === 'detailed') {
            this.initDetailedCharts();
        }
    };
    
    NeuroOpositor.initProgressTimeChart = function() {
        var chartContainer = document.getElementById('progress-time-chart');
        if (!chartContainer) return;
        
        var progressData = " . json_encode($progress_history) . ";
        this.renderLineChart(chartContainer, progressData, 'Progress Over Time');
    };
    
    NeuroOpositor.initBlockPerformanceChart = function() {
        var chartContainer = document.getElementById('block-performance-chart');
        if (!chartContainer) return;
        
        var blockData = " . json_encode($block_stats) . ";
        this.renderBarChart(chartContainer, blockData, 'Block Performance');
    };
    
    NeuroOpositor.initDetailedCharts = function() {
        // Study time distribution chart
        var studyTimeChart = document.getElementById('study-time-distribution-chart');
        if (studyTimeChart) {
            this.renderPieChart(studyTimeChart, [], 'Study Time Distribution');
        }
        
        // Difficulty progression chart
        var difficultyChart = document.getElementById('difficulty-progression-chart');
        if (difficultyChart) {
            this.renderLineChart(difficultyChart, [], 'Difficulty Progression');
        }
    };
    
    NeuroOpositor.renderLineChart = function(container, data, title) {
        // Simple line chart implementation
        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 300;
        container.appendChild(canvas);
        
        var ctx = canvas.getContext('2d');
        
        // Draw title
        ctx.font = '16px Arial';
        ctx.fillText(title, 10, 20);
        
        if (data && data.length > 0) {
            // Draw axes
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 1;
            
            // Y-axis
            ctx.beginPath();
            ctx.moveTo(50, 40);
            ctx.lineTo(50, 260);
            ctx.stroke();
            
            // X-axis
            ctx.beginPath();
            ctx.moveTo(50, 260);
            ctx.lineTo(550, 260);
            ctx.stroke();
            
            // Plot data
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            var stepX = 500 / (data.length - 1);
            data.forEach(function(point, index) {
                var x = 50 + (index * stepX);
                var y = 260 - (point.value * 2); // Scale to fit
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Draw point
                ctx.fillStyle = '#007bff';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
            
            ctx.stroke();
        }
    };
    
    NeuroOpositor.renderBarChart = function(container, data, title) {
        // Simple bar chart implementation
        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 300;
        container.appendChild(canvas);
        
        var ctx = canvas.getContext('2d');
        
        // Draw title
        ctx.font = '16px Arial';
        ctx.fillText(title, 10, 20);
        
        if (data && data.length > 0) {
            var barWidth = 500 / data.length;
            var maxValue = Math.max(...data.map(d => d.value));
            
            data.forEach(function(item, index) {
                var x = 50 + (index * barWidth);
                var height = (item.value / maxValue) * 200;
                var y = 260 - height;
                
                // Draw bar
                ctx.fillStyle = '#007bff';
                ctx.fillRect(x, y, barWidth - 10, height);
                
                // Draw label
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.fillText(item.label, x, 280);
            });
        }
    };
    
    NeuroOpositor.renderPieChart = function(container, data, title) {
        // Simple pie chart implementation
        var canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        container.appendChild(canvas);
        
        var ctx = canvas.getContext('2d');
        
        // Draw title
        ctx.font = '16px Arial';
        ctx.fillText(title, 10, 20);
        
        // Placeholder for pie chart
        ctx.strokeStyle = '#dee2e6';
        ctx.beginPath();
        ctx.arc(200, 150, 80, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    NeuroOpositor.exportStatistics = function() {
        // Export statistics to CSV
        var exportData = {
            action: 'export_statistics',
            courseid: this.config.courseid,
            userid: this.config.userid,
            timeperiod: this.currentTimeperiod,
            sesskey: this.config.sesskey
        };
        
        // Create form and submit
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = this.config.wwwroot + '/local/neuroopositor/export.php';
        
        for (var key in exportData) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = exportData[key];
            form.appendChild(input);
        }
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
");