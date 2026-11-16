<?php
declare(strict_types=1);

// Временный скрипт инициализации БД. Запустить один раз, затем УДАЛИТЬ.
require dirname(__DIR__) . '/db.php';

$pdo = db();

$ddl = [
    "CREATE TABLE IF NOT EXISTS lists (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    "CREATE TABLE IF NOT EXISTS todos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        list_id INT UNSIGNED NOT NULL,
        text VARCHAR(500) NOT NULL,
        completed TINYINT(1) NOT NULL DEFAULT 0,
        priority TINYINT NOT NULL DEFAULT 0,
        due_date DATE NULL,
        tags JSON NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_todos_list FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
        INDEX idx_list_pos (list_id, position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
];

foreach ($ddl as $sql) {
    $pdo->exec($sql);
}

$cnt = (int) $pdo->query('SELECT COUNT(*) FROM lists')->fetchColumn();
if ($cnt === 0) {
    $pdo->exec("INSERT INTO lists (name, position) VALUES ('Входящие', 0)");
}

echo "OK";
