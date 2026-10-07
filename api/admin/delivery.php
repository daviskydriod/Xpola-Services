<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Ensure delivery_fees table exists
$db->exec("CREATE TABLE IF NOT EXISTS delivery_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

if ($method === 'GET') {
    $stmt = $db->query("SELECT id, area, state, country, fee, is_active as isActive FROM delivery_fees ORDER BY country, state, area");
    $zones = $stmt->fetchAll();
    
    // Typecast boolean for frontend
    foreach ($zones as &$z) {
        $z['isActive'] = (bool)$z['isActive'];
        $z['fee'] = (float)$z['fee'];
    }
    
    echo json_encode($zones);
    exit;
}

if ($method === 'POST') {
    $body = getBody();
    $area    = trim($body['area'] ?? '');
    $state   = trim($body['state'] ?? '');
    $country = strtoupper(trim($body['country'] ?? 'NG'));
    $fee     = (float)($body['fee'] ?? 0);
    
    if (!$area || !$state) {
        http_response_code(400);
        echo json_encode(['error' => 'Area and state required']);
        exit;
    }
    
    $stmt = $db->prepare("INSERT INTO delivery_fees (area, state, country, fee) VALUES (?, ?, ?, ?)");
    $stmt->execute([$area, $state, $country, $fee]);
    
    echo json_encode(['success' => true, 'id' => (int)$db->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }
    
    $body = getBody();
    $area    = trim($body['area'] ?? '');
    $state   = trim($body['state'] ?? '');
    $country = strtoupper(trim($body['country'] ?? ''));
    $fee     = isset($body['fee']) ? (float)$body['fee'] : null;
    $active  = isset($body['isActive']) ? (int)(bool)$body['isActive'] : null;
    
    $updates = [];
    $params = [];
    
    if ($area)    { $updates[] = "area=?";    $params[] = $area; }
    if ($state)   { $updates[] = "state=?";   $params[] = $state; }
    if ($country) { $updates[] = "country=?"; $params[] = $country; }
    if ($fee !== null)    { $updates[] = "fee=?";     $params[] = $fee; }
    if ($active !== null) { $updates[] = "is_active=?"; $params[] = $active; }
    
    if (!$updates) {
        http_response_code(400);
        echo json_encode(['error' => 'Nothing to update']);
        exit;
    }
    
    $params[] = $id;
    $sql = "UPDATE delivery_fees SET " . implode(', ', $updates) . " WHERE id=?";
    $db->prepare($sql)->execute($params);
    
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }
    
    $db->prepare("DELETE FROM delivery_fees WHERE id=?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
