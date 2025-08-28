<?php
/**
 * NeuroOpositor Questions View
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Get parameters for question session
$topicid = optional_param('topicid', 0, PARAM_INT);
$mode = optional_param('mode', 'study', PARAM_ALPHA); // study, test, review
$difficulty = optional_param('difficulty', 'all', PARAM_ALPHA);
$sessionid = optional_param('sessionid', 0, PARAM_INT);

// Get available topics for the course
$topics = \local_neuroopositor\tema::get_all();

// Get user progress for topic selection
$user_progress = new \local_neuroopositor\user_progress();
$progress_data = array();
foreach ($topics as $topic) {
    $progress = $user_progress->get_or_create($userid, $topic->get_id());
    $progress_data[$topic->get_id()] = $progress->to_array();
}

// Get AI recommendations for next topics if enabled
$ai_recommendations = array();
if (get_config('local_neuroopositor', 'enableai')) {
    $ai_engine = new \local_neuroopositor\ai_engine();
    $ai_recommendations = $ai_engine->get_recommended_topics($userid, $courseid);
}

echo html_writer::start_div('questions-container');

// Question session setup
echo html_writer::start_div('question-setup-section');
echo html_writer::tag('h2', get_string('studysession', 'local_neuroopositor'));

// Topic selection
echo html_writer::start_div('topic-selection');
echo html_writer::tag('h3', get_string('selecttopic', 'local_neuroopositor'));

// AI Recommendations (if available)
if (!empty($ai_recommendations)) {
    echo html_writer::start_div('ai-recommendations');
    echo html_writer::tag('h4', get_string('recommendedtopics', 'local_neuroopositor'));
    echo html_writer::start_div('recommended-topics');
    
    foreach (array_slice($ai_recommendations, 0, 3) as $rec_topic) {
        $topic = \local_neuroopositor\tema::get_by_id($rec_topic['topic_id']);
        if ($topic) {
            $progress = $progress_data[$topic->id];
            echo html_writer::start_div('recommended-topic-card');
            echo html_writer::tag('h5', $topic->titulo);
            echo html_writer::tag('p', $rec_topic['reason']);
            echo html_writer::div('Progress: ' . $progress['mastery_percentage'] . '%', 'topic-progress');
            echo html_writer::tag('button', 
                get_string('startsession', 'local_neuroopositor'),
                array(
                    'class' => 'btn btn-primary start-session-btn',
                    'data-topicid' => $topic->id,
                    'data-mode' => 'study'
                )
            );
            echo html_writer::end_div();
        }
    }
    
    echo html_writer::end_div();
    echo html_writer::end_div();
}

// All topics grid
echo html_writer::start_div('all-topics');
echo html_writer::tag('h4', get_string('alltopics', 'local_neuroopositor'));
echo html_writer::start_div('topics-grid');

foreach ($topics as $topic) {
    $progress = $progress_data[$topic->id];
    $progress_class = '';
    
    if ($progress['mastery_percentage'] >= 80) {
        $progress_class = 'mastered';
    } elseif ($progress['mastery_percentage'] >= 50) {
        $progress_class = 'in-progress';
    } else {
        $progress_class = 'not-started';
    }
    
    echo html_writer::start_div('topic-card ' . $progress_class);
    echo html_writer::tag('h5', $topic->titulo);
    echo html_writer::tag('p', shorten_text($topic->descripcion, 150));
    echo html_writer::div('Block: ' . $topic->bloque, 'topic-block');
    echo html_writer::div('Difficulty: ' . $topic->nivel_dificultad, 'topic-difficulty');
    echo html_writer::div('Progress: ' . $progress['mastery_percentage'] . '%', 'topic-progress');
    
    // Progress bar
    echo html_writer::start_div('progress-bar-container');
    echo html_writer::div('', 'progress-bar', array(
        'style' => 'width: ' . $progress['mastery_percentage'] . '%'
    ));
    echo html_writer::end_div();
    
    // Action buttons
    echo html_writer::start_div('topic-actions');
    echo html_writer::tag('button', 
        get_string('study', 'local_neuroopositor'),
        array(
            'class' => 'btn btn-primary btn-sm start-session-btn',
            'data-topicid' => $topic->id,
            'data-mode' => 'study'
        )
    );
    
    if ($progress['mastery_percentage'] > 0) {
        echo html_writer::tag('button', 
            get_string('test', 'local_neuroopositor'),
            array(
                'class' => 'btn btn-warning btn-sm start-session-btn',
                'data-topicid' => $topic->id,
                'data-mode' => 'test'
            )
        );
        
        echo html_writer::tag('button', 
            get_string('review', 'local_neuroopositor'),
            array(
                'class' => 'btn btn-info btn-sm start-session-btn',
                'data-topicid' => $topic->id,
                'data-mode' => 'review'
            )
        );
    }
    
    echo html_writer::end_div(); // topic-actions
    echo html_writer::end_div(); // topic-card
}

echo html_writer::end_div(); // topics-grid
echo html_writer::end_div(); // all-topics
echo html_writer::end_div(); // topic-selection
echo html_writer::end_div(); // question-setup-section

// Question session area (initially hidden)
echo html_writer::start_div('question-session-area', array('id' => 'question-session', 'style' => 'display: none;'));

// Session header
echo html_writer::start_div('session-header');
echo html_writer::tag('h3', '', array('id' => 'session-title'));
echo html_writer::start_div('session-controls');
echo html_writer::tag('button', get_string('pausesession', 'local_neuroopositor'), 
    array('id' => 'pause-session-btn', 'class' => 'btn btn-secondary'));
echo html_writer::tag('button', get_string('endsession', 'local_neuroopositor'), 
    array('id' => 'end-session-btn', 'class' => 'btn btn-danger'));
echo html_writer::end_div();
echo html_writer::end_div();

// Session progress
echo html_writer::start_div('session-progress');
echo html_writer::div('', 'progress-info', array('id' => 'session-progress-info'));
echo html_writer::start_div('session-progress-bar');
echo html_writer::div('', 'progress-fill', array('id' => 'session-progress-fill'));
echo html_writer::end_div();
echo html_writer::end_div();

// Question display area
echo html_writer::start_div('question-display');
echo html_writer::div('', 'question-content', array('id' => 'question-content'));
echo html_writer::div('', 'question-options', array('id' => 'question-options'));
echo html_writer::div('', 'question-feedback', array('id' => 'question-feedback'));
echo html_writer::end_div();

// Question navigation
echo html_writer::start_div('question-navigation');
echo html_writer::tag('button', get_string('previous', 'local_neuroopositor'), 
    array('id' => 'prev-question-btn', 'class' => 'btn btn-secondary', 'disabled' => 'disabled'));
echo html_writer::tag('button', get_string('next', 'local_neuroopositor'), 
    array('id' => 'next-question-btn', 'class' => 'btn btn-primary'));
echo html_writer::tag('button', get_string('submit', 'local_neuroopositor'), 
    array('id' => 'submit-answer-btn', 'class' => 'btn btn-success', 'style' => 'display: none;'));
echo html_writer::end_div();

echo html_writer::end_div(); // question-session-area

// Session results area (initially hidden)
echo html_writer::start_div('session-results-area', array('id' => 'session-results', 'style' => 'display: none;'));
echo html_writer::tag('h3', get_string('sessionresults', 'local_neuroopositor'));
echo html_writer::div('', 'results-content', array('id' => 'results-content'));
echo html_writer::tag('button', get_string('newsession', 'local_neuroopositor'), 
    array('id' => 'new-session-btn', 'class' => 'btn btn-primary'));
echo html_writer::end_div();

echo html_writer::end_div(); // questions-container

// Initialize questions JavaScript
echo html_writer::script("
    // Questions specific initialization
    NeuroOpositor.initQuestions = function() {
        console.log('Questions initialized');
        
        this.currentSession = null;
        this.currentQuestionIndex = 0;
        this.sessionQuestions = [];
        this.userAnswers = [];
        
        // Bind event handlers
        this.bindQuestionEvents();
    };
    
    NeuroOpositor.bindQuestionEvents = function() {
        var self = this;
        
        // Start session buttons
        document.querySelectorAll('.start-session-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var topicId = this.getAttribute('data-topicid');
                var mode = this.getAttribute('data-mode');
                self.startQuestionSession(topicId, mode);
            });
        });
        
        // Session control buttons
        document.getElementById('pause-session-btn').addEventListener('click', function() {
            self.pauseSession();
        });
        
        document.getElementById('end-session-btn').addEventListener('click', function() {
            self.endSession();
        });
        
        // Question navigation
        document.getElementById('prev-question-btn').addEventListener('click', function() {
            self.previousQuestion();
        });
        
        document.getElementById('next-question-btn').addEventListener('click', function() {
            self.nextQuestion();
        });
        
        document.getElementById('submit-answer-btn').addEventListener('click', function() {
            self.submitAnswer();
        });
        
        // New session button
        document.getElementById('new-session-btn').addEventListener('click', function() {
            self.showTopicSelection();
        });
    };
    
    NeuroOpositor.startQuestionSession = function(topicId, mode) {
        var self = this;
        
        // Show loading
        this.showLoading();
        
        // Make AJAX request to start session
        fetch(this.config.wwwroot + '/local/neuroopositor/ajax.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                action: 'start_question_session',
                topicid: topicId,
                mode: mode,
                courseid: this.config.courseid,
                sesskey: this.config.sesskey
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                self.currentSession = data.session;
                self.sessionQuestions = data.questions;
                self.currentQuestionIndex = 0;
                self.userAnswers = [];
                
                self.showQuestionSession();
                self.displayCurrentQuestion();
            } else {
                alert('Error starting session: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error starting session');
        })
        .finally(() => {
            this.hideLoading();
        });
    };
    
    NeuroOpositor.showQuestionSession = function() {
        document.querySelector('.question-setup-section').style.display = 'none';
        document.getElementById('question-session').style.display = 'block';
        document.getElementById('session-results').style.display = 'none';
        
        // Update session title
        var title = this.currentSession.topic_title + ' - ' + this.currentSession.mode.toUpperCase();
        document.getElementById('session-title').textContent = title;
    };
    
    NeuroOpositor.displayCurrentQuestion = function() {
        if (this.currentQuestionIndex >= this.sessionQuestions.length) {
            this.showSessionResults();
            return;
        }
        
        var question = this.sessionQuestions[this.currentQuestionIndex];
        
        // Update progress
        var progress = ((this.currentQuestionIndex + 1) / this.sessionQuestions.length) * 100;
        document.getElementById('session-progress-fill').style.width = progress + '%';
        document.getElementById('session-progress-info').textContent = 
            'Question ' + (this.currentQuestionIndex + 1) + ' of ' + this.sessionQuestions.length;
        
        // Display question
        document.getElementById('question-content').innerHTML = question.questiontext;
        
        // Display options
        var optionsHtml = '';
        if (question.options) {
            question.options.forEach(function(option, index) {
                optionsHtml += '<div class=\"question-option\">';
                optionsHtml += '<input type=\"radio\" name=\"answer\" value=\"' + option.id + '\" id=\"option' + index + '\">';
                optionsHtml += '<label for=\"option' + index + '\">' + option.text + '</label>';
                optionsHtml += '</div>';
            });
        }
        document.getElementById('question-options').innerHTML = optionsHtml;
        
        // Clear feedback
        document.getElementById('question-feedback').innerHTML = '';
        
        // Update navigation buttons
        document.getElementById('prev-question-btn').disabled = (this.currentQuestionIndex === 0);
        document.getElementById('next-question-btn').style.display = 'inline-block';
        document.getElementById('submit-answer-btn').style.display = 'none';
        
        if (this.currentQuestionIndex === this.sessionQuestions.length - 1) {
            document.getElementById('next-question-btn').style.display = 'none';
            document.getElementById('submit-answer-btn').style.display = 'inline-block';
        }
    };
    
    NeuroOpositor.nextQuestion = function() {
        // Save current answer
        var selectedOption = document.querySelector('input[name=\"answer\"]:checked');
        if (selectedOption) {
            this.userAnswers[this.currentQuestionIndex] = selectedOption.value;
        }
        
        this.currentQuestionIndex++;
        this.displayCurrentQuestion();
    };
    
    NeuroOpositor.previousQuestion = function() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
            
            // Restore previous answer if exists
            if (this.userAnswers[this.currentQuestionIndex]) {
                var option = document.querySelector('input[value=\"' + this.userAnswers[this.currentQuestionIndex] + '\"]');
                if (option) {
                    option.checked = true;
                }
            }
        }
    };
    
    NeuroOpositor.submitAnswer = function() {
        // Save final answer
        var selectedOption = document.querySelector('input[name=\"answer\"]:checked');
        if (selectedOption) {
            this.userAnswers[this.currentQuestionIndex] = selectedOption.value;
        }
        
        // Submit session
        this.submitSession();
    };
    
    NeuroOpositor.submitSession = function() {
        var self = this;
        
        this.showLoading();
        
        fetch(this.config.wwwroot + '/local/neuroopositor/ajax.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                action: 'submit_question_session',
                sessionid: this.currentSession.id,
                answers: this.userAnswers,
                sesskey: this.config.sesskey
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                self.sessionResults = data.results;
                self.showSessionResults();
            } else {
                alert('Error submitting session: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting session');
        })
        .finally(() => {
            this.hideLoading();
        });
    };
    
    NeuroOpositor.showSessionResults = function() {
        document.getElementById('question-session').style.display = 'none';
        document.getElementById('session-results').style.display = 'block';
        
        // Display results
        var resultsHtml = '<div class=\"session-summary\">';
        resultsHtml += '<h4>Session Summary</h4>';
        resultsHtml += '<p>Score: ' + this.sessionResults.score + '%</p>';
        resultsHtml += '<p>Correct Answers: ' + this.sessionResults.correct + ' / ' + this.sessionResults.total + '</p>';
        resultsHtml += '<p>Time Spent: ' + this.formatTime(this.sessionResults.time_spent) + '</p>';
        resultsHtml += '</div>';
        
        document.getElementById('results-content').innerHTML = resultsHtml;
    };
    
    NeuroOpositor.showTopicSelection = function() {
        document.querySelector('.question-setup-section').style.display = 'block';
        document.getElementById('question-session').style.display = 'none';
        document.getElementById('session-results').style.display = 'none';
    };
    
    NeuroOpositor.pauseSession = function() {
        // Implementation for pausing session
        console.log('Session paused');
    };
    
    NeuroOpositor.endSession = function() {
        if (confirm('Are you sure you want to end this session?')) {
            this.showTopicSelection();
        }
    };
    
    NeuroOpositor.formatTime = function(seconds) {
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    };
    
    NeuroOpositor.showLoading = function() {
        // Show loading indicator
        console.log('Loading...');
    };
    
    NeuroOpositor.hideLoading = function() {
        // Hide loading indicator
        console.log('Loading complete');
    };
    
    // Initialize questions when NeuroOpositor is ready
    if (typeof NeuroOpositor !== 'undefined' && NeuroOpositor.config && NeuroOpositor.config.action === 'questions') {
        NeuroOpositor.initQuestions();
    }
");

// Add CSS for questions
echo html_writer::start_tag('style');
echo "
.questions-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.topic-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin: 10px;
    background: #fff;
    transition: box-shadow 0.3s;
    max-height: 300px;
    overflow: hidden;
}

.topic-card p {
    max-height: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #000000;
}

.topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.topic-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.topic-card.mastered {
    border-left: 4px solid #28a745;
}

.topic-card.in-progress {
    border-left: 4px solid #ffc107;
}

.topic-card.not-started {
    border-left: 4px solid #dc3545;
}

.topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    margin: 10px 0;
}

.progress-bar {
    height: 100%;
    background: #007bff;
    border-radius: 4px;
    transition: width 0.3s;
}

.question-session-area {
    max-width: 800px;
    margin: 0 auto;
}

.session-progress-bar {
    width: 100%;
    height: 10px;
    background: #e9ecef;
    border-radius: 5px;
    margin: 10px 0;
}

.progress-fill {
    height: 100%;
    background: #007bff;
    border-radius: 5px;
    transition: width 0.3s;
}

.question-option {
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

.question-option:hover {
    background: #f8f9fa;
}

.question-option input[type='radio'] {
    margin-right: 10px;
}
";
echo html_writer::end_tag('style');
?>