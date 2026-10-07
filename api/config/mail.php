<?php
/**
 * config/mail.php — Xpola Services PHPMailer SMTP
 */
require_once __DIR__ . '/../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (!defined('MAIL_HOST')) define('MAIL_HOST', getenv('MAIL_HOST') ?: 'mail.xpolaservices.com');
if (!defined('MAIL_PORT')) define('MAIL_PORT', (int)(getenv('MAIL_PORT') ?: 465));
if (!defined('MAIL_USERNAME')) define('MAIL_USERNAME', getenv('MAIL_USERNAME') ?: 'noreply@xpolaservices.com');
if (!defined('MAIL_PASSWORD')) define('MAIL_PASSWORD', getenv('MAIL_PASSWORD') ?: '');
if (!defined('MAIL_FROM_NAME')) define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Xpola Services');
if (!defined('MAIL_ENCRYPTION')) define('MAIL_ENCRYPTION', getenv('MAIL_ENCRYPTION') ?: 'ssl');
if (!defined('APP_URL')) define('APP_URL', getenv('APP_URL') ?: 'https://xpolaservices.com');










function sendMail(string $to, string $subject, string $body, ?string $toName = null): bool {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = MAIL_ENCRYPTION === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = MAIL_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer'      => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ]
        ];
        $mail->setFrom(MAIL_USERNAME, MAIL_FROM_NAME);
        $mail->addAddress($to, $toName ?? $to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags(str_replace(['<br>','<br/>','<br />'], "\n", $body));
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('[Xpola Mail] Error to ' . $to . ': ' . $mail->ErrorInfo);
        return false;
    }
}

function mailTemplate(string $title, string $content): string {
    $brand = MAIL_FROM_NAME;
    $year  = date('Y');
    return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>{$title}</title></head>
<body style='margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0'>
    <tr><td align='center' style='padding:30px 16px;'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;max-width:600px;box-shadow:0 2px 8px rgba(0,0,0,.08);'>
        <tr><td style='background:#1a1a2e;padding:28px 32px;text-align:center;'>
          <h1 style='color:#fff;margin:0;font-size:24px;font-weight:800;'>{$brand}</h1>
          <p style='color:#E02020;margin:4px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;'>Bridging Markets · Delivering Value</p>
        </td></tr>
        <tr><td style='padding:36px 32px;color:#333;font-size:15px;line-height:1.7;'>
          <h2 style='color:#1a1a2e;margin-top:0;font-size:20px;font-weight:700;'>{$title}</h2>
          {$content}
        </td></tr>
        <tr><td style='background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;'>
          <p style='color:#999;font-size:12px;margin:0 0 6px;'>&copy; {$year} {$brand}. All rights reserved.</p>
          <p style='color:#bbb;font-size:11px;margin:0;'>Nigeria · Canada | <a href='mailto:support@xpolaservices.com' style='color:#E02020;text-decoration:none;'>support@xpolaservices.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>";
}
