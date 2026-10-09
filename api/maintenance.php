<?php
/** Public read-only maintenance status. Admin writes remain in /admin/maintenance.php. */
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
set_exception_handler(fn(Throwable $e) => json(['error' => 'Maintenance status unavailable'], 500));
if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonError('Method not allowed', 405);
$db = getDB();
$db->exec("CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$get = function (string $key, string $default = '') use ($db): string {
    $stmt = $db->prepare('SELECT `value` FROM site_settings WHERE `key` = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (string)$row['value'] : $default;
};
$enabled = $get('maintenance_enabled', '0') === '1';
$message = $get('maintenance_message', "We're performing scheduled maintenance. We'll be back shortly!");
$estimated = $get('maintenance_estimated_back', '');
json(['enabled' => $enabled, 'maintenance' => $enabled, 'message' => $message, 'estimatedBack' => $estimated ?: null]);
