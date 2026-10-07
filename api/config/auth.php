<?php
/**
 * FILE PATH: api/config/auth.php
 * Provides: requireAuth(), requireAdmin(), generateToken(), verifyToken(), getBearerToken()
 *
 * NOTE: jwt() and jsonError() are already defined in config/db.php —
 *       this file MUST be required AFTER config/db.php.
 */

// JWT_SECRET may already be defined if this file is included more than once
if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', getenv('JWT_SECRET') ?: '');
}

// ── Generate a signed token ───────────────────────────────────────────────────
if (!function_exists('generateToken')) {
    function generateToken(array $payload): string {
        if (JWT_SECRET === '') throw new RuntimeException('JWT_SECRET is not configured');
        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24 * 30); // 30 days
        $data      = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $data, JWT_SECRET);
        return $data . '.' . $signature;
    }
}

// ── Verify and decode a token ─────────────────────────────────────────────────
if (!function_exists('verifyToken')) {
    function verifyToken(string $token): ?array {
        if (JWT_SECRET === '') return null;
        $parts = explode('.', $token);
        if (count($parts) !== 2) return null;

        [$data, $sig] = $parts;
        $expected = hash_hmac('sha256', $data, JWT_SECRET);
        if (!hash_equals($expected, $sig)) return null;

        $payload = json_decode(base64_decode($data), true);
        if (!is_array($payload)) return null;

        if (isset($payload['exp']) && $payload['exp'] < time()) return null;

        return $payload;
    }
}

// ── Extract Bearer token from headers ────────────────────────────────────────
if (!function_exists('getBearerToken')) {
    function getBearerToken(): ?string {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['Authorization'])) {
            $headers = $_SERVER['Authorization'];
        } elseif (function_exists('apache_request_headers')) {
            $req     = apache_request_headers();
            $headers = $req['Authorization'] ?? $req['authorization'] ?? '';
        }
        if (preg_match('/Bearer\s+(.+)/i', $headers, $m)) {
            return trim($m[1]);
        }
        return null;
    }
}

// ── Require authenticated user ────────────────────────────────────────────────
if (!function_exists('requireAuth')) {
    function requireAuth(): array {
        $token = getBearerToken();
        if (!$token) jsonError('Unauthorized — no token', 401);

        $payload = verifyToken($token);
        if (!$payload || empty($payload['uid'])) {
            jsonError('Invalid or expired token', 401);
        }

        return $payload;
    }
}

// ── Require authenticated admin ───────────────────────────────────────────────
if (!function_exists('requireAdmin')) {
    function requireAdmin(): array {
        $token = getBearerToken();
        if (!$token) jsonError('Unauthorized — no token', 401);

        $payload = verifyToken($token);
        if (!$payload || empty($payload['admin_id'])) {
            jsonError('Admin access required', 401);
        }

        return $payload;
    }
}
