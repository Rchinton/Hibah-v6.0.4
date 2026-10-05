<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if (($_GET['action'] ?? '') === 'time' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $serverTime = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
    respond(['timestamp' => $serverTime->format(DATE_ATOM)]);
}

function requestBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        respond(['error' => 'Payload JSON tidak valid.'], 400);
    }

    return $body;
}

function logSyncChange(PDO $pdo, string $collection, string $entityId, string $operation, ?array $payload): void
{
    $statement = $pdo->prepare(
        'INSERT INTO app_sync_changes (collection_name, entity_id, operation, payload)
         VALUES (:collection, :entity_id, :operation, :payload)'
    );
    $statement->execute([
        'collection' => $collection,
        'entity_id' => $entityId,
        'operation' => $operation,
        'payload' => $payload === null ? null : json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
    ]);
}

function normalizeFields(array $fields): array
{
    $normalized = [];
    foreach (array_values($fields) as $index => $field) {
        if (!is_array($field) || empty($field['id']) || empty($field['label']) || empty($field['key']) || empty($field['type'])) {
            respond(['error' => 'Ada konfigurasi field yang tidak lengkap.'], 422);
        }

        $normalized[] = [
            'id' => (string) $field['id'],
            'label' => (string) $field['label'],
            'key' => (string) $field['key'],
            'type' => (string) $field['type'],
            'options' => (string) ($field['options'] ?? ''),
            'placeholder' => (string) ($field['placeholder'] ?? ''),
            'description' => (string) ($field['description'] ?? ''),
            'required' => !empty($field['required']) ? 1 : 0,
            'order' => (int) ($field['order'] ?? $index),
            'active' => !empty($field['active']) ? 1 : 0,
        ];
    }

    return $normalized;
}

function normalizeRecords(array $records): array
{
    $normalized = [];
    foreach (array_values($records) as $record) {
        if (!is_array($record) || !isset($record['id']) || empty($record['noId']) || !isset($record['values']) || !is_array($record['values'])) {
            respond(['error' => 'Ada data hibah yang tidak lengkap.'], 422);
        }

        $normalized[] = [
            'id' => (string) $record['id'],
            'noId' => (string) $record['noId'],
            'status' => (string) ($record['status'] ?? 'Menunggu'),
            'createdAt' => (string) ($record['createdAt'] ?? 'Hari ini'),
            'values' => $record['values'],
        ];
    }

    return $normalized;
}

function validateDynamicColumnKey(string $key): void
{
    $reserved = ['id', 'no_id', 'status', 'created_label', 'created_at', 'updated_at', 'data_values'];
    if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]{0,119}$/', $key) || in_array(strtolower($key), $reserved, true)) {
        respond(['error' => "Field key '{$key}' tidak valid untuk kolom database. Gunakan huruf, angka, dan underscore; karakter pertama harus huruf/underscore."], 422);
    }
}

function ensureDynamicColumns(PDO $pdo, array $keys): array
{
    $columns = $pdo->query('SHOW COLUMNS FROM db_hibah')->fetchAll();
    $existing = array_column($columns, 'Field');
    foreach (array_values(array_unique($keys)) as $key) {
        validateDynamicColumnKey((string) $key);
        if (!in_array($key, $existing, true)) {
            $pdo->exec('ALTER TABLE db_hibah ADD COLUMN `' . $key . '` LONGTEXT NULL');
            $existing[] = $key;
        }
    }

    return array_values(array_filter($existing, static fn (string $name): bool => !in_array($name, ['id', 'no_id', 'status', 'created_label', 'created_at', 'updated_at', 'data_values'], true)));
}

function canonicalJson(mixed $value): string
{
    if (is_array($value)) {
        if (!array_is_list($value)) ksort($value);
        foreach ($value as &$item) $item = json_decode(canonicalJson($item), true);
        unset($item);
    }

    return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
}

function loadHibahRecords(PDO $pdo): array
{
    $columns = $pdo->query('SHOW COLUMNS FROM db_hibah')->fetchAll();
    $dynamicColumns = array_values(array_filter(array_column($columns, 'Field'), static fn (string $name): bool => !in_array($name, ['id', 'no_id', 'status', 'created_label', 'created_at', 'updated_at', 'data_values'], true)));
    $fieldTypes = [];
    foreach ($pdo->query('SELECT field_key, field_type FROM db_field')->fetchAll() as $field) $fieldTypes[$field['field_key']] = $field['field_type'];
    $rows = $pdo->query('SELECT * FROM db_hibah ORDER BY created_at DESC, id')->fetchAll();
    $records = [];
    foreach ($rows as $row) {
        $values = [];
        foreach ($dynamicColumns as $key) {
            if ($row[$key] === null) continue;
            $value = $row[$key];
            if (($fieldTypes[$key] ?? '') === 'checklist') {
                $decoded = json_decode($value, true);
                if (is_array($decoded)) $value = $decoded;
            }
            $values[$key] = $value;
        }
        $records[] = [
            'id' => (string) $row['id'],
            'noId' => $row['no_id'],
            'status' => $row['status'],
            'createdAt' => $row['created_label'],
            'values' => $values,
        ];
    }

    return $records;
}

function normalizeVerificationFields(array $fields): array
{
    $allowedTypes = ['text', 'paragraph', 'number', 'currency', 'date', 'time', 'checklist', 'list', 'header', 'separator'];
    $normalized = [];
    foreach (array_values($fields) as $index => $field) {
        if (!is_array($field) || empty($field['id']) || empty($field['label']) || empty($field['key']) || !in_array($field['type'] ?? '', $allowedTypes, true)) {
            respond(['error' => 'Konfigurasi pertanyaan verifikasi tidak valid.'], 422);
        }

        $normalized[] = [
            'id' => (string) $field['id'],
            'label' => trim((string) $field['label']),
            'key' => (string) $field['key'],
            'type' => (string) $field['type'],
            'options' => (string) ($field['options'] ?? ''),
            'placeholder' => (string) ($field['placeholder'] ?? ''),
            'description' => (string) ($field['description'] ?? ''),
            'required' => !empty($field['required']) ? 1 : 0,
            'order' => (int) ($field['order'] ?? $index),
            'active' => !empty($field['active']) ? 1 : 0,
        ];
    }

    return $normalized;
}

function saveVerificationFields(PDO $pdo, array $fields): void
{
    $normalized = normalizeVerificationFields($fields);
    $existing = [];
    foreach (loadVerificationFields($pdo) as $field) $existing[$field['id']] = $field;
    $statement = $pdo->prepare(
        'INSERT INTO db_verification_field (id, field_label, field_key, field_type, field_options, field_placeholder, field_description, is_required, display_order, is_active)
         VALUES (:id, :label, :field_key, :type, :options, :placeholder, :description, :required, :display_order, :active)
         ON DUPLICATE KEY UPDATE field_label = VALUES(field_label), field_key = VALUES(field_key), field_type = VALUES(field_type),
             field_options = VALUES(field_options), field_placeholder = VALUES(field_placeholder), field_description = VALUES(field_description),
             is_required = VALUES(is_required), display_order = VALUES(display_order), is_active = VALUES(is_active), updated_at = CURRENT_TIMESTAMP'
    );

    $keepIds = [];
    foreach ($normalized as $field) {
        $keepIds[] = $field['id'];
        $publicField = $field;
        $publicField['required'] = (bool) $field['required'];
        $publicField['active'] = (bool) $field['active'];
        if (isset($existing[$field['id']]) && json_encode($existing[$field['id']]) === json_encode($publicField)) continue;
        $statement->execute([
            'id' => $field['id'],
            'label' => $field['label'],
            'field_key' => $field['key'],
            'type' => $field['type'],
            'options' => $field['options'],
            'placeholder' => $field['placeholder'],
            'description' => $field['description'],
            'required' => $field['required'],
            'display_order' => $field['order'],
            'active' => $field['active'],
        ]);
        logSyncChange($pdo, 'verification-fields', $field['id'], 'upsert', $publicField);
    }
    foreach (array_diff(array_keys($existing), $keepIds) as $deletedId) {
        $delete = $pdo->prepare('DELETE FROM db_verification_field WHERE id = :id');
        $delete->execute(['id' => $deletedId]);
        logSyncChange($pdo, 'verification-fields', (string) $deletedId, 'delete', null);
    }
    $pdo->exec("UPDATE app_metadata SET meta_value = '1' WHERE meta_key = 'verification_fields_initialized'");
}

function loadVerificationFields(PDO $pdo): array
{
    $fields = $pdo->query(
        'SELECT id, field_label AS label, field_key AS `key`, field_type AS type, field_options AS options,
                field_placeholder AS placeholder, field_description AS description, is_required AS required,
                display_order AS `order`, is_active AS active
         FROM db_verification_field ORDER BY display_order, id'
    )->fetchAll();
    foreach ($fields as &$field) {
        $field['required'] = (bool) $field['required'];
        $field['active'] = (bool) $field['active'];
        $field['order'] = (int) $field['order'];
    }
    unset($field);

    return $fields;
}

function normalizeVerifications(array $verifications): array
{
    $normalized = [];
    foreach (array_values($verifications) as $verification) {
        if (!is_array($verification) || empty($verification['hibahId']) || !is_array($verification['values'] ?? null)) {
            respond(['error' => 'Data hasil verifikasi tidak valid.'], 422);
        }
        $status = (string) ($verification['status'] ?? 'Terverifikasi');
        if (!in_array($status, ['', 'Terverifikasi', 'Proses Berlangsung', 'Perlu Perbaikan', 'Ditolak'], true)) {
            respond(['error' => 'Status verifikasi tidak valid.'], 422);
        }
        $normalized[] = [
            'id' => (string) ($verification['id'] ?? bin2hex(random_bytes(12))),
            'hibahId' => (string) $verification['hibahId'],
            'status' => $status,
            'values' => $verification['values'],
        ];
    }

    return $normalized;
}

function saveVerifications(PDO $pdo, array $verifications, array $sessionUser): void
{
    $normalized = normalizeVerifications($verifications);
    $existing = [];
    foreach (loadVerifications($pdo) as $verification) $existing[$verification['hibahId']] = $verification;
    $hibahById = [];
    foreach (loadHibahRecords($pdo) as $record) $hibahById[(string) $record['id']] = $record;
    $statement = $pdo->prepare(
        'INSERT INTO db_hibah_verification (id, hibah_id, no_id, status, hibah_snapshot, verification_values, verified_by, verified_by_name)
         SELECT :id, hibah.id, hibah.no_id, :status, :snapshot, :values, :verified_by, :verified_by_name
         FROM db_hibah AS hibah WHERE hibah.id = :hibah_id
         ON DUPLICATE KEY UPDATE no_id = VALUES(no_id), status = VALUES(status), hibah_snapshot = VALUES(hibah_snapshot),
             verification_values = VALUES(verification_values), verified_by = VALUES(verified_by),
             verified_by_name = VALUES(verified_by_name), updated_at = CURRENT_TIMESTAMP'
    );

    $keepIds = [];
    foreach ($normalized as $verification) {
        $keepIds[] = $verification['hibahId'];
        $hibah = $hibahById[(string) $verification['hibahId']] ?? null;
        if (!$hibah) respond(['error' => 'Data Hibah tidak ditemukan. Muat ulang halaman dan coba lagi.'], 404);
        $publicVerification = [
            'id' => $verification['id'],
            'hibahId' => $verification['hibahId'],
            'noId' => $hibah['noId'],
            'status' => $verification['status'],
            'hibahSnapshot' => $hibah['values'],
            'values' => $verification['values'],
            'verifiedBy' => $sessionUser['id'],
            'verifiedByName' => $sessionUser['name'],
        ];
        $old = $existing[$verification['hibahId']] ?? null;
        $same = $old && $old['status'] === $publicVerification['status']
            && $old['hibahSnapshot'] == $publicVerification['hibahSnapshot']
            && $old['values'] == $publicVerification['values']
            && $old['verifiedBy'] === $publicVerification['verifiedBy']
            && $old['verifiedByName'] === $publicVerification['verifiedByName'];
        if ($same) continue;
        $statement->execute([
            'id' => $verification['id'],
            'status' => $verification['status'],
            'snapshot' => json_encode($hibah['values'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'values' => json_encode($verification['values'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'verified_by' => $sessionUser['id'],
            'verified_by_name' => $sessionUser['name'],
            'hibah_id' => $verification['hibahId'],
        ]);
        logSyncChange($pdo, 'verifications', $verification['hibahId'], 'upsert', $publicVerification);
    }

    if (!$normalized) {
        foreach (array_keys($existing) as $deletedId) {
            $delete = $pdo->prepare('DELETE FROM db_hibah_verification WHERE hibah_id = :id');
            $delete->execute(['id' => $deletedId]);
            logSyncChange($pdo, 'verifications', (string) $deletedId, 'delete', null);
        }
        return;
    }

    foreach (array_diff(array_keys($existing), $keepIds) as $deletedId) {
        $delete = $pdo->prepare('DELETE FROM db_hibah_verification WHERE hibah_id = :id');
        $delete->execute(['id' => $deletedId]);
        logSyncChange($pdo, 'verifications', (string) $deletedId, 'delete', null);
    }
}

function loadVerifications(PDO $pdo): array
{
    $verifications = $pdo->query(
        'SELECT id, hibah_id AS hibahId, no_id AS noId, status, hibah_snapshot AS hibahSnapshot,
                verification_values AS `values`, verified_by AS verifiedBy, verified_by_name AS verifiedByName,
                DATE_FORMAT(created_at, "%d %b %Y %H:%i") AS createdAt,
                DATE_FORMAT(updated_at, "%d %b %Y %H:%i") AS updatedAt
         FROM db_hibah_verification ORDER BY updated_at DESC, id'
    )->fetchAll();
    foreach ($verifications as &$verification) {
        $verification['hibahSnapshot'] = json_decode($verification['hibahSnapshot'], true, 512, JSON_THROW_ON_ERROR);
        $verification['values'] = json_decode($verification['values'], true, 512, JSON_THROW_ON_ERROR);
    }
    unset($verification);

    return $verifications;
}

function saveFields(PDO $pdo, array $fields): void
{
    $normalized = normalizeFields($fields);
    ensureDynamicColumns($pdo, array_column($normalized, 'key'));
    $existingRows = $pdo->query(
        'SELECT id, field_label AS label, field_key AS `key`, field_type AS type, field_options AS options,
                field_placeholder AS placeholder, field_description AS description, is_required AS required,
                display_order AS `order`, is_active AS active FROM db_field'
    )->fetchAll();
    $existing = [];
    foreach (normalizeFields($existingRows) as $field) {
        $existing[$field['id']] = $field;
    }
    $statement = $pdo->prepare(
        'INSERT INTO db_field (id, field_label, field_key, field_type, field_options, field_placeholder, field_description, is_required, display_order, is_active)
         VALUES (:id, :label, :field_key, :type, :options, :placeholder, :description, :required, :display_order, :active)
         ON DUPLICATE KEY UPDATE field_label = VALUES(field_label), field_key = VALUES(field_key), field_type = VALUES(field_type),
             field_options = VALUES(field_options), field_placeholder = VALUES(field_placeholder), field_description = VALUES(field_description),
             is_required = VALUES(is_required), display_order = VALUES(display_order), is_active = VALUES(is_active), updated_at = CURRENT_TIMESTAMP'
    );

    $keepIds = [];
    foreach ($normalized as $field) {
        $keepIds[] = $field['id'];
        $publicField = $field;
        $publicField['required'] = (bool) $field['required'];
        $publicField['active'] = (bool) $field['active'];
        if (isset($existing[$field['id']]) && json_encode($existing[$field['id']]) === json_encode($publicField)) {
            continue;
        }
        $statement->execute([
            'id' => $field['id'],
            'label' => $field['label'],
            'field_key' => $field['key'],
            'type' => $field['type'],
            'options' => $field['options'],
            'placeholder' => $field['placeholder'],
            'description' => $field['description'],
            'required' => $field['required'],
            'display_order' => $field['order'],
            'active' => $field['active'],
        ]);
        logSyncChange($pdo, 'fields', $field['id'], 'upsert', $publicField);
    }

    foreach (array_diff(array_keys($existing), $keepIds) as $deletedId) {
        $delete = $pdo->prepare('DELETE FROM db_field WHERE id = :id');
        $delete->execute(['id' => $deletedId]);
        logSyncChange($pdo, 'fields', (string) $deletedId, 'delete', null);
    }
}

function saveRecords(PDO $pdo, array $records): void
{
    $normalized = normalizeRecords($records);
    $configuredKeys = $pdo->query('SELECT field_key FROM db_field')->fetchAll(PDO::FETCH_COLUMN);
    $recordKeys = [];
    foreach ($normalized as $record) $recordKeys = array_merge($recordKeys, array_keys($record['values']));
    $dynamicColumns = ensureDynamicColumns($pdo, array_merge($configuredKeys, $recordKeys));
    $existingRows = loadHibahRecords($pdo);
    $existing = [];
    foreach (normalizeRecords($existingRows) as $record) $existing[$record['id']] = $record;

    $baseColumns = ['id', 'no_id', 'status', 'created_label'];
    $insertColumns = array_merge($baseColumns, $dynamicColumns);
    $placeholders = array_map(static fn (int $index): string => ':value_' . $index, array_keys($insertColumns));
    $updates = array_map(static fn (string $column): string => '`' . $column . '` = VALUES(`' . $column . '`)', array_merge(['no_id', 'status', 'created_label'], $dynamicColumns));
    $updates[] = 'updated_at = CURRENT_TIMESTAMP';
    $quotedColumns = array_map(static fn (string $column): string => '`' . $column . '`', $insertColumns);
    $statement = $pdo->prepare(
        'INSERT INTO db_hibah (' . implode(', ', $quotedColumns) . ') VALUES (' . implode(', ', $placeholders) . ')
         ON DUPLICATE KEY UPDATE ' . implode(', ', $updates)
    );

    $keepIds = [];
    foreach ($normalized as $record) {
        $keepIds[] = $record['id'];
        if (isset($existing[$record['id']]) && canonicalJson($existing[$record['id']]) === canonicalJson($record)) continue;
        $parameters = [];
        foreach ($baseColumns as $index => $column) {
            $parameters['value_' . $index] = match ($column) {
                'id' => $record['id'],
                'no_id' => $record['noId'],
                'status' => $record['status'],
                'created_label' => $record['createdAt'],
            };
        }
        foreach ($dynamicColumns as $index => $column) {
            $value = $record['values'][$column] ?? null;
            $parameters['value_' . (count($baseColumns) + $index)] = is_array($value)
                ? json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)
                : $value;
        }
        $statement->execute($parameters);
        logSyncChange($pdo, 'records', $record['id'], 'upsert', $record);
    }

    foreach (array_diff(array_keys($existing), $keepIds) as $deletedId) {
        $verificationDelete = $pdo->prepare('SELECT hibah_id FROM db_hibah_verification WHERE hibah_id = :id');
        $verificationDelete->execute(['id' => $deletedId]);
        if ($verificationDelete->fetchColumn()) logSyncChange($pdo, 'verifications', (string) $deletedId, 'delete', null);
        $delete = $pdo->prepare('DELETE FROM db_hibah WHERE id = :id');
        $delete->execute(['id' => $deletedId]);
        logSyncChange($pdo, 'records', (string) $deletedId, 'delete', null);
    }
}

function normalizeUsers(array $users): array
{
    $normalized = [];
    foreach (array_values($users) as $user) {
        if (!is_array($user) || empty($user['id']) || empty($user['name']) || empty($user['username']) || empty($user['email'])) {
            respond(['error' => 'Ada data pengguna yang tidak lengkap.'], 422);
        }
        if (!filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
            respond(['error' => 'Format email pengguna tidak valid.'], 422);
        }
        if (!in_array($user['role'] ?? '', ['superadmin', 'user'], true)) {
            respond(['error' => 'Role pengguna tidak valid.'], 422);
        }
        if (!in_array($user['status'] ?? '', ['Aktif', 'Nonaktif'], true)) {
            respond(['error' => 'Status pengguna tidak valid.'], 422);
        }

        $normalized[] = [
            'id' => (string) $user['id'],
            'name' => trim((string) $user['name']),
            'username' => strtolower(trim((string) $user['username'])),
            'email' => strtolower(trim((string) $user['email'])),
            'contactWhatsapp' => (string) preg_replace('/[^0-9+]/', '', (string) ($user['contactWhatsapp'] ?? '')),
            'password' => (string) ($user['password'] ?? ''),
            'role' => (string) $user['role'],
            'status' => (string) $user['status'],
            'photo' => isset($user['photo']) && $user['photo'] !== '' ? (string) $user['photo'] : null,
        ];
    }

    return $normalized;
}

function saveUsers(PDO $pdo, array $users): void
{
    $normalized = normalizeUsers($users);
    $existingRows = $pdo->query('SELECT id, password_hash FROM users')->fetchAll();
    $existingHashes = [];
    foreach ($existingRows as $row) $existingHashes[$row['id']] = $row['password_hash'];
    $existingUsers = [];
    foreach (loadUsers($pdo) as $user) $existingUsers[$user['id']] = $user;
    $statement = $pdo->prepare(
        'INSERT INTO users (id, name, username, email, contact_whatsapp, password_hash, role, status, photo)
         VALUES (:id, :name, :username, :email, :contact_whatsapp, :password_hash, :role, :status, :photo)
         ON DUPLICATE KEY UPDATE name = VALUES(name), username = VALUES(username), email = VALUES(email),
             contact_whatsapp = VALUES(contact_whatsapp), password_hash = VALUES(password_hash), role = VALUES(role),
             status = VALUES(status), photo = VALUES(photo), updated_at = CURRENT_TIMESTAMP'
    );

    $keepIds = [];
    foreach ($normalized as $user) {
        $keepIds[] = $user['id'];
        $passwordHash = $user['password'] !== ''
            ? password_hash($user['password'], PASSWORD_DEFAULT)
            : ($existingHashes[$user['id']] ?? '');
        if ($passwordHash === '') {
            respond(['error' => 'Password wajib diisi untuk pengguna baru.'], 422);
        }

        $publicUser = $user;
        $publicUser['password'] = '';
        $old = $existingUsers[$user['id']] ?? null;
        $profileChanged = !$old;
        if ($old) {
            foreach (['name', 'username', 'email', 'contactWhatsapp', 'role', 'status', 'photo'] as $property) {
                if (($old[$property] ?? null) !== ($publicUser[$property] ?? null)) {
                    $profileChanged = true;
                    break;
                }
            }
        }
        $passwordChanged = $user['password'] !== '';
        if (!$profileChanged && !$passwordChanged) continue;

        $statement->execute([
            'id' => $user['id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'email' => $user['email'],
            'contact_whatsapp' => $user['contactWhatsapp'],
            'password_hash' => $passwordHash,
            'role' => $user['role'],
            'status' => $user['status'],
            'photo' => $user['photo'],
        ]);
        if ($profileChanged) logSyncChange($pdo, 'users', $user['id'], 'upsert', $publicUser);
    }

    foreach (array_diff(array_keys($existingUsers), $keepIds) as $deletedId) {
        $delete = $pdo->prepare('DELETE FROM users WHERE id = :id');
        $delete->execute(['id' => $deletedId]);
        logSyncChange($pdo, 'users', (string) $deletedId, 'delete', null);
    }
}

function loadUsers(PDO $pdo): array
{
    $users = $pdo->query(
        'SELECT id, name, username, email, contact_whatsapp AS contactWhatsapp, role, status, photo FROM users ORDER BY name, id'
    )->fetchAll();
    foreach ($users as &$user) {
        $user['password'] = '';
    }
    unset($user);

    return $users;
}

function currentSessionUser(PDO $pdo): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $statement = $pdo->prepare('SELECT id, name, role, status FROM users WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $_SESSION['user_id']]);
    $user = $statement->fetch();

    return $user && $user['status'] === 'Aktif' ? $user : null;
}

function loadState(PDO $pdo): array
{
    $syncCursor = (int) $pdo->query('SELECT COALESCE(MAX(id), 0) FROM app_sync_changes')->fetchColumn();
    $initialized = $pdo->query("SELECT meta_value FROM app_metadata WHERE meta_key = 'data_initialized'")->fetchColumn() === '1';
    $usersInitialized = $pdo->query("SELECT meta_value FROM app_metadata WHERE meta_key = 'users_initialized'")->fetchColumn() === '1';
    $verificationFieldsInitialized = $pdo->query("SELECT meta_value FROM app_metadata WHERE meta_key = 'verification_fields_initialized'")->fetchColumn() === '1';
    $fields = $pdo->query(
        'SELECT id, field_label AS label, field_key AS `key`, field_type AS type, field_options AS options,
            field_placeholder AS placeholder, field_description AS description,
                is_required AS required, display_order AS `order`, is_active AS active
         FROM db_field ORDER BY display_order, id'
    )->fetchAll();

    foreach ($fields as &$field) {
        $field['required'] = (bool) $field['required'];
        $field['active'] = (bool) $field['active'];
        $field['order'] = (int) $field['order'];
    }
    unset($field);

    $records = loadHibahRecords($pdo);

    return [
        'initialized' => $initialized,
        'fields' => $fields,
        'records' => $records,
        'usersInitialized' => $usersInitialized,
        'users' => loadUsers($pdo),
        'verificationFieldsInitialized' => $verificationFieldsInitialized,
        'verificationFields' => loadVerificationFields($pdo),
        'verifications' => loadVerifications($pdo),
        'syncCursor' => $syncCursor,
    ];
}

function loadSyncBatch(PDO $pdo, int $since, int $limit): array
{
    $statement = $pdo->prepare(
        'SELECT id, collection_name AS collection, entity_id AS entityId, operation, payload
         FROM app_sync_changes WHERE id > :since ORDER BY id LIMIT :limit'
    );
    $statement->bindValue(':since', max(0, $since), PDO::PARAM_INT);
    $statement->bindValue(':limit', min(500, max(1, $limit)) + 1, PDO::PARAM_INT);
    $statement->execute();
    $rows = $statement->fetchAll();
    $hasMore = count($rows) > $limit;
    if ($hasMore) array_pop($rows);

    foreach ($rows as &$row) {
        $row['id'] = (int) $row['id'];
        $row['payload'] = $row['payload'] === null ? null : json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR);
    }
    unset($row);

    $cursor = $rows ? (int) end($rows)['id'] : max(0, $since);

    return ['events' => $rows, 'cursor' => $cursor, 'hasMore' => $hasMore];
}

try {
    $config = require __DIR__ . '/config.php';
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['port'],
        $config['database']
    );
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($action === 'library') {
        $sessionUser = currentSessionUser($pdo);
        if (!$sessionUser) {
            respond(['error' => 'Sesi login tidak valid. Silakan login kembali.'], 401);
        }

        if ($method === 'GET') {
            $statement = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = :key LIMIT 1');
            $statement->execute(['key' => 'library_items']);
            $items = json_decode((string) ($statement->fetchColumn() ?: '[]'), true);
            respond(['items' => is_array($items) ? $items : []]);
        }

        if ($method === 'PUT') {
            if ($sessionUser['role'] !== 'superadmin') {
                respond(['error' => 'Hanya Superadmin yang dapat mengubah Pustaka.'], 403);
            }
            $body = requestBody();
            if (!is_array($body['items'] ?? null) || count($body['items']) > 500) {
                respond(['error' => 'Daftar Pustaka tidak valid atau melebihi 500 dokumen.'], 422);
            }
            $items = [];
            foreach (array_values($body['items']) as $item) {
                if (!is_array($item)) {
                    respond(['error' => 'Data dokumen Pustaka tidak valid.'], 422);
                }
                $name = trim((string) ($item['name'] ?? ''));
                $documentNumber = trim((string) ($item['documentNumber'] ?? ''));
                $documentDate = trim((string) ($item['documentDate'] ?? ''));
                $url = trim((string) ($item['url'] ?? ''));
                $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
                if ($name === '' || strlen($name) > 720 || strlen($url) > 2048
                    || strlen($documentNumber) > 480
                    || filter_var($url, FILTER_VALIDATE_URL) === false || !in_array($scheme, ['http', 'https'], true)) {
                    respond(['error' => 'Nama dokumen wajib diisi dan hyperlink harus berupa URL http atau https yang valid.'], 422);
                }
                if ($documentDate !== '') {
                    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $documentDate);
                    if (!$date || $date->format('Y-m-d') !== $documentDate) {
                        respond(['error' => 'Tanggal dokumen tidak valid.'], 422);
                    }
                }
                $id = trim((string) ($item['id'] ?? ''));
                $items[] = ['id' => $id !== '' && strlen($id) <= 80 ? $id : bin2hex(random_bytes(12)), 'name' => $name, 'documentNumber' => $documentNumber, 'documentDate' => $documentDate, 'url' => $url];
            }
            $statement = $pdo->prepare(
                'INSERT INTO app_settings (setting_key, setting_value) VALUES (:key, :value)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP'
            );
            $statement->execute(['key' => 'library_items', 'value' => json_encode($items, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)]);
            respond(['saved' => true, 'items' => $items]);
        }
    }

    if ($action === 'app-settings') {
        $sessionUser = currentSessionUser($pdo);
        if (!$sessionUser) {
            respond(['error' => 'Sesi login tidak valid. Silakan login kembali.'], 401);
        }

        if ($method === 'GET') {
            $statement = $pdo->query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('announcement', 'announcement_style')");
            $settings = [];
            foreach ($statement->fetchAll() as $setting) $settings[$setting['setting_key']] = $setting['setting_value'];
            $style = json_decode($settings['announcement_style'] ?? '', true);
            if (!is_array($style)) $style = [];
            respond([
                'announcement' => $settings['announcement'] ?? 'Pengumuman-pengumuman.... mohon perhatian...!',
                'style' => array_merge(['textColor' => '#000000', 'backgroundColor' => '#f4f4a4', 'fontSize' => 12, 'speed' => 24, 'transparency' => 0], $style),
            ]);
        }

        if ($method === 'PUT') {
            if ($sessionUser['role'] !== 'superadmin') {
                respond(['error' => 'Hanya Superadmin yang dapat mengubah pengaturan sistem aplikasi.'], 403);
            }
            $body = requestBody();
            $announcement = $body['announcement'] ?? null;
            if (!is_string($announcement) || trim($announcement) === '' || strlen($announcement) > 60000) {
                respond(['error' => 'Siaran wajib diisi dan maksimal 60 KB.'], 422);
            }
            $style = $body['style'] ?? null;
            if (!is_array($style)) {
                respond(['error' => 'Pengaturan tampilan pengumuman tidak valid.'], 422);
            }
            $textColor = (string) ($style['textColor'] ?? '');
            $backgroundColor = (string) ($style['backgroundColor'] ?? '');
            $fontSize = filter_var($style['fontSize'] ?? null, FILTER_VALIDATE_INT);
            $speed = filter_var($style['speed'] ?? null, FILTER_VALIDATE_INT);
            $transparency = filter_var($style['transparency'] ?? null, FILTER_VALIDATE_INT);
            if (!preg_match('/^#[0-9a-fA-F]{6}$/', $textColor) || !preg_match('/^#[0-9a-fA-F]{6}$/', $backgroundColor)
                || $fontSize === false || $fontSize < 10 || $fontSize > 28
                || $speed === false || $speed < 8 || $speed > 60
                || $transparency === false || $transparency < 0 || $transparency > 100) {
                respond(['error' => 'Nilai tampilan pengumuman berada di luar batas yang diizinkan.'], 422);
            }
            $normalizedStyle = compact('textColor', 'backgroundColor', 'fontSize', 'speed', 'transparency');
            $statement = $pdo->prepare(
                'INSERT INTO app_settings (setting_key, setting_value) VALUES (:key, :value)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP'
            );
            $pdo->beginTransaction();
            $statement->execute(['key' => 'announcement', 'value' => $announcement]);
            $statement->execute(['key' => 'announcement_style', 'value' => json_encode($normalizedStyle, JSON_THROW_ON_ERROR)]);
            $pdo->commit();
            respond(['saved' => true, 'announcement' => $announcement, 'style' => $normalizedStyle]);
        }
    }

    if ($action === 'sync' && $method === 'GET') {
        $sessionUser = currentSessionUser($pdo);
        if (!$sessionUser) {
            respond(['error' => 'Sesi login tidak valid. Silakan login kembali.'], 401);
        }
        $since = filter_var($_GET['since'] ?? 0, FILTER_VALIDATE_INT);
        $limit = filter_var($_GET['limit'] ?? 200, FILTER_VALIDATE_INT);
        respond(loadSyncBatch($pdo, $since === false ? 0 : $since, $limit === false ? 200 : $limit));
    }

    if ($action === 'state' && $method === 'GET') {
        respond(loadState($pdo));
    }

    if ($action === 'initialize' && $method === 'POST') {
        $body = requestBody();
        if (!isset($body['fields'], $body['records']) || !is_array($body['fields']) || !is_array($body['records'])) {
            respond(['error' => 'Data migrasi tidak valid.'], 422);
        }

        $pdo->beginTransaction();
        $initialized = $pdo->query("SELECT meta_value FROM app_metadata WHERE meta_key = 'data_initialized' FOR UPDATE")->fetchColumn() === '1';
        if (!$initialized) {
            saveFields($pdo, $body['fields']);
            saveRecords($pdo, $body['records']);
            $pdo->exec("UPDATE app_metadata SET meta_value = '1' WHERE meta_key = 'data_initialized'");
        }
        $pdo->commit();

        respond(loadState($pdo));
    }

    if ($action === 'users-initialize' && $method === 'POST') {
        $body = requestBody();
        if (!isset($body['users']) || !is_array($body['users'])) {
            respond(['error' => 'Daftar migrasi pengguna tidak valid.'], 422);
        }
        $pdo->beginTransaction();
        $initialized = $pdo->query("SELECT meta_value FROM app_metadata WHERE meta_key = 'users_initialized' FOR UPDATE")->fetchColumn() === '1';
        if (!$initialized) {
            saveUsers($pdo, $body['users']);
            $pdo->exec("UPDATE app_metadata SET meta_value = '1' WHERE meta_key = 'users_initialized'");
        }
        $pdo->commit();
        respond(['users' => loadUsers($pdo), 'usersInitialized' => true]);
    }

    if ($action === 'users' && $method === 'PUT') {
        $body = requestBody();
        if (!isset($body['users']) || !is_array($body['users'])) {
            respond(['error' => 'Daftar pengguna tidak valid.'], 422);
        }
        $sessionUser = currentSessionUser($pdo);
        if (!$sessionUser) {
            respond(['error' => 'Sesi login tidak valid. Silakan login kembali.'], 401);
        }
        if ($sessionUser['role'] !== 'superadmin') {
            $submittedUsers = normalizeUsers($body['users']);
            $existingUsers = $pdo->query('SELECT id, name, username, email, contact_whatsapp AS contactWhatsapp, role, status, photo FROM users')->fetchAll();
            if (count($submittedUsers) !== count($existingUsers)) {
                respond(['error' => 'Anda hanya dapat mengubah profil sendiri.'], 403);
            }

            $existingById = [];
            foreach ($existingUsers as $existingUser) {
                $existingById[$existingUser['id']] = $existingUser;
            }
            foreach ($submittedUsers as $submittedUser) {
                $existingUser = $existingById[$submittedUser['id']] ?? null;
                if (!$existingUser) {
                    respond(['error' => 'Anda hanya dapat mengubah profil sendiri.'], 403);
                }
                if ($submittedUser['id'] === $sessionUser['id']) {
                    if ($submittedUser['role'] !== $existingUser['role'] || $submittedUser['status'] !== $existingUser['status']) {
                        respond(['error' => 'Role dan status akun hanya dapat diubah oleh Superadmin.'], 403);
                    }
                    continue;
                }

                foreach (['name', 'username', 'email', 'contactWhatsapp', 'role', 'status', 'photo'] as $property) {
                    if ($submittedUser[$property] !== $existingUser[$property]) {
                        respond(['error' => 'Anda hanya dapat mengubah profil sendiri.'], 403);
                    }
                }
                if ($submittedUser['password'] !== '') {
                    respond(['error' => 'Anda hanya dapat mengubah password sendiri.'], 403);
                }
            }
        } else {
            $submittedUsers = normalizeUsers($body['users']);
            $sessionUserIncluded = false;
            $activeSuperadminCount = 0;
            foreach ($submittedUsers as $submittedUser) {
                if ($submittedUser['id'] === $sessionUser['id']) $sessionUserIncluded = true;
                if ($submittedUser['role'] === 'superadmin' && $submittedUser['status'] === 'Aktif') $activeSuperadminCount++;
            }
            if (!$sessionUserIncluded) {
                respond(['error' => 'Akun yang sedang digunakan tidak dapat dihapus.'], 422);
            }
            if ($activeSuperadminCount === 0) {
                respond(['error' => 'Sistem harus memiliki minimal satu superadmin aktif.'], 422);
            }
        }
        $pdo->beginTransaction();
        saveUsers($pdo, $body['users']);
        $pdo->exec("UPDATE app_metadata SET meta_value = '1' WHERE meta_key = 'users_initialized'");
        $pdo->commit();
        respond(['saved' => true]);
    }

    if ($action === 'verification-fields' && $method === 'PUT') {
        $body = requestBody();
        $sessionUser = currentSessionUser($pdo);
        if (!$sessionUser) {
            respond(['error' => 'Sesi login tidak valid. Silakan login kembali.'], 401);
        }
        if ($sessionUser['role'] !== 'superadmin') {
            respond(['error' => 'Hanya Superadmin yang dapat mengatur form verifikasi.'], 403);
        }
        if (!isset($body['verification-fields']) || !is_array($body['verification-fields'])) {
            respond(['error' => 'Daftar pertanyaan verifikasi tidak valid.'], 422);
        }
        $pdo->beginTransaction();
        saveVerificationFields($pdo, $body['verification-fields']);
        $pdo->commit();
        respond(['saved' => true]);
    }

    if ($action === 'verifications' && $method === 'PUT') {
        $body = requestBody();
        $sessionUser = currentSessionUser($pdo);
        if (!$sessionUser) {
            respond(['error' => 'Sesi login tidak valid. Silakan login kembali.'], 401);
        }
        if (!isset($body['verifications']) || !is_array($body['verifications'])) {
            respond(['error' => 'Daftar hasil verifikasi tidak valid.'], 422);
        }
        $pdo->beginTransaction();
        saveVerifications($pdo, $body['verifications'], $sessionUser);
        $pdo->commit();
        respond(['saved' => true]);
    }

    if ($action === 'login' && $method === 'POST') {
        $body = requestBody();
        $identifier = strtolower(trim((string) ($body['identifier'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $statement = $pdo->prepare(
            'SELECT id, name, username, email, contact_whatsapp AS contactWhatsapp, password_hash, role, status, photo
             FROM users WHERE LOWER(username) = :username OR LOWER(email) = :email LIMIT 1'
        );
        $statement->execute(['username' => $identifier, 'email' => $identifier]);
        $user = $statement->fetch();
        if (!$user || $user['status'] !== 'Aktif' || !password_verify($password, $user['password_hash'])) {
            respond(['error' => 'Username/email atau password tidak sesuai.'], 401);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        unset($user['password_hash']);
        $user['password'] = '';
        respond(['user' => $user]);
    }

    if ($action === 'logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $cookie = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $cookie['path'], $cookie['domain'], $cookie['secure'], $cookie['httponly']);
        }
        session_destroy();
        respond(['loggedOut' => true]);
    }

    if ($action === 'fields' && $method === 'PUT') {
        $body = requestBody();
        if (!isset($body['fields']) || !is_array($body['fields'])) {
            respond(['error' => 'Daftar field tidak valid.'], 422);
        }
        $pdo->beginTransaction();
        saveFields($pdo, $body['fields']);
        $pdo->commit();
        respond(['saved' => true]);
    }

    if ($action === 'records' && $method === 'PUT') {
        $body = requestBody();
        if (!isset($body['records']) || !is_array($body['records'])) {
            respond(['error' => 'Daftar hibah tidak valid.'], 422);
        }
        $pdo->beginTransaction();
        saveRecords($pdo, $body['records']);
        $pdo->commit();
        respond(['saved' => true]);
    }

    respond(['error' => 'Endpoint tidak ditemukan.'], 404);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($error->getMessage());
    respond(['error' => 'Permintaan database gagal. Periksa koneksi MySQL dan data yang dikirim.'], 500);
}