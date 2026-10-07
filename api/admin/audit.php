<?php
/** Unified admin/user/system activity log. */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => 'Server error'], 500));

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
ensureAuditSchema($db);
if ($method !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$payload = requireAdmin();
if (empty($payload['is_super_admin'])) { http_response_code(403); echo json_encode(['error' => 'Super admin access required']); exit; }
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(500, max(1, (int)($_GET['limit'] ?? $_GET['per_page'] ?? 100)));
$scope = strtolower(trim((string)($_GET['scope'] ?? 'all')));
$filter = trim((string)($_GET['admin'] ?? $_GET['actor'] ?? ''));
$action = strtoupper(trim((string)($_GET['action'] ?? '')));
$where = [];
$params = [];
if (in_array($scope, ['admin','user','system'], true)) { $where[] = 'al.actor_type=?'; $params[] = $scope; }
if ($filter !== '') { $where[] = '(a.username LIKE ? OR al.actor_name LIKE ? OR al.actor_email LIKE ? OR al.actor_id LIKE ?)'; $like = '%' . $filter . '%'; array_push($params, $like, $like, $like, $like); }
if ($action !== '') { $where[] = 'al.action=?'; $params[] = $action; }
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$count = $db->prepare("SELECT COUNT(*) FROM audit_logs al LEFT JOIN admins a ON a.id=al.admin_id {$whereSql}");
$count->execute($params);
$total = (int)$count->fetchColumn();
$sql = "SELECT al.id, al.admin_id AS adminId,
    COALESCE(al.actor_type, CASE WHEN al.admin_id IS NULL THEN 'system' ELSE 'admin' END) AS actorType,
    al.actor_id AS actorId, COALESCE(al.actor_name, a.username) AS actorName,
    al.actor_email AS actorEmail, COALESCE(a.username, al.actor_name) AS adminUsername,
    al.action, al.target, al.details, al.ip_address AS ipAddress, al.created_at AS createdAt
    FROM audit_logs al LEFT JOIN admins a ON a.id=al.admin_id {$whereSql}
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
$stmt = $db->prepare($sql);
$stmt->execute([...$params, $perPage, ($page - 1) * $perPage]);
json(['success' => true, 'data' => $stmt->fetchAll(), 'total' => $total, 'pagination' => ['page' => $page, 'per_page' => $perPage, 'last_page' => (int)ceil($total / $perPage)]]);
