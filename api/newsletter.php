<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/mail.php';
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit; }
$db = getDB();
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = filter_var(trim((string)($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$country = strtoupper(trim((string)($body['country'] ?? 'NG')));
if (!$email) { http_response_code(422); echo json_encode(['error'=>'Enter a valid email address.']); exit; }
$db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(5) NOT NULL DEFAULT 'NG',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
// Older installations had a confirmed column, but no confirmation workflow.
try { $db->exec('ALTER TABLE newsletter_subscribers DROP COLUMN confirmed'); } catch (Throwable $ignored) {}
$stmt = $db->prepare('INSERT INTO newsletter_subscribers (email,country) VALUES (?,?) ON DUPLICATE KEY UPDATE country=VALUES(country)');
$stmt->execute([$email, in_array($country,['NG','CA'],true) ? $country : 'NG']);
try { sendMail($email,'Welcome to Xpola Services','<p>Thanks for subscribing to Xpola Services updates.</p>'); } catch (Throwable $e) { error_log('[Xpola newsletter] '.$e->getMessage()); }
$adminEmail = getenv('MAIL_ADMIN_EMAIL') ?: getenv('MAIL_USERNAME');
if ($adminEmail) { try { sendMail($adminEmail,'New Xpola newsletter subscriber','<p>New subscriber: '.htmlspecialchars($email, ENT_QUOTES, 'UTF-8').'</p>'); } catch (Throwable $e) { error_log('[Xpola newsletter admin] '.$e->getMessage()); } }
echo json_encode(['success'=>true]);
