<?php
/**
 * Public projects feed.
 * GET /projects.php?country=NG|CA
 * Only owner-approved, published projects are returned.
 */
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

function projectsEnabled(): bool {
    return filter_var(getenv('PROJECTS_PUBLIC_ENABLED') ?: '0', FILTER_VALIDATE_BOOLEAN);
}
if (!projectsEnabled()) json(['success' => true, 'enabled' => false, 'data' => []]);

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
$country = strtoupper(trim($_GET['country'] ?? ''));
$where = ['is_published = 1']; $params = [];
if (in_array($country, ['NG','CA'], true)) { $where[] = 'country = ?'; $params[] = $country; }
$stmt = $db->prepare('SELECT id,title,slug,summary,description,sector,country,image_url,client_name,project_year,sort_order FROM projects WHERE '.implode(' AND ', $where).' ORDER BY sort_order ASC, project_year DESC, id DESC');
$stmt->execute($params);
json(['success' => true, 'enabled' => true, 'data' => $stmt->fetchAll()]);
