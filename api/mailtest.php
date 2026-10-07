<?php
/**
 * UPLOAD TO: /public_html/api/mailtest.php
 * ACCESS:    https://xpolaservices.com/api/mailtest.php
 * DELETE AFTER USE.
 */
echo "<pre>\n";
echo "=== Xpola Mail Test ===\n\n";

$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    die("FAIL: vendor/autoload.php not found at: $autoload\n");
}
require_once $autoload;
echo "OK: autoload.php loaded\n";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    die("FAIL: PHPMailer class not found — check src files exist\n");
}
echo "OK: PHPMailer class found\n\n";

$mail = new PHPMailer(true);
try {
    $mail->SMTPDebug   = 3;
    $mail->Debugoutput = function($str, $level) {
        echo htmlspecialchars("[SMTP] $str");
    };

    $mail->isSMTP();
    $mail->Host       = getenv('MAIL_HOST') ?: '';
    $mail->SMTPAuth   = true;
    $mail->Username   = getenv('MAIL_USERNAME') ?: '';
    $mail->Password   = getenv('MAIL_PASSWORD') ?: '';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = (int)(getenv('MAIL_PORT') ?: 465);
    $mail->CharSet    = 'UTF-8';
    $mail->SMTPOptions = [
        'ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true,
        ]
    ];

    $mail->setFrom('noreply@xpolaservices.com', 'Xpola Services');
    $mail->addAddress('nosyradigital@gmail.com'); // change to your real email
    $mail->isHTML(true);
    $mail->Subject = 'Xpola Mail Test';
    $mail->Body    = '<p>If you see this, SMTP is working!</p>';
    $mail->AltBody = 'If you see this, SMTP is working!';

    $mail->send();
    echo "\n\nSUCCESS: Email sent!\n";
} catch (Exception $e) {
    echo "\n\nFAIL: " . htmlspecialchars($mail->ErrorInfo) . "\n";
}
echo "</pre>";
