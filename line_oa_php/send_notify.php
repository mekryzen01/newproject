<?php

/**
 * Standalone LINE OA Notification Sender API
 * 
 * Can be called via HTTP POST to trigger a notification:
 * POST http://your-host.com/line_oa_php/send_notify
 * Content-Type: application/json
 * Payload:
 * {
 *   "action": "create" | "update" | "delete",
 *   "event": {
 *     "title": "เจริญพระพุทธมนต์เย็น",
 *     "date": "25 มิ.ย. 2569",
 *     "time": "17:00",
 *     "location": "ศาลาการเปรียญ",
 *     "host_name": "โยมสมศรี มีสุข",
 *     "monks_needed": 9,
 *     "status": "upcoming" | "completed" | "cancelled",
 *     "assigned_monks_names": "พระอาจารย์สมเกียรติ, พระสุรเดช"
 *   }
 * }
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db_connect.php';

// Helper function to log notification transactions
function logNotification($msg)
{
    if (DEBUG_LOG) {
        $timestamp = date('Y-m-d H:i:s');
        error_log("[{$timestamp}][Notification] {$msg}\n", 3, LOG_FILE);
    }
}
function ConvertToThaiDate($value, $short = '1', $need_time = '1', $need_time_second = '0')
{
    $date_arr = explode(' ', $value);
    $date = $date_arr[0];
    if (isset($date_arr[1])) {
        $time = $date_arr[1];
    } else {
        $time = '';
    }

    $value = $date;
    if ($value != "0000-00-00" && $value != '' && strpos($value, '-') !== false) {
        $x = explode("-", $value);
        if ($short == false)
            $arrMM = array(1 => "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม");
        else
            $arrMM = array(1 => "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.");
        // return $x[2]." ".$arrMM[(int)$x[1]]." ".($x[0]>2500?$x[0]:$x[0]+543);
        if ($need_time == '1') {
            if ($need_time_second == '1') {
                $time_format = $time != '' ? date('H:i:s น.', strtotime($time)) : '';
            } else {
                $time_format = $time != '' ? date('H:i น.', strtotime($time)) : '';
            }
        } else {
            $time_format = '';
        }

        return (int)$x[2] . " " . $arrMM[(int)$x[1]] . " " . ($x[0] > 2500 ? $x[0] : $x[0] + 543) . " " . $time_format;
    } else {
        return $value;
    }
}
// Set response headers
header('Content-Type: application/json');

// 1. Read input payload
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data) {
    // Check if data is passed via standard POST request
    $data = $_POST;
}

$action = $data['action'] ?? null;
$event = $data['event'] ?? null;

if (!$action || !$event) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing action or event parameters.'
    ]);
    exit();
}

try {
    // 2. Fetch LINE configuration from MySQL database
    $stmt = $pdo->prepare("SELECT line_channel_access_token, line_group_id FROM temple_settings WHERE id = 1");
    $stmt->execute();
    $settings = $stmt->fetch();

    if (!$settings) {
        throw new Exception("Temple settings record (ID 1) not found in database.");
    }

    // Retrieve active access token and group id (fallback to constants in config.php)
    $accessToken = !empty($settings['line_channel_access_token']) ? $settings['line_channel_access_token'] : LINE_CHANNEL_ACCESS_TOKEN;
    $groupId = $settings['line_group_id'] ?? null;

    // Check if token is empty
    if (empty($accessToken)) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'LINE Channel Access Token is not configured. Skipping notification.'
        ]);
        exit();
    }

    // 3. Format assigned monks list as numbered lines
    $monksList = 'ยังไม่ได้ระบุ';
    if (isset($event['assigned_monks_names'])) {
        $assignedMonks = $event['assigned_monks_names'];
        $monksArray = [];

        if (is_array($assignedMonks)) {
            $monksArray = array_filter(array_map('trim', $assignedMonks), fn($name) => $name !== '');
        } else {
            // Support comma-separated or newline-separated strings
            $monksArray = array_filter(array_map('trim', preg_split('/[\r\n,]+/', $assignedMonks)), fn($name) => $name !== '');
        }

        if (!empty($monksArray)) {
            $monksList = '';
            foreach (array_values($monksArray) as $index => $name) {
                $monksList .= ($index + 1) . '. ' . $name;
                if ($index < count($monksArray) - 1) {
                    $monksList .= "\n";
                }
            }
        }
    }
    if (empty(trim($monksList))) {
        $monksList = 'ยังไม่ได้ระบุ';
    }

    // 4. Construct Thai notification message
    $textMessage = '';

    if ($action === 'create') {
        $textMessage .= "📢 แจ้งเตือนงานนิมนต์ใหม่\n";
        $textMessage .= "------------------------\n";
        $textMessage .= "ชื่องาน: " . ($event['title'] ?? 'ไม่ระบุชื่องาน') . "\n";
        $textMessage .= "วันที่: " . ConvertToThaiDate($event['date'] ?? 'ไม่ระบุวันที่', 0) . "\n";
        $textMessage .= "เวลา: " . ($event['time'] ?? 'ไม่ระบุเวลา') . " น.\n";
        $textMessage .= "สถานที่: " . ($event['location'] ?? 'ไม่ระบุสถานที่') . "\n";
        $textMessage .= "เจ้าภาพ: " . ($event['host_name'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "จำนวนพระนิมนต์: " . ($event['monks_needed'] ?? 0) . " รูป\n";
        $textMessage .= "รายนามพระภิกษุ: " . $monksList;
    } elseif ($action === 'update') {
        $statusText = 'เร็ว ๆ นี้';
        if (isset($event['status'])) {
            if ($event['status'] === 'completed') {
                $statusText = 'เสร็จสิ้นการนิมนต์';
            } elseif ($event['status'] === 'cancelled' || $event['status'] === 'cancel') {
                $statusText = 'ยกเลิก';
            }
        }

        $textMessage .= "🔔 อัปเดตข้อมูลงานนิมนต์\n";
        $textMessage .= "------------------------\n";
        $textMessage .= "ชื่องาน: " . ($event['title'] ?? 'ไม่ระบุชื่องาน') . "\n";
        $textMessage .= "วันที่: " . ConvertToThaiDate($event['date'] ?? 'ไม่ระบุวันที่', 0) . "\n";
        $textMessage .= "เวลา: " . ($event['time'] ?? 'ไม่ระบุเวลา') . " น.\n";
        $textMessage .= "สถานที่: " . ($event['location'] ?? 'ไม่ระบุสถานที่') . "\n";
        $textMessage .= "เจ้าภาพ: " . ($event['host_name'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "สถานะ: " . $statusText . "\n";
        $textMessage .= "จำนวนพระนิมนต์: " . ($event['monks_needed'] ?? 0) . " รูป\n";
        $textMessage .= "รายนามพระภิกษุ: " . $monksList;
    } elseif ($action === 'delete') {
        $textMessage .= "❌ ยกเลิกงานนิมนต์\n";
        $textMessage .= "------------------------\n";
        $textMessage .= "ชื่องาน: " . ($event['title'] ?? 'ไม่ระบุชื่องาน') . "\n";
        $textMessage .= "วันที่: " . ConvertToThaiDate($event['date'] ?? 'ไม่ระบุวันที่', 0) . "\n";
        $textMessage .= "เวลา: " . ($event['time'] ?? 'ไม่ระบุเวลา') . " น.";
    } elseif ($action === 'create_booking') {
        $textMessage .= "🏫 แจ้งเตือนการจองศาลาใหม่\n";
        $textMessage .= "------------------------\n";
        $textMessage .= "ศาลา: " . ($event['sala_name'] ?? 'ไม่ระบุศาลา') . "\n";
        $textMessage .= "งาน/กิจกรรม: " . ($event['event_title'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "ประเภทงาน: " . getEventTypeText($event['event_type'] ?? '') . "\n";
        $textMessage .= "ผู้จอง: " . ($event['booker_name'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "เบอร์โทร: " . ($event['booker_phone'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "ตั้งแต่วันที่: " . ConvertToThaiDate($event['start_date'] ?? 'ไม่ระบุ', 0, 0) . "\n";
        $textMessage .= "ถึงวันที่: " . ConvertToThaiDate($event['end_date'] ?? 'ไม่ระบุ', 0, 0) . "\n";
        $textMessage .= "จำนวน: " . ($event['num_days'] ?? 0) . " วัน\n";
        $textMessage .= "สถานะ: " . getBookingStatusText($event['status'] ?? 'pending');
        if (!empty($event['notes'])) {
            $textMessage .= "\nหมายเหตุ: " . $event['notes'];
        }
    } elseif ($action === 'update_booking') {
        $textMessage .= "📝 อัปเดตการจองศาลา\n";
        $textMessage .= "------------------------\n";
        $textMessage .= "ศาลา: " . ($event['sala_name'] ?? 'ไม่ระบุศาลา') . "\n";
        $textMessage .= "งาน/กิจกรรม: " . ($event['event_title'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "ผู้จอง: " . ($event['booker_name'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "เบอร์โทร: " . ($event['booker_phone'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "ตั้งแต่วันที่: " . ConvertToThaiDate($event['start_date'] ?? 'ไม่ระบุ', 0, 0) . "\n";
        $textMessage .= "ถึงวันที่: " . ConvertToThaiDate($event['end_date'] ?? 'ไม่ระบุ', 0, 0) . "\n";
        $textMessage .= "จำนวน: " . ($event['num_days'] ?? 0) . " วัน\n";
        $textMessage .= "สถานะ: " . getBookingStatusText($event['status'] ?? 'pending');
        if (!empty($event['notes'])) {
            $textMessage .= "\nหมายเหตุ: " . $event['notes'];
        }
    } elseif ($action === 'delete_booking') {
        $textMessage .= "❌ ยกเลิกการจองศาลา\n";
        $textMessage .= "------------------------\n";
        $textMessage .= "ศาลา: " . ($event['sala_name'] ?? 'ไม่ระบุศาลา') . "\n";
        $textMessage .= "งาน/กิจกรรม: " . ($event['event_title'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "ผู้จอง: " . ($event['booker_name'] ?? 'ไม่ระบุ') . "\n";
        $textMessage .= "วันที่จองเดิม: " . ConvertToThaiDate($event['start_date'] ?? '', 0, 0) . " ถึง " . ConvertToThaiDate($event['end_date'] ?? '', 0, 0);
    } else {
        // Fallback for custom or direct text notifications
        $textMessage = $event['message'] ?? (is_string($event) ? $event : json_encode($event, JSON_UNESCAPED_UNICODE));
    }

    // 5. Send message via LINE Messaging API
    // Use push message if groupId is set, otherwise default to broadcasting.
    $endpoint = 'https://api.line.me/v2/bot/message/broadcast';
    $payload = [
        'messages' => [
            [
                'type' => 'text',
                'text' => $textMessage
            ]
        ]
    ];

    if (!empty($groupId)) {
        $endpoint = 'https://api.line.me/v2/bot/message/push';
        $payload['to'] = $groupId;
        logNotification("Pushing message to Group/Room ID: {$groupId}");
    } else {
        logNotification("No Group ID saved in database. Broadcasting to all followers...");
    }

    // Initialize cURL request
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Recommended for quick setup on shared servers

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_CODE);

    if (curl_errno($ch)) {
        $curlError = curl_error($ch);
        logNotification("cURL Failure: " . $curlError);
        throw new Exception("cURL Error: " . $curlError);
    }
    curl_close($ch);

    logNotification("LINE API response code: {$httpCode}, Response: {$response}");

    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Notification triggered successfully.'
        ]);
    } else {
        http_response_code($httpCode);
        echo json_encode([
            'status' => 'error',
            'message' => "LINE API returned status {$httpCode}.",
            'details' => json_decode($response, true) ?: $response
        ]);
    }
} catch (Exception $e) {
    logNotification("Notification processing error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
// Format helpers
function getEventTypeText($type)
{
    switch ($type) {
        case 'funeral':
            return 'งานศพ/สวดอภิธรรม';
        case 'ceremony':
            return 'งานทำบุญ/ศาสนพิธี';
        case 'wedding':
            return 'งานมงคลสมรส';
        case 'other':
            return 'อื่น ๆ';
        default:
            return 'ไม่ระบุ';
    }
}

function getBookingStatusText($status)
{
    switch ($status) {
        case 'pending':
            return 'รอการยืนยัน';
        case 'confirmed':
            return 'ยืนยันการจองแล้ว';
        case 'completed':
            return 'เสร็จสิ้นการใช้งาน';
        case 'cancelled':
            return 'ยกเลิกการจอง';
        default:
            return 'รอการยืนยัน';
    }
}
