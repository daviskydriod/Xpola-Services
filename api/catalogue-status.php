<?php
/** Public read-only catalogue status. Owner/staff changes are made through /admin/settings.php. */
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
set_exception_handler(fn(Throwable $e) => json(['error' => 'Catalogue status unavailable'], 500));
if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonError('Method not allowed', 405);
$db = getDB();
$db->exec("CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$stmt = $db->prepare("SELECT `value` FROM site_settings WHERE `key` = 'catalogue_mode'");
$stmt->execute();
$mode = (string)($stmt->fetchColumn() ?: 'sample');
if (!in_array($mode, ['sample', 'live'], true)) $mode = 'sample';
json(['mode' => $mode, 'isLive' => $mode === 'live']);
