<?php
// api/admin/orders.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));
$adminPayload = requireAdmin();

$db = getDB();

// Ensure orders table exists to avoid 500 error.
$db->exec("CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_ref VARCHAR(255) NOT NULL,
    uid VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    delivery_address TEXT,
    delivery_city VARCHAR(255),
    delivery_state VARCHAR(255),
    delivery_area VARCHAR(255),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    country ENUM('NG', 'CA') DEFAULT 'NG',
    payment_ref VARCHAR(255),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed') DEFAULT 'pending',
    items_json TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
try {
    $db->exec("ALTER TABLE orders MODIFY status ENUM('pending','paid','processing','shipped','delivered','cancelled','failed') DEFAULT 'pending'");
} catch (Throwable $e) {
    error_log('[Xpola Admin Orders] status migration: ' . $e->getMessage());
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    if ($id) {
        $s = $db->prepare("SELECT * FROM orders WHERE id=? LIMIT 1");
        $s->execute([$id]);
        $o = $s->fetch();
        if (!$o) {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            exit;
        }
        $o['items'] = json_decode($o['items_json'] ?? '[]', true);
        echo json_encode(['success' => true, 'data' => $o]);
        exit;
    }

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(200, max(1, (int)($_GET['per_page'] ?? 50)));
    $status = trim($_GET['status'] ?? '');
    $country = strtoupper(trim($_GET['country'] ?? ''));
    $paymentStatus = strtolower(trim($_GET['payment_status'] ?? ''));
    $dateFrom = trim($_GET['dateFrom'] ?? '');
    $dateTo = trim($_GET['dateTo'] ?? '');
    $where = [];
    $params = [];

    if ($status === 'failed') {
        $where[] = "(status='failed' OR payment_status IN ('failed','declined','cancelled'))";
    } elseif ($status === 'paid') {
        $where[] = "(status='paid' OR payment_status IN ('paid','success','captured'))";
    } elseif ($status) {
        $where[] = 'status=?';
        $params[] = $status;
    }
    if ($country && in_array($country, ['NG', 'CA'], true)) {
        $where[] = 'country=?';
        $params[] = $country;
    }
    if ($paymentStatus && in_array($paymentStatus, ['pending', 'paid', 'failed'], true)) {
        $where[] = 'payment_status=?';
        $params[] = $paymentStatus;
    }
    if ($dateFrom !== '') {
        $d = DateTime::createFromFormat('Y-m-d', $dateFrom);
        if (!$d || $d->format('Y-m-d') !== $dateFrom) jsonError('Invalid dateFrom; expected YYYY-MM-DD');
        $where[] = 'created_at >= ?';
        $params[] = $dateFrom . ' 00:00:00';
    }
    if ($dateTo !== '') {
        $d = DateTime::createFromFormat('Y-m-d', $dateTo);
        if (!$d || $d->format('Y-m-d') !== $dateTo) jsonError('Invalid dateTo; expected YYYY-MM-DD');
        $where[] = 'created_at <= ?';
        $params[] = $dateTo . ' 23:59:59';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $count = $db->prepare("SELECT COUNT(*) FROM orders $whereSql");
    $count->execute($params);
    $total = (int)$count->fetchColumn();

    $stmt = $db->prepare("SELECT id,order_ref,uid,customer_name,customer_email,customer_phone,delivery_city,delivery_state,delivery_area,subtotal,total_amount,currency,country,payment_status,status,created_at FROM orders $whereSql ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute([...$params, $perPage, ($page - 1) * $perPage]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $payment = strtolower((string)($row['payment_status'] ?? ''));
        if (in_array($payment, ['failed', 'declined', 'cancelled'], true)) {
            $row['status'] = 'failed';
        } elseif (in_array($payment, ['paid', 'success', 'captured'], true) && $row['status'] === 'pending') {
            $row['status'] = 'paid';
        }
    }
    unset($row);

    echo json_encode([
        'success' => true,
        'data' => $rows,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage),
        ],
    ]);
    exit;
}

if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }

    $body = getBody();
    $status = trim($body['status'] ?? '');
    $valid = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
    if (!in_array($status, $valid, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        exit;
    }

    // An unpaid pending order is Awaiting Payment and cannot be changed by an admin.
    // Paystack verification/webhooks are the only path that may confirm payment.
    $current = $db->prepare('SELECT status, payment_status FROM orders WHERE id=? LIMIT 1');
    $current->execute([$id]);
    $order = $current->fetch();
    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit;
    }
    if ($order['status'] === 'pending' && $order['payment_status'] !== 'paid') {
        http_response_code(409);
        echo json_encode([
            'error' => 'Order is awaiting payment and cannot be changed until Paystack confirms payment.',
            'status' => 'pending',
            'payment_status' => $order['payment_status'],
        ]);
        exit;
    }

    $db->prepare("UPDATE orders SET status=?, payment_status=CASE WHEN ?='failed' THEN 'failed' WHEN ?='paid' THEN 'paid' ELSE payment_status END,updated_at=NOW() WHERE id=?")
        ->execute([$status, $status, $status, $id]);
    logAudit($db, $adminPayload, 'UPDATE_ORDER_STATUS', 'order', "Order id=$id status changed to $status");
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }
    $check = $db->prepare('SELECT id FROM orders WHERE id=? LIMIT 1');
    $check->execute([$id]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit;
    }
    $db->prepare('DELETE FROM orders WHERE id=?')->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Order deleted']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
