<?php
/**
 * FILE PATH: api/admin/audit_helper.php
 * Include this in any admin endpoint that needs to log actions.
 *
 * Usage:
 *   require_once __DIR__ . '/audit_helper.php';
 *   logAudit($db, $adminPayload, 'CREATE', 'product', 'Created product: iPhone 15');
 */

if (!function_exists('logAudit')) {
    function logAudit(PDO $db, array $adminPayload, string $action, string $target, string $details = ''): void {
        try {
            if (function_exists('ensureAuditSchema')) ensureAuditSchema($db);
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR']
                ?? $_SERVER['REMOTE_ADDR']
                ?? null;
            $db->prepare("INSERT INTO audit_logs (admin_id, action, target, details, ip_address)
                          VALUES (?, ?, ?, ?, ?)")
               ->execute([
                   $adminPayload['admin_id'] ?? null,
                   strtoupper($action),
                   $target,
                   $details,
                   $ip,
               ]);
        } catch (Throwable $e) {
            // Never let audit logging kill a request
        }
    }
}

if (!function_exists('ensureAuditSchema')) {
    function ensureAuditSchema(PDO $db): void {
        static $ready = false;
        if ($ready) return;
        $db->exec("CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NULL,
            actor_type VARCHAR(20) NOT NULL DEFAULT 'system',
            actor_id VARCHAR(128) NULL,
            actor_name VARCHAR(190) NULL,
            actor_email VARCHAR(255) NULL,
            action VARCHAR(100) NOT NULL DEFAULT '',
            target VARCHAR(255) NOT NULL DEFAULT '',
            details TEXT NULL,
            ip_address VARCHAR(45) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_created_at (created_at),
            INDEX idx_audit_actor (actor_type, actor_id),
            INDEX idx_audit_action (action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        foreach ([
            'actor_type' => "VARCHAR(20) NOT NULL DEFAULT 'system'",
            'actor_id' => 'VARCHAR(128) NULL',
            'actor_name' => 'VARCHAR(190) NULL',
            'actor_email' => 'VARCHAR(255) NULL',
        ] as $column => $definition) {
            try { $db->exec("ALTER TABLE audit_logs ADD COLUMN {$column} {$definition}"); } catch (Throwable $e) {}
        }
        $ready = true;
    }
}

if (!function_exists('logActivity')) {
    function logActivity(PDO $db, string $actorType, ?string $actorId, ?string $actorName, ?string $actorEmail, string $action, ?string $target = null, string $details = '', ?int $adminId = null): void {
        try {
            ensureAuditSchema($db);
            $db->prepare("INSERT INTO audit_logs (admin_id, actor_type, actor_id, actor_name, actor_email, action, target, details, ip_address) VALUES (?,?,?,?,?,?,?,?,?)")
               ->execute([$adminId, $actorType, $actorId, $actorName, $actorEmail, strtoupper($action), $target ?? '', $details, $_SERVER['REMOTE_ADDR'] ?? null]);
        } catch (Throwable $e) { error_log('[Xpola Audit] ' . $e->getMessage()); }
    }
}
