<?php
/** Staff newsletter subscriber management. */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';

$adminPayload = requireAdmin();
$db = getDB();
$db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(5) NOT NULL DEFAULT 'NG',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
try { $db->exec('ALTER TABLE newsletter_subscribers DROP COLUMN confirmed'); } catch (Throwable $ignored) {}
$rows = $db->query('SELECT id,email,country,created_at FROM newsletter_subscribers ORDER BY created_at DESC,id DESC')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as &$row) $row['id'] = (int)$row['id'];
unset($row);

if (($_GET['action'] ?? '') === 'export') {
    logAudit($db, $adminPayload, 'EXPORT_NEWSLETTER_SUBSCRIBERS', 'newsletter', 'Exported newsletter subscriber list as CSV');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="xpola-newsletter-subscribers-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Email', 'Country', 'Subscribed At']);
    foreach ($rows as $row) fputcsv($out, [$row['email'], $row['country'], $row['created_at']]);
    fclose($out);
    exit;
}
header('Content-Type: application/json');
echo json_encode(['success'=>true, 'data'=>$rows, 'total'=>count($rows)]);
