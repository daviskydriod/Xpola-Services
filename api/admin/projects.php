<?php
/**
 * Admin project management.
 * GET    /admin/projects.php                 list all drafts and published records
 * POST   /admin/projects.php                 create
 * PUT    /admin/projects.php?id=N            update
 * DELETE /admin/projects.php?id=N            delete
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));
$admin = requireAdmin();
$db = getDB();
$db->exec("CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  summary TEXT NULL,
  description TEXT NULL,
  sector VARCHAR(120) NULL,
  country ENUM('NG','CA') NOT NULL DEFAULT 'NG',
  image_url VARCHAR(500) NULL,
  client_name VARCHAR(255) NULL,
  project_year VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_public (is_published, country, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)($_GET['id'] ?? 0);
$body = getBody();

function projectSlug(string $title): string {
    $slug = strtolower(trim((string)preg_replace('/[^a-z0-9]+/i', '-', $title), '-'));
    return $slug ?: 'project-' . time();
}
function projectData(array $b): array {
    $title = trim((string)($b['title'] ?? ''));
    $country = in_array($b['country'] ?? '', ['NG','CA'], true) ? $b['country'] : 'NG';
    return [$title, projectSlug($title), trim((string)($b['summary'] ?? '')), trim((string)($b['description'] ?? '')), trim((string)($b['sector'] ?? '')), $country, trim((string)($b['image_url'] ?? '')), trim((string)($b['client_name'] ?? '')), trim((string)($b['project_year'] ?? '')), (int)($b['sort_order'] ?? 0), (int)(bool)($b['is_published'] ?? false)];
}
if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM projects ORDER BY is_published DESC, sort_order ASC, id DESC');
    json(['success' => true, 'data' => $stmt->fetchAll()]);
}
if ($method === 'POST' || $method === 'PUT') {
    [$title,$slug,$summary,$description,$sector,$country,$image,$client,$year,$sort,$published] = projectData($body);
    if ($title === '') jsonError('Project title is required', 400);
    if ($method === 'POST') {
        $stmt = $db->prepare('INSERT INTO projects (title,slug,summary,description,sector,country,image_url,client_name,project_year,sort_order,is_published) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([$title,$slug,$summary ?: null,$description ?: null,$sector ?: null,$country,$image ?: null,$client ?: null,$year ?: null,$sort,$published]);
        $id = (int)$db->lastInsertId();
        logAudit($db, $admin, 'CREATE', 'project', "Created project: $title (id=$id)");
        json(['success' => true, 'id' => $id], 201);
    }
    if (!$id) jsonError('Project ID required', 400);
    $stmt = $db->prepare('UPDATE projects SET title=?,slug=?,summary=?,description=?,sector=?,country=?,image_url=?,client_name=?,project_year=?,sort_order=?,is_published=? WHERE id=?');
    $stmt->execute([$title,$slug,$summary ?: null,$description ?: null,$sector ?: null,$country,$image ?: null,$client ?: null,$year ?: null,$sort,$published,$id]);
    if ($stmt->rowCount() === 0) { $check = $db->prepare('SELECT id FROM projects WHERE id=?'); $check->execute([$id]); if (!$check->fetch()) jsonError('Project not found', 404); }
    logAudit($db, $admin, 'UPDATE', 'project', "Updated project: $title (id=$id)");
    json(['success' => true]);
}
if ($method === 'DELETE') {
    if (!$id) jsonError('Project ID required', 400);
    $stmt = $db->prepare('DELETE FROM projects WHERE id=?'); $stmt->execute([$id]);
    if ($stmt->rowCount() < 1) jsonError('Project not found', 404);
    logAudit($db, $admin, 'DELETE', 'project', "Deleted project (id=$id)");
    json(['success' => true]);
}
jsonError('Method not allowed', 405);
