<?php
/**
 * Database Connection Helper
 * 
 * Establishes a PDO connection using the credentials defined in config.php.
 */

require_once __DIR__ . '/config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";port=" . DB_PORT . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // Log the connection error if debugging is enabled
    if (DEBUG_LOG) {
        $timestamp = date('Y-m-d H:i:s');
        error_log("[{$timestamp}] DB Connection Failed: " . $e->getMessage() . "\n", 3, LOG_FILE);
    }
    
    // Output a clean error response
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed. Please check config.php credentials.'
    ]);
    exit();
}
