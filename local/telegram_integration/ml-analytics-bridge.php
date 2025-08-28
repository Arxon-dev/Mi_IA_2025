<?php
/**
 * ML Analytics Bridge Client
 * Connects to local Next.js API server to fetch PostgreSQL data
 */

class MLAnalyticsBridge {
    private $apiBaseUrl;
    private $timeout;
    
    public function __construct($apiBaseUrl = 'https://17f8023fc268.ngrok-free.app', $timeout = 30) {
        $this->apiBaseUrl = rtrim($apiBaseUrl, '/');
        $this->timeout = $timeout;
    }
    
    /**
     * Test connection to the bridge API
     */
    public function testConnection() {
        return $this->makeRequest('test_connection');
    }
    
    /**
     * Get user analytics data
     */
    public function getUserAnalytics($telegramUserId) {
        return $this->makeRequest('get_user_analytics', ['telegramUserId' => $telegramUserId]);
    }
    
    /**
     * Get predictive analysis data
     */
    public function getPredictiveData($telegramUserId) {
        return $this->makeRequest('get_predictive_data', ['telegramUserId' => $telegramUserId]);
    }
    
    /**
     * Get predictive analysis for a user (alias for getPredictiveData)
     */
    public function getPredictiveAnalysis($telegramUserId) {
        return $this->getPredictiveData($telegramUserId);
    }
    
    /**
     * Get learning metrics
     */
    public function getLearningMetrics($telegramUserId) {
        return $this->makeRequest('get_learning_metrics', ['telegramUserId' => $telegramUserId]);
    }
    
    /**
     * Get optimization data
     */
    public function getOptimizationData($telegramUserId) {
        return $this->makeRequest('get_optimization_data', ['telegramUserId' => $telegramUserId]);
    }
    
    /**
     * Get social analysis data
     */
    public function getSocialData($telegramUserId) {
        return $this->makeRequest('get_social_data', ['telegramUserId' => $telegramUserId]);
    }
    
    /**
     * Get social analysis for a user (alias for getSocialData)
     */
    public function getSocialAnalysis($telegramUserId) {
        return $this->getSocialData($telegramUserId);
    }
    
    /**
     * Make HTTP request to the bridge API
     */
    private function makeRequest($action, $params = []) {
        $url = $this->apiBaseUrl . '/api/moodle/ml-analytics-bridge';
        
        $data = json_encode([
            'action' => $action,
            'params' => $params
        ]);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen($data),
                    'ngrok-skip-browser-warning: true'
                ],
                'content' => $data,
                'timeout' => $this->timeout
            ]
        ]);
        
        try {
            $response = file_get_contents($url, false, $context);
            
            if ($response === false) {
                throw new Exception('Failed to connect to bridge API');
            }
            
            $decoded = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON response from bridge API');
            }
            
            return $decoded;
            
        } catch (Exception $e) {
            error_log("ML Analytics Bridge Error: " . $e->getMessage());
            return [
                'error' => true,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Check if the bridge API is accessible
     */
    public function isApiAccessible() {
        $result = $this->testConnection();
        return !isset($result['error']) && isset($result['status']) && $result['status'] === 'success';
    }
}

/**
 * Global bridge instance
 */
function getBridge() {
    static $bridge = null;
    if ($bridge === null) {
        // Try ngrok URL first, then fallback to localhost (for local testing)
        $possibleUrls = [
            'https://17f8023fc268.ngrok-free.app',
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://localhost:3002',
            'http://localhost:3003'
        ];
        
        foreach ($possibleUrls as $url) {
            $testBridge = new MLAnalyticsBridge($url, 5); // Short timeout for testing
            if ($testBridge->isApiAccessible()) {
                $bridge = new MLAnalyticsBridge($url);
                break;
            }
        }
        
        if ($bridge === null) {
            $bridge = new MLAnalyticsBridge(); // Default to 3000
        }
    }
    return $bridge;
}
?> 