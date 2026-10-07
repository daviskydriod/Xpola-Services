<?php
/**
 * config/db.php — PDO connection + JSON helpers
 * Set these as environment variables in cPanel or .htaccess:
 *   SetEnv DB_HOST localhost
 *   SetEnv DB_NAME xpola_db
 *   SetEnv DB_USER xpola_user
 *   SetEnv DB_PASS your_password
 *   SetEnv JWT_SECRET a_long_random_string
 */



if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'omodiafa_xpola_db');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'omodiafa_xpola_user');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: '');
if (!defined('DB_PORT')) define('DB_PORT', getenv('DB_PORT') ?: '3306');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = "mysql:host=".DB_HOST.";port=".DB_PORT.";dbname=".DB_NAME.";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

function json(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $message, int $code = 400): void {
    json(['error' => $message], $code);
}

function getBody(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
