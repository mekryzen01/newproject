<?php
/**
 * Email OTP Sender Endpoint for Host watdongsedthee.com
 * Sender: watdongs@watdongsedthee.com
 * Location: /line_oa_php/send_otp.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['email']) || !isset($data['code'])) {
    echo json_encode(['error' => 'Missing parameters: email or code']);
    exit();
}

$to = trim($data['email']);
$code = trim($data['code']);
$senderEmail = 'watdongs@watdongsedthee.com';
$senderName = 'วัดดงหนองเป็ด พระเจ้ามหาเศรษฐี (Watdong OS)';
$subject = isset($data['subject']) ? $data['subject'] : "🔑 รหัสยืนยัน OTP: {$code} - ระบบบริหารจัดการวัดดงหนองเป็ด พระเจ้ามหาเศรษฐี";

$htmlMessage = isset($data['html']) ? $data['html'] : "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
</head>
<body style='font-family: Sarabun, sans-serif; background-color: #FAF9F5; padding: 20px;'>
    <div style='max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; border: 1px solid #FDE68A;'>
        <h2 style='color: #78350F; text-align: center;'>🙏 วัดดงหนองเป็ด พระเจ้ามหาเศรษฐี (Watdong OS)</h2>
        <h3 style='text-align: center; color: #D97706;'>รหัสยืนยัน OTP สำหรับกู้คืนรหัสผ่าน</h3>
        <div style='background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;'>
            <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #78350F;'>{$code}</span>
        </div>
        <p style='font-size: 13px; color: #78716C; text-align: center;'>⏱️ รหัสนี้มีอายุการใช้งาน 5 นาที</p>
    </div>
</body>
</html>
";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=utf-8';
$headers[] = "From: {$senderName} <{$senderEmail}>";
$headers[] = "Reply-To: {$senderEmail}";
$headers[] = 'X-Mailer: PHP/' . phpversion();

$mailSent = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlMessage, implode("\r\n", $headers));

if ($mailSent) {
    echo json_encode(['success' => true, 'message' => "OTP Sent to {$to} from {$senderEmail}"]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send mail via host PHP mail()']);
}
