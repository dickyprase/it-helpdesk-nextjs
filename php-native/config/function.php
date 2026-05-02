<?php
// ============================================================
// function.php — Semua fungsi helper & CRUD
// Pola: mysqli procedural, global $conn, return ['status'=>bool,'message'=>'...']
// ============================================================

session_start();
require __DIR__ . "/config.php";

// ============================================================
// AUTH HELPERS
// ============================================================

function getBaseUrl() {
    global $url;
    return $url;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getCurrentUserName() {
    return $_SESSION['user_name'] ?? '';
}

function getCurrentUserRole() {
    return $_SESSION['role'] ?? '';
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: ' . getBaseUrl() . 'login/');
        exit;
    }
}

function requireRole() {
    $roles = func_get_args();
    requireLogin();
    if (!in_array(getCurrentUserRole(), $roles)) {
        header('Location: ' . getBaseUrl() . 'login/');
        exit;
    }
}

function checkRateLimit($key, $max = 10, $window = 900) {
    if (!isset($_SESSION['rate_limit'][$key])) {
        $_SESSION['rate_limit'][$key] = ['count' => 0, 'reset' => time() + $window];
    }
    if (time() > $_SESSION['rate_limit'][$key]['reset']) {
        $_SESSION['rate_limit'][$key] = ['count' => 0, 'reset' => time() + $window];
    }
    $_SESSION['rate_limit'][$key]['count']++;
    return $_SESSION['rate_limit'][$key]['count'] <= $max;
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================

function login($email, $password) {
    global $conn;

    $email = mysqli_real_escape_string($conn, $email);
    $query = "SELECT * FROM `User` WHERE email = '$email' AND is_active = 1";
    $result = mysqli_query($conn, $query);

    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);

        if (password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id']    = $user['id'];
            $_SESSION['user_name']  = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['role']       = $user['role'];
            return ['status' => true, 'message' => 'Login berhasil'];
        }
        return ['status' => false, 'message' => 'Password salah'];
    }
    return ['status' => false, 'message' => 'Email tidak ditemukan atau akun nonaktif'];
}

function register($name, $email, $phone, $password) {
    global $conn;

    $name     = mysqli_real_escape_string($conn, $name);
    $email    = mysqli_real_escape_string($conn, strtolower($email));
    $phone    = mysqli_real_escape_string($conn, $phone);
    $hash     = password_hash($password, PASSWORD_BCRYPT);

    // Cek duplikat email
    $check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$email'");
    if (mysqli_num_rows($check) > 0) {
        return ['status' => false, 'message' => 'Email sudah terdaftar'];
    }

    $query = "INSERT INTO `User` (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
              VALUES (UUID(), '$name', '$email', '$phone', '$hash', 'USER', 1, NOW(), NOW())";
    
    if (mysqli_query($conn, $query)) {
        return ['status' => true, 'message' => 'Registrasi berhasil'];
    }
    return ['status' => false, 'message' => 'Gagal registrasi: ' . mysqli_error($conn)];
}

function logout() {
    session_unset();
    session_destroy();
}

// ============================================================
// CATEGORIES
// ============================================================

function getCategories() {
    global $conn;
    $result = mysqli_query($conn, "SELECT * FROM `Category` ORDER BY name ASC");
    $data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }
    return $data;
}

// ============================================================
// TICKETS
// ============================================================

function generateTicketCode() {
    $ts = strtoupper(base_convert(time(), 10, 36));
    $rand = strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
    return "TKT-{$ts}-{$rand}";
}

function createTicket($title, $description, $category_id) {
    global $conn;

    $user_id     = getCurrentUserId();
    $title       = mysqli_real_escape_string($conn, $title);
    $description = mysqli_real_escape_string($conn, $description);
    $category_id = mysqli_real_escape_string($conn, $category_id);
    $code        = generateTicketCode();

    $query = "INSERT INTO `Ticket` (id, code, title, description, status, difficulty_level, category_id, user_id, created_at, updated_at)
              VALUES (UUID(), '$code', '$title', '$description', 'OPEN', 1, '$category_id', '$user_id', NOW(), NOW())";

    if (mysqli_query($conn, $query)) {
        return ['status' => true, 'message' => 'Tiket berhasil dibuat! Kode: ' . $code];
    }
    return ['status' => false, 'message' => 'Gagal membuat tiket: ' . mysqli_error($conn)];
}

function getTickets($where_clause = "1=1", $order = "t.created_at DESC") {
    global $conn;

    $query = "SELECT t.*, 
                     c.name AS category_name,
                     u.name AS user_name, u.email AS user_email,
                     s.name AS staff_name, s.email AS staff_email
              FROM `Ticket` t
              JOIN `Category` c ON c.id = t.category_id
              JOIN `User` u ON u.id = t.user_id
              LEFT JOIN `User` s ON s.id = t.staff_id
              WHERE $where_clause
              ORDER BY $order";

    $result = mysqli_query($conn, $query);
    $data = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
    }
    return $data;
}

function getTicketById($id) {
    global $conn;
    $id = mysqli_real_escape_string($conn, $id);

    $query = "SELECT t.*, 
                     c.name AS category_name,
                     u.name AS user_name, u.email AS user_email,
                     s.name AS staff_name, s.email AS staff_email
              FROM `Ticket` t
              JOIN `Category` c ON c.id = t.category_id
              JOIN `User` u ON u.id = t.user_id
              LEFT JOIN `User` s ON s.id = t.staff_id
              WHERE t.id = '$id'";

    $result = mysqli_query($conn, $query);
    return $result ? mysqli_fetch_assoc($result) : null;
}

function claimTicket($ticket_id) {
    global $conn;

    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $staff_id  = getCurrentUserId();

    mysqli_begin_transaction($conn);

    $q = "SELECT id, status, staff_id FROM `Ticket` WHERE id = '$ticket_id' FOR UPDATE";
    $r = mysqli_query($conn, $q);
    $ticket = mysqli_fetch_assoc($r);

    if (!$ticket) {
        mysqli_rollback($conn);
        return ['status' => false, 'message' => 'Tiket tidak ditemukan'];
    }
    if ($ticket['staff_id']) {
        mysqli_rollback($conn);
        return ['status' => false, 'message' => 'Tiket sudah diklaim oleh staff lain'];
    }
    if ($ticket['status'] !== 'OPEN') {
        mysqli_rollback($conn);
        return ['status' => false, 'message' => 'Hanya tiket OPEN yang dapat diklaim'];
    }

    $staff_id = mysqli_real_escape_string($conn, $staff_id);
    mysqli_query($conn, "UPDATE `Ticket` SET staff_id = '$staff_id', status = 'IN_PROGRESS', updated_at = NOW() WHERE id = '$ticket_id'");
    mysqli_commit($conn);

    return ['status' => true, 'message' => 'Tiket berhasil diklaim'];
}

function unclaimTicket($ticket_id, $reason) {
    global $conn;

    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $staff_id  = getCurrentUserId();

    $ticket = getTicketById($ticket_id);
    if (!$ticket) return ['status' => false, 'message' => 'Tiket tidak ditemukan'];
    if ($ticket['staff_id'] !== $staff_id) return ['status' => false, 'message' => 'Anda bukan staff yang ditugaskan'];
    if ($ticket['status'] !== 'IN_PROGRESS') return ['status' => false, 'message' => 'Hanya tiket Diproses yang dapat dilepas'];

    mysqli_query($conn, "UPDATE `Ticket` SET staff_id = NULL, status = 'OPEN', updated_at = NOW() WHERE id = '$ticket_id'");
    return ['status' => true, 'message' => 'Tiket berhasil dilepas'];
}

function setTicketPending($ticket_id, $reason) {
    global $conn;

    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $reason    = mysqli_real_escape_string($conn, $reason);
    $staff_id  = getCurrentUserId();

    $ticket = getTicketById($ticket_id);
    if (!$ticket) return ['status' => false, 'message' => 'Tiket tidak ditemukan'];
    if ($ticket['staff_id'] !== $staff_id) return ['status' => false, 'message' => 'Anda bukan staff yang ditugaskan'];
    if ($ticket['status'] !== 'IN_PROGRESS') return ['status' => false, 'message' => 'Hanya tiket Diproses yang dapat di-pending'];

    mysqli_query($conn, "UPDATE `Ticket` SET status = 'PENDING', pending_reason = '$reason', updated_at = NOW() WHERE id = '$ticket_id'");
    return ['status' => true, 'message' => 'Tiket berhasil di-pending'];
}

function resolveTicket($ticket_id, $note) {
    global $conn;

    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $note      = mysqli_real_escape_string($conn, $note);
    $staff_id  = getCurrentUserId();

    $ticket = getTicketById($ticket_id);
    if (!$ticket) return ['status' => false, 'message' => 'Tiket tidak ditemukan'];
    if ($ticket['staff_id'] !== $staff_id) return ['status' => false, 'message' => 'Anda bukan staff yang ditugaskan'];
    if ($ticket['status'] !== 'IN_PROGRESS') return ['status' => false, 'message' => 'Hanya tiket Diproses yang dapat diselesaikan'];

    mysqli_query($conn, "UPDATE `Ticket` SET status = 'RESOLVED', resolution_note = '$note', updated_at = NOW() WHERE id = '$ticket_id'");
    return ['status' => true, 'message' => 'Tiket berhasil diselesaikan'];
}

function setTicketDifficulty($ticket_id, $level) {
    global $conn;
    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $level = (int)$level;
    if ($level < 1 || $level > 3) return ['status' => false, 'message' => 'Level harus 1-3'];

    mysqli_query($conn, "UPDATE `Ticket` SET difficulty_level = $level, updated_at = NOW() WHERE id = '$ticket_id'");
    return ['status' => true, 'message' => 'Difficulty berhasil diatur'];
}

function updateTicketStatus($ticket_id, $new_status) {
    global $conn;
    $ticket_id  = mysqli_real_escape_string($conn, $ticket_id);
    $new_status = mysqli_real_escape_string($conn, $new_status);

    $allowed = [
        'OPEN'        => ['IN_PROGRESS', 'CLOSED'],
        'IN_PROGRESS' => ['PENDING', 'RESOLVED', 'OPEN'],
        'PENDING'     => ['IN_PROGRESS'],
        'RESOLVED'    => ['CLOSED', 'IN_PROGRESS'],
        'CLOSED'      => [],
    ];

    $ticket = getTicketById($ticket_id);
    if (!$ticket) return ['status' => false, 'message' => 'Tiket tidak ditemukan'];

    $current = $ticket['status'];
    if (!in_array($new_status, $allowed[$current] ?? [])) {
        return ['status' => false, 'message' => "Tidak dapat mengubah status dari $current ke $new_status"];
    }

    mysqli_query($conn, "UPDATE `Ticket` SET status = '$new_status', updated_at = NOW() WHERE id = '$ticket_id'");

    // Auto-create leaderboard log when closing
    if ($new_status === 'CLOSED' && $ticket['staff_id']) {
        $staff_id = mysqli_real_escape_string($conn, $ticket['staff_id']);
        $points = 10 * (int)$ticket['difficulty_level'];
        $month = date('n');
        $year = date('Y');

        // Cek duplikat
        $check = mysqli_query($conn, "SELECT id FROM `LeaderboardLog` WHERE ticket_id = '$ticket_id'");
        if (mysqli_num_rows($check) === 0) {
            mysqli_query($conn, "INSERT INTO `LeaderboardLog` (id, staff_id, ticket_id, points, period_month, period_year, created_at)
                                 VALUES (UUID(), '$staff_id', '$ticket_id', $points, $month, $year, NOW())");
        }
    }

    return ['status' => true, 'message' => 'Status berhasil diubah'];
}

function assignTicket($ticket_id, $staff_id) {
    global $conn;
    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $staff_id  = mysqli_real_escape_string($conn, $staff_id);

    mysqli_query($conn, "UPDATE `Ticket` SET staff_id = '$staff_id', 
                         status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END,
                         updated_at = NOW() WHERE id = '$ticket_id'");
    return ['status' => true, 'message' => 'Staff berhasil ditugaskan'];
}

function getStaffList() {
    global $conn;
    $result = mysqli_query($conn, "SELECT id, name, email, role FROM `User` WHERE role IN ('STAFF','MANAGER') AND is_active = 1 ORDER BY name");
    $data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }
    return $data;
}

// ============================================================
// CHAT
// ============================================================

function getChatMessages($ticket_id) {
    global $conn;
    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);

    $query = "SELECT ch.*, u.name AS sender_name, u.role AS sender_role
              FROM `Chat` ch
              JOIN `User` u ON u.id = ch.sender_id
              WHERE ch.ticket_id = '$ticket_id'
              ORDER BY ch.created_at ASC";

    $result = mysqli_query($conn, $query);
    $data = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
    }
    return $data;
}

function sendMessage($ticket_id, $message) {
    global $conn;

    $ticket_id = mysqli_real_escape_string($conn, $ticket_id);
    $sender_id = mysqli_real_escape_string($conn, getCurrentUserId());
    $message   = mysqli_real_escape_string($conn, $message);

    $query = "INSERT INTO `Chat` (id, message, ticket_id, sender_id, is_voice_note, created_at)
              VALUES (UUID(), '$message', '$ticket_id', '$sender_id', 0, NOW())";

    if (mysqli_query($conn, $query)) {
        return ['status' => true, 'message' => 'Pesan terkirim'];
    }
    return ['status' => false, 'message' => 'Gagal mengirim pesan: ' . mysqli_error($conn)];
}

// ============================================================
// USERS (Manager)
// ============================================================

function getUsers() {
    global $conn;
    $query = "SELECT u.*, 
                     (SELECT COUNT(*) FROM `Ticket` WHERE user_id = u.id) AS tickets_created,
                     (SELECT COUNT(*) FROM `Ticket` WHERE staff_id = u.id) AS tickets_handled
              FROM `User` u ORDER BY u.role ASC, u.name ASC";
    $result = mysqli_query($conn, $query);
    $data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }
    return $data;
}

function createUser($name, $email, $phone, $password, $role) {
    global $conn;

    $name  = mysqli_real_escape_string($conn, $name);
    $email = mysqli_real_escape_string($conn, strtolower($email));
    $phone = mysqli_real_escape_string($conn, $phone);
    $role  = mysqli_real_escape_string($conn, $role);
    $hash  = password_hash($password, PASSWORD_BCRYPT);

    $check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$email'");
    if (mysqli_num_rows($check) > 0) {
        return ['status' => false, 'message' => 'Email sudah terdaftar'];
    }

    $query = "INSERT INTO `User` (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
              VALUES (UUID(), '$name', '$email', '$phone', '$hash', '$role', 1, NOW(), NOW())";

    if (mysqli_query($conn, $query)) {
        return ['status' => true, 'message' => 'Akun berhasil dibuat'];
    }
    return ['status' => false, 'message' => 'Gagal membuat akun: ' . mysqli_error($conn)];
}

function updateUser($id, $name, $email, $phone, $role) {
    global $conn;

    $id    = mysqli_real_escape_string($conn, $id);
    $name  = mysqli_real_escape_string($conn, $name);
    $email = mysqli_real_escape_string($conn, strtolower($email));
    $phone = mysqli_real_escape_string($conn, $phone);
    $role  = mysqli_real_escape_string($conn, $role);

    // Cek email duplikat (exclude self)
    $check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$email' AND id != '$id'");
    if (mysqli_num_rows($check) > 0) {
        return ['status' => false, 'message' => 'Email sudah digunakan akun lain'];
    }

    mysqli_query($conn, "UPDATE `User` SET name='$name', email='$email', phone='$phone', role='$role', updated_at=NOW() WHERE id='$id'");
    return ['status' => true, 'message' => 'Akun berhasil diperbarui'];
}

function toggleUserActive($id) {
    global $conn;
    $id = mysqli_real_escape_string($conn, $id);

    mysqli_query($conn, "UPDATE `User` SET is_active = NOT is_active, updated_at = NOW() WHERE id = '$id'");

    // Hapus session jika dinonaktifkan
    $user = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM `User` WHERE id = '$id'"));
    if ($user && !$user['is_active']) {
        mysqli_query($conn, "DELETE FROM `Session` WHERE user_id = '$id'");
    }

    return ['status' => true, 'message' => 'Status akun berhasil diubah'];
}

// ============================================================
// PROFILE
// ============================================================

function getProfile() {
    global $conn;
    $id = mysqli_real_escape_string($conn, getCurrentUserId());
    $result = mysqli_query($conn, "SELECT id, name, email, phone, role, is_active, created_at FROM `User` WHERE id = '$id'");
    return mysqli_fetch_assoc($result);
}

function updateProfile($name, $email, $phone) {
    global $conn;

    $id    = mysqli_real_escape_string($conn, getCurrentUserId());
    $name  = mysqli_real_escape_string($conn, $name);
    $email = mysqli_real_escape_string($conn, strtolower($email));
    $phone = mysqli_real_escape_string($conn, $phone);

    $check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$email' AND id != '$id'");
    if (mysqli_num_rows($check) > 0) {
        return ['status' => false, 'message' => 'Email sudah digunakan akun lain'];
    }

    mysqli_query($conn, "UPDATE `User` SET name='$name', email='$email', phone='$phone', updated_at=NOW() WHERE id='$id'");
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;
    return ['status' => true, 'message' => 'Profil berhasil diperbarui'];
}

function changePassword($current_password, $new_password) {
    global $conn;

    $id = mysqli_real_escape_string($conn, getCurrentUserId());
    $result = mysqli_query($conn, "SELECT password_hash FROM `User` WHERE id = '$id'");
    $user = mysqli_fetch_assoc($result);

    if (!$user || !password_verify($current_password, $user['password_hash'])) {
        return ['status' => false, 'message' => 'Password saat ini salah'];
    }

    $hash = password_hash($new_password, PASSWORD_BCRYPT);
    mysqli_query($conn, "UPDATE `User` SET password_hash = '$hash', updated_at = NOW() WHERE id = '$id'");
    return ['status' => true, 'message' => 'Password berhasil diubah'];
}

// ============================================================
// LEADERBOARD
// ============================================================

function getLeaderboard($view = 'monthly', $month = null, $year = null) {
    global $conn;

    $month = $month ?: date('n');
    $year  = $year ?: date('Y');

    if ($view === 'yearly') {
        $where = "l.period_year = " . (int)$year;
    } else {
        $where = "l.period_month = " . (int)$month . " AND l.period_year = " . (int)$year;
    }

    $query = "SELECT l.staff_id, u.name AS staff_name, u.email AS staff_email,
                     SUM(l.points) AS total_points,
                     COUNT(l.id) AS tickets_closed
              FROM `LeaderboardLog` l
              JOIN `User` u ON u.id = l.staff_id
              WHERE $where
              GROUP BY l.staff_id, u.name, u.email
              ORDER BY total_points DESC";

    $result = mysqli_query($conn, $query);
    $data = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
    }
    return $data;
}

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatTanggal($datetime) {
    if (!$datetime) return '-';
    $dt = new DateTime($datetime);
    return $dt->format('d/m/Y H:i');
}

function potongTeks($text, $max = 100) {
    if (strlen($text) <= $max) return $text;
    return substr($text, 0, $max) . '...';
}

function statusBadge($status) {
    $map = [
        'OPEN'        => ['bg-success', 'Terbuka'],
        'IN_PROGRESS' => ['bg-primary', 'Diproses'],
        'PENDING'     => ['bg-warning', 'Tertunda'],
        'RESOLVED'    => ['bg-info', 'Selesai'],
        'CLOSED'      => ['bg-secondary', 'Ditutup'],
    ];
    $s = $map[$status] ?? ['bg-dark', $status];
    return '<span class="badge ' . $s[0] . '">' . $s[1] . '</span>';
}

function flashMessage($key) {
    if (isset($_SESSION['flash'][$key])) {
        $msg = $_SESSION['flash'][$key];
        unset($_SESSION['flash'][$key]);
        return $msg;
    }
    return null;
}

function setFlash($key, $message) {
    $_SESSION['flash'][$key] = $message;
}
