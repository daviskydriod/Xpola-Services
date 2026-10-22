<?php
/**
 * Load private backend environment values from api/.env when present.
 *
 * Server-provided environment variables always win. This keeps production
 * secrets in the hosting provider's environment while allowing local PHP
 * development with a private api/.env file.
 */
if (defined('XPOLA_ENV_LOADED')) {
    return;
}
define('XPOLA_ENV_LOADED', true);

$envFiles = [
    dirname(__DIR__) . '/.env',       // api/.env
    dirname(__DIR__, 2) . '/.env',    // optional project-level .env
];

foreach ($envFiles as $envFile) {
    if (!is_readable($envFile)) {
        continue;
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        continue;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if ($name === '' || !preg_match('/^[A-Z][A-Z0-9_]*$/', $name)) {
            continue;
        }

        // Remove matching single or double quotes from values.
        if (strlen($value) >= 2) {
            $first = $value[0];
            $last = $value[strlen($value) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $value = substr($value, 1, -1);
            }
        }

        // Hosting/server environment values take precedence over .env values.
        if (getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
    }
}
