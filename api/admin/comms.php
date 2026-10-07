<?php
/**
 * FILE PATH: api/admin/comms.php
 * Broadcast email to customers — POST ?action=broadcast
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/mail.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── POST broadcast ────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'broadcast') {
    $b        = getBody();
    $subject  = trim($b['subject']  ?? '');
    $body     = trim($b['body']     ?? '');
    $audience = trim($b['audience'] ?? 'all'); // all | NG | CA

    if (!$subject || !$body) jsonError('Subject and body are required');

    // Collect recipient emails
    $where = '';
    if ($audience === 'NG') $where = "WHERE country = 'NG'";
    if ($audience === 'CA') $where = "WHERE country = 'CA'";

    // Try users table first, fall back to distinct order emails
    try {
        $stmt = $db->query("SELECT DISTINCT email FROM users $where");
    } catch (Throwable) {
        $col  = $audience !== 'all' ? "AND country = '" . $db->quote($audience) . "'" : '';
        $stmt = $db->query("SELECT DISTINCT customer_email as email FROM orders WHERE 1=1 $col");
    }
    $recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $htmlBody = mailTemplate($subject, nl2br(htmlspecialchars($body)));
    $sent = 0;
    foreach ($recipients as $email) {
        if (sendMail($email, $subject, $htmlBody)) {
            $sent++;
        }
    }

    json(['sent' => $sent]);
}

json(['error' => 'Unknown action or method'], 405);
