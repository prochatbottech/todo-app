<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require dirname(__DIR__, 2) . '/db.php';

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): void
{
    out(['ok' => false, 'error' => $msg], $code);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function todoOut(array $r): array
{
    $tags = $r['tags'] ?? null;
    if (is_string($tags) && $tags !== '') {
        $dec = json_decode($tags, true);
        $tags = is_array($dec) ? $dec : [];
    } elseif (!is_array($tags)) {
        $tags = [];
    }
    return [
        'id'         => (int) $r['id'],
        'list_id'    => (int) $r['list_id'],
        'text'       => (string) $r['text'],
        'completed'  => (bool) $r['completed'],
        'priority'   => (int) $r['priority'],
        'due_date'   => $r['due_date'] ? (string) $r['due_date'] : null,
        'tags'       => array_values(array_map('strval', $tags)),
        'position'   => (int) $r['position'],
        'created_at' => (string) $r['created_at'],
    ];
}

function normalizeTags(mixed $tags): array
{
    if (!is_array($tags)) {
        return [];
    }
    return array_values(array_filter(array_map('strval', $tags), fn($t) => trim($t) !== ''));
}

/* ---------- lists ---------- */

function listLists(PDO $pdo): void
{
    $rows = $pdo->query(
        "SELECT l.id, l.name, l.position,
                (SELECT COUNT(*) FROM todos t WHERE t.list_id = l.id) AS total,
                (SELECT COUNT(*) FROM todos t WHERE t.list_id = l.id AND t.completed = 0) AS active
         FROM lists l ORDER BY l.position, l.id"
    )->fetchAll();

    out(['ok' => true, 'lists' => array_map(function ($r) {
        return [
            'id'       => (int) $r['id'],
            'name'     => $r['name'],
            'position' => (int) $r['position'],
            'total'    => (int) $r['total'],
            'active'   => (int) $r['active'],
        ];
    }, $rows)]);
}

function createList(PDO $pdo): void
{
    $b = body();
    $name = trim((string) ($b['name'] ?? ''));
    if ($name === '') {
        fail('Пустое имя списка');
    }
    $max = (int) $pdo->query('SELECT COALESCE(MAX(position), -1) FROM lists')->fetchColumn();
    $st = $pdo->prepare('INSERT INTO lists (name, position) VALUES (?, ?)');
    $st->execute([$name, $max + 1]);
    out(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
}

function renameList(PDO $pdo, int $id): void
{
    $b = body();
    $name = trim((string) ($b['name'] ?? ''));
    if ($name === '') {
        fail('Пустое имя списка');
    }
    $st = $pdo->prepare('UPDATE lists SET name = ? WHERE id = ?');
    $st->execute([$name, $id]);
    out(['ok' => true]);
}

function deleteList(PDO $pdo, int $id): void
{
    $st = $pdo->prepare('DELETE FROM lists WHERE id = ?');
    $st->execute([$id]);
    out(['ok' => true]);
}

function reorderLists(PDO $pdo): void
{
    $ids = body()['ordered_ids'] ?? null;
    if (!is_array($ids)) {
        fail('ordered_ids должен быть массивом');
    }
    $st = $pdo->prepare('UPDATE lists SET position = ? WHERE id = ?');
    $pdo->beginTransaction();
    try {
        foreach ($ids as $i => $id) {
            $st->execute([$i, (int) $id]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    out(['ok' => true]);
}

/* ---------- todos ---------- */

function listTodos(PDO $pdo, int $listId): void
{
    $st = $pdo->prepare('SELECT * FROM todos WHERE list_id = ? ORDER BY position, id');
    $st->execute([$listId]);
    out(['ok' => true, 'todos' => array_map('todoOut', $st->fetchAll())]);
}

function createTodo(PDO $pdo, int $listId): void
{
    $b = body();
    $text = trim((string) ($b['text'] ?? ''));
    if ($text === '') {
        fail('Пустой текст задачи');
    }
    $priority = min(3, max(0, (int) ($b['priority'] ?? 0)));
    $due = (isset($b['due_date']) && $b['due_date'] !== '' && $b['due_date'] !== null)
        ? (string) $b['due_date']
        : null;
    $tags = normalizeTags($b['tags'] ?? []);

    $st = $pdo->prepare('SELECT COALESCE(MAX(position), -1) FROM todos WHERE list_id = ?');
    $st->execute([$listId]);
    $max = (int) $st->fetchColumn();

    $st = $pdo->prepare(
        'INSERT INTO todos (list_id, text, completed, priority, due_date, tags, position)
         VALUES (?, ?, 0, ?, ?, ?, ?)'
    );
    $st->execute([$listId, $text, $priority, $due, json_encode($tags, JSON_UNESCAPED_UNICODE), $max + 1]);

    $id = (int) $pdo->lastInsertId();
    $st = $pdo->prepare('SELECT * FROM todos WHERE id = ?');
    $st->execute([$id]);
    out(['ok' => true, 'todo' => todoOut($st->fetch())], 201);
}

function updateTodo(PDO $pdo, int $id): void
{
    $b = body();
    $sets = [];
    $vals = [];

    if (array_key_exists('text', $b)) {
        $t = trim((string) $b['text']);
        if ($t === '') {
            fail('Пустой текст задачи');
        }
        $sets[] = 'text = ?';
        $vals[] = $t;
    }
    if (array_key_exists('completed', $b)) {
        $sets[] = 'completed = ?';
        $vals[] = $b['completed'] ? 1 : 0;
    }
    if (array_key_exists('priority', $b)) {
        $sets[] = 'priority = ?';
        $vals[] = min(3, max(0, (int) $b['priority']));
    }
    if (array_key_exists('due_date', $b)) {
        $sets[] = 'due_date = ?';
        $vals[] = ($b['due_date'] === null || $b['due_date'] === '') ? null : (string) $b['due_date'];
    }
    if (array_key_exists('tags', $b)) {
        $sets[] = 'tags = ?';
        $vals[] = json_encode(normalizeTags($b['tags']), JSON_UNESCAPED_UNICODE);
    }
    if (array_key_exists('list_id', $b)) {
        $sets[] = 'list_id = ?';
        $vals[] = (int) $b['list_id'];
    }
    if (!$sets) {
        fail('Нет полей для обновления');
    }

    $vals[] = $id;
    $st = $pdo->prepare('UPDATE todos SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $st->execute($vals);

    $st = $pdo->prepare('SELECT * FROM todos WHERE id = ?');
    $st->execute([$id]);
    out(['ok' => true, 'todo' => todoOut($st->fetch())]);
}

function deleteTodo(PDO $pdo, int $id): void
{
    $st = $pdo->prepare('DELETE FROM todos WHERE id = ?');
    $st->execute([$id]);
    out(['ok' => true]);
}

function reorderTodos(PDO $pdo): void
{
    $ids = body()['ordered_ids'] ?? null;
    if (!is_array($ids)) {
        fail('ordered_ids должен быть массивом');
    }
    $st = $pdo->prepare('UPDATE todos SET position = ? WHERE id = ?');
    $pdo->beginTransaction();
    try {
        foreach ($ids as $i => $id) {
            $st->execute([$i, (int) $id]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    out(['ok' => true]);
}

function clearCompleted(PDO $pdo): void
{
    $listId = (int) (body()['list_id'] ?? 0);
    if ($listId <= 0) {
        fail('list_id обязателен');
    }
    $st = $pdo->prepare('DELETE FROM todos WHERE list_id = ? AND completed = 1');
    $st->execute([$listId]);
    out(['ok' => true, 'deleted' => $st->rowCount()]);
}

/* ---------- router ---------- */

function route(PDO $pdo, string $method, array $s): void
{
    $res = $s[0] ?? '';

    if ($res === 'lists') {
        if (count($s) === 1) {
            if ($method === 'GET') {
                listLists($pdo);
                return;
            }
            if ($method === 'POST') {
                createList($pdo);
                return;
            }
        }
        if (($s[1] ?? '') === 'reorder' && $method === 'POST') {
            reorderLists($pdo);
            return;
        }
        $id = (int) ($s[1] ?? 0);
        if ($id > 0 && ($s[2] ?? '') === 'todos') {
            if ($method === 'GET') {
                listTodos($pdo, $id);
                return;
            }
            if ($method === 'POST') {
                createTodo($pdo, $id);
                return;
            }
        }
        if ($id > 0 && count($s) === 2) {
            if ($method === 'PATCH') {
                renameList($pdo, $id);
                return;
            }
            if ($method === 'DELETE') {
                deleteList($pdo, $id);
                return;
            }
        }
    }

    if ($res === 'todos') {
        if (($s[1] ?? '') === 'reorder' && $method === 'POST') {
            reorderTodos($pdo);
            return;
        }
        if (($s[1] ?? '') === 'clear-completed' && $method === 'POST') {
            clearCompleted($pdo);
            return;
        }
        $id = (int) ($s[1] ?? 0);
        if ($id > 0) {
            if ($method === 'PATCH') {
                updateTodo($pdo, $id);
                return;
            }
            if ($method === 'DELETE') {
                deleteTodo($pdo, $id);
                return;
            }
        }
    }

    fail('Неизвестный маршрут', 404);
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/', '/');
    $seg = explode('/', $path);
    if (($seg[0] ?? '') === 'api') {
        array_shift($seg);
    }
    $seg = array_values(array_filter($seg, fn($s) => $s !== ''));

    route(db(), $method, $seg);
} catch (Throwable $e) {
    fail('Внутренняя ошибка: ' . $e->getMessage(), 500);
}
