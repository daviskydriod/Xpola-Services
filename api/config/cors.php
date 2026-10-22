<?php
require_once __DIR__ . '/env.php';
/**
 * config/cors.php — CORS headers
 */
$configuredOrigins = getenv('CORS_ALLOWED_ORIGINS') ?: getenv('FRONTEND_URL') ?: '';
$allowed = array_values(array_filter(array_map('trim', explode(',', $configuredOrigins))));
$allowed = array_values(array_unique(array_merge($allowed, [
    'https://xpolaservices.com',
    'https://www.xpolaservices.com',
])));

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); exit;
}
