<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Failed Questions Recovery';
$string['failed_questions_recovery'] = 'Failed Questions Recovery';
$string['failed_questions_recovery:use'] = 'Use failed questions recovery';
$string['failed_questions_recovery:view'] = 'View failed questions';
$string['failed_questions_recovery:manage'] = 'Manage failed questions';

// Navigation
$string['recovery_dashboard'] = 'Recovery Dashboard';
$string['recoveryboard'] = 'Recovery Board';
$string['failed_questions'] = 'Failed Questions';
$string['my_failed_questions'] = 'My Failed Questions';
$string['recovery_quizzes'] = 'Recovery Quizzes';
$string['create_recovery_quiz'] = 'Create Recovery Quiz';

// Categories
$string['categories'] = 'Categories';
$string['select_category'] = 'Select Category';
$string['all_categories'] = 'All Categories';
$string['category'] = 'Category';
$string['failed_questions_count'] = 'Failed Questions';
$string['not_mastered_count'] = 'Not Mastered';

// Quiz creation
$string['quiz_name'] = 'Quiz Name';
$string['question_count'] = 'Number of Questions';
$string['max_questions'] = 'Maximum {$a} questions';
$string['generate_quiz'] = 'Generate Quiz';
$string['quiz_created'] = 'Recovery quiz created successfully';
$string['no_failed_questions'] = 'You have no failed questions in this category';

// Question details
$string['question_text'] = 'Question Text';
$string['question_type'] = 'Question Type';
$string['attempts'] = 'Attempts';
$string['last_failed'] = 'Last Failed';
$string['mastered'] = 'Mastered';
$string['not_mastered'] = 'Not Mastered';
$string['mark_as_mastered'] = 'Mark as Mastered';

// Quiz management
$string['completed_quizzes'] = 'Completed Quizzes';
$string['pending_quizzes'] = 'Pending Quizzes';
$string['quiz_score'] = 'Score';
$string['completion_date'] = 'Completion Date';
$string['retake_quiz'] = 'Retake Quiz';
$string['view_quiz'] = 'View Quiz';
$string['delete_quiz'] = 'Delete Quiz';

// Statistics
$string['total_failed_questions'] = 'Total Failed Questions';
$string['mastered_questions'] = 'Mastered Questions';
$string['recovery_rate'] = 'Recovery Rate';
$string['average_score'] = 'Average Score';
$string['last_activity'] = 'Last Activity';

// Messages
$string['quiz_completed'] = 'Quiz completed successfully';
$string['question_mastered'] = 'Question marked as mastered';
$string['quiz_deleted'] = 'Quiz deleted';
$string['no_questions_available'] = 'No questions available for this category';
$string['recovery_progress'] = 'Recovery Progress';

// Errors
$string['error_creating_quiz'] = 'Error creating quiz';
$string['error_completing_quiz'] = 'Error completing quiz';
$string['error_loading_questions'] = 'Error loading questions';
$string['quiz_not_found'] = 'Quiz not found';
$string['nofailedquestions'] = 'No failed questions found';
$string['quiznotfound'] = 'Quiz not found';

// Settings
$string['settings'] = 'Settings';
$string['enable_auto_mastery'] = 'Enable auto mastery';
$string['enable_auto_mastery_desc'] = 'Automatically mark questions as mastered when answered correctly';
$string['mastery_threshold'] = 'Mastery threshold';
$string['mastery_threshold_desc'] = 'Minimum score to consider a question as mastered';
$string['max_recovery_questions'] = 'Maximum recovery questions';
$string['max_recovery_questions_desc'] = 'Maximum number of questions that can be included in a recovery quiz';

// Help
$string['help_header'] = 'Help - Failed Questions Recovery';
$string['help_description'] = 'This plugin allows you to review questions you have failed in previous quizzes.';
$string['help_how_it_works'] = 'How it works:';
$string['help_step1'] = '1. Take quizzes normally in your courses';
$string['help_step2'] = '2. Questions you fail are automatically saved';
$string['help_step3'] = '3. Use this panel to create personalized review quizzes';
$string['help_step4'] = '4. Master questions by answering them correctly in recovery quizzes';

// Quiz confirmation
$string['confirmsubmit'] = 'Are you sure you want to submit your answers? You cannot change them after submitting.';
$string['submit_quiz'] = 'Submit Quiz';

// Time formats
$string['time_ago'] = '{$a} ago';
$string['never'] = 'Never';
$string['today'] = 'Today';
$string['yesterday'] = 'Yesterday';
$string['days_ago'] = '{$a} days ago';
$string['weeks_ago'] = '{$a} weeks ago';
$string['months_ago'] = '{$a} months ago';

// Payment strings
$string['payment_settings'] = 'Payment Settings';
$string['payment_settings_desc'] = 'Configuration for PayPal payment system';
$string['paypal_client_id'] = 'PayPal Client ID';
$string['paypal_client_id_desc'] = 'PayPal Client ID for processing payments. Leave blank to use value from .env file';
$string['enable_payments'] = 'Enable payment system';
$string['enable_payments_desc'] = 'Activate payment system to access full plugin functionality';
$string['payment_amount'] = 'Payment amount';
$string['payment_amount_desc'] = 'Amount to charge for plugin access (in euros)';
$string['payment_title'] = 'Access Payment';
$string['payment_heading'] = 'Payment for Failed Questions Recovery Access';
$string['payment_required'] = 'Payment required for access';
$string['payment_required_desc'] = 'To access the full functionality of Failed Questions Recovery, a one-time payment of €6 is required';
$string['payment_success'] = 'Payment completed successfully';
$string['payment_pending'] = 'Payment pending';
$string['payment_failed'] = 'Payment has failed';
$string['payment_already_completed'] = 'You have already made the payment';
$string['go_to_payment'] = 'Go to payment page';
$string['event_payment_completed'] = 'Payment completed';

// Payment success page
$string['payment_success_title'] = 'Payment Completed';
$string['payment_success_heading'] = 'Payment Processed Successfully';
$string['payment_details'] = 'Payment Details';
$string['transaction_id'] = 'Transaction ID';
$string['amount'] = 'Amount';
$string['status'] = 'Status';
$string['date'] = 'Date';
$string['completed'] = 'Completed';
$string['payment_success_message'] = 'Your payment has been processed successfully. You now have full access to all Failed Questions Recovery plugin features.';
$string['access_tools'] = 'Access Failed Questions';
$string['go_to_dashboard'] = 'Go to Main Dashboard';
$string['payment_error_title'] = 'Payment Error';
$string['payment_error_heading'] = 'Error Processing Payment';
$string['try_again'] = 'Try Again';
$string['contact_support'] = 'Contact Support';
$string['paypal_note'] = 'Note: You do not need a PayPal account to make the payment. You can pay as a guest with your credit or debit card.';
$string['mobile_payment_note'] = 'If the card payment option does not appear on mobile devices, you can: clear browser cookies, use incognito mode, try from a computer, or create a free PayPal account.';