<?php
/**
 * LINE Official Account Webhook Handler
 * 
 * Receives webhook events from LINE Developers Console, verifies the signature,
 * automatically extracts the Group ID, updates the MySQL database,
 * and replies with a welcome message when added to a group.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db_connect.php';

// Helper function to log messages if logging is enabled
function logMessage($msg) {
    if (DEBUG_LOG) {
        $timestamp = date('Y-m-d H:i:s');
        error_log("[{$timestamp}] {$msg}\n", 3, LOG_FILE);
    }
}

// 1. Read raw input body and signature header
$body = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_LINE_SIGNATURE'] ?? '';

logMessage("Received webhook request.");
if (empty($body)) {
    logMessage("Error: Empty request body.");
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit();
}

// Log the payload for user debugging
logMessage("Payload: " . $body);

// 2. Connect to DB and fetch configuration to dynamically verify signature and send response
$settings = null;
try {
    $stmt = $pdo->prepare("SELECT line_channel_secret, line_channel_access_token, line_group_id FROM temple_settings WHERE id = 1");
    $stmt->execute();
    $settings = $stmt->fetch();
} catch (PDOException $e) {
    logMessage("Database fetch error: " . $e->getMessage());
}

// 3. Signature verification
$channelSecret = ($settings && !empty($settings['line_channel_secret'])) ? $settings['line_channel_secret'] : LINE_CHANNEL_SECRET;

if (!empty($channelSecret)) {
    $calculatedSignature = base64_encode(hash_hmac('sha256', $body, $channelSecret, true));
    if ($calculatedSignature !== $signature) {
        logMessage("Signature verification failed. Expected: {$calculatedSignature}, Got: {$signature}");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    logMessage("Signature verified successfully.");
} else {
    logMessage("Warning: LINE_CHANNEL_SECRET is not configured in DB or config.php. Skipping verification.");
}

// Forward webhook request to Next.js API
try {
    $nextjsWebhookUrl = 'https://watdongsedthee.com/WatdongOS/api/line/webhook';
    $ch = curl_init($nextjsWebhookUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Line-Signature: ' . $signature
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $nextjsResponse = curl_exec($ch);
    $nextjsCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    logMessage("Forwarded to Next.js. Response Code: {$nextjsCode}, Response: {$nextjsResponse}");
} catch (Exception $e) {
    logMessage("Failed to forward webhook to Next.js: " . $e->getMessage());
}

// 4. Parse JSON webhook payload
$data = json_decode($body, true);
$events = $data['events'] ?? [];

foreach ($events as $event) {
    $groupId = null;
    
    // Check if the event source is from a group or room
    if (isset($event['source']) && ($event['source']['type'] === 'group' || $event['source']['type'] === 'room')) {
        $groupId = $event['source']['groupId'] ?? $event['source']['roomId'] ?? null;
    }
    
    if ($groupId) {
        logMessage("Detected Group ID: {$groupId}");
        
        if ($settings) {
            try {
                // If the group ID has changed or is empty, update it in the database
                if ($settings['line_group_id'] !== $groupId) {
                    $updateStmt = $pdo->prepare("UPDATE temple_settings SET line_group_id = :group_id WHERE id = 1");
                    $updateStmt->execute([':group_id' => $groupId]);
                    logMessage("Successfully updated group ID in database to: {$groupId}");
                    
                    // Update settings variable for subsequent actions
                    $settings['line_group_id'] = $groupId;
                }
                
                // Get the access token (from DB or config fallback)
                $accessToken = !empty($settings['line_channel_access_token']) ? $settings['line_channel_access_token'] : LINE_CHANNEL_ACCESS_TOKEN;
                
                // If it is a 'join' event, send the welcome message to the group
                if ($event['type'] === 'join' && !empty($accessToken)) {
                    logMessage("Bot joined group. Sending welcome message...");
                    sendWelcomeMessage($groupId, $accessToken);
                }
            } catch (PDOException $e) {
                logMessage("Database Update Error: " . $e->getMessage());
            }
        } else {
            logMessage("Error: Settings record (ID 1) not available in database. Cannot auto-update group ID.");
        }
    }
}

// LINE webhook requires returning a 200 OK response
http_response_code(200);
echo "OK";

/**
 * Sends a welcome message to the group using the LINE Push Message API.
 */
function sendWelcomeMessage($groupId, $accessToken) {
    $url = 'https://api.line.me/v2/bot/message/push';
    
    $payload = [
        'to' => $groupId,
        'messages' => [
            [
                'type' => 'text',
                'text' => "นมัสการพระคุณเจ้า และสวัสดีญาติโยมทุกท่าน 🙏\nบัดนี้ ระบบจัดการตารางวัด (Temple OS) ได้เชื่อมต่อเข้ากับกลุ่มไลน์นี้เรียบร้อยแล้ว! งานนิมนต์และศาสนพิธีทั้งหมดจะได้รับการแจ้งเตือนที่นี่โดยอัตโนมัติ"
            ]
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Enable if curl fails on hosts without SSL bundle
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        $error_msg = curl_error($ch);
        logMessage("cURL Error while sending welcome: " . $error_msg);
    }
    curl_close($ch);
    
    logMessage("Welcome API response code: {$httpCode}, response: {$response}");
}
