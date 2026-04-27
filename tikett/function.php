<?php
// ============================================================
// function.php — Semua logic PHP untuk integrasi REST API
// Menggunakan cURL procedural. Tidak ada OOP/class/prepare.
// ============================================================

// ===== KONFIGURASI =====
// Ganti URL ini sesuai alamat server REST API Anda
$API_BASE_URL = "http://localhost:3001/api/v1";

session_start();

// ============================================================
// HELPER CURL — Fungsi dasar untuk request ke REST API
// ============================================================

/**
 * Kirim request ke REST API.
 * @param string $method  GET, POST, PUT, PATCH, DELETE
 * @param string $endpoint  Contoh: "/tickets" atau "/auth/login"
 * @param array|null $data  Data yang dikirim (untuk POST/PUT/PATCH)
 * @return array  ['error' => bool, 'data' => ..., 'message' => '...']
 */
function api_request($method, $endpoint, $data = null) {
    global $API_BASE_URL;

    $url = $API_BASE_URL . $endpoint;
    $ch = curl_init();

    // Header default
    $headers = ['Content-Type: application/json'];

    // Tambah Bearer token jika sudah login
    if (isset($_SESSION['token'])) {
        $headers[] = 'Authorization: Bearer ' . $_SESSION['token'];
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    // Set method
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    // GET tidak perlu setting tambahan

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // Jika cURL error (server mati, timeout, dll)
    if ($curlError) {
        return ['error' => true, 'message' => 'Gagal terhubung ke server: ' . $curlError, 'data' => null];
    }

    // Decode JSON response
    $result = json_decode($response, true);
    if (!$result) {
        return ['error' => true, 'message' => 'Response tidak valid dari server (HTTP ' . $httpCode . ')', 'data' => null];
    }

    return $result;
}

// Shortcut functions
function api_get($endpoint)          { return api_request('GET', $endpoint); }
function api_post($endpoint, $data)  { return api_request('POST', $endpoint, $data); }
function api_put($endpoint, $data)   { return api_request('PUT', $endpoint, $data); }
function api_patch($endpoint, $data) { return api_request('PATCH', $endpoint, $data); }

// ============================================================
// AUTH — Login, Logout, Cek Session
// ============================================================

/**
 * Login ke REST API. Simpan token + user di $_SESSION.
 * @return bool  true jika berhasil, false jika gagal
 */
function api_login($email, $password) {
    $result = api_post('/auth/login', [
        'email'    => $email,
        'password' => $password,
    ]);

    if (!$result['error'] && isset($result['data']['token'])) {
        $_SESSION['token'] = $result['data']['token'];
        $_SESSION['user']  = $result['data']['user'];
        return true;
    }

    // Simpan pesan error untuk ditampilkan di halaman
    $_SESSION['login_error'] = $result['message'] ?? 'Login gagal';
    return false;
}

/**
 * Logout — hapus session dan beritahu server.
 */
function api_logout() {
    api_post('/auth/logout', []);
    session_unset();
    session_destroy();
}

/**
 * Cek apakah user sudah login.
 */
function is_logged_in() {
    return isset($_SESSION['token']) && isset($_SESSION['user']);
}

/**
 * Ambil data user yang sedang login.
 * @return array|null  ['id', 'name', 'email', 'role', ...]
 */
function get_current_user_data() {
    return $_SESSION['user'] ?? null;
}

/**
 * Ambil role user yang sedang login.
 * @return string  'USER', 'STAFF', 'MANAGER', atau ''
 */
function get_user_role() {
    return $_SESSION['user']['role'] ?? '';
}

/**
 * Redirect ke login.php jika belum login.
 */
function require_login() {
    if (!is_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Redirect jika role tidak sesuai.
 * @param string ...$roles  Role yang diizinkan, contoh: require_role('USER') atau require_role('STAFF', 'MANAGER')
 */
function require_role() {
    $roles = func_get_args();
    require_login();
    if (!in_array(get_user_role(), $roles)) {
        header('Location: login.php');
        exit;
    }
}

// ============================================================
// CATEGORIES
// ============================================================

/**
 * Ambil semua kategori tiket.
 * @return array  ['error' => bool, 'data' => [['id', 'name', 'description'], ...]]
 */
function get_categories() {
    return api_get('/categories');
}

// ============================================================
// TICKETS
// ============================================================

/**
 * Ambil daftar tiket dengan filter opsional.
 * @param array $params  ['status' => 'OPEN', 'search' => '...', 'limit' => 10, 'offset' => 0]
 * @return array
 */
function get_tickets($params = []) {
    $query = http_build_query($params);
    $endpoint = '/tickets' . ($query ? '?' . $query : '');
    return api_get($endpoint);
}

/**
 * Ambil detail satu tiket.
 * @param string $id  UUID tiket
 * @return array
 */
function get_ticket($id) {
    return api_get('/tickets/' . $id);
}

/**
 * Buat tiket baru. user_id otomatis dari token.
 * @param string $title        Judul tiket
 * @param string $description  Deskripsi masalah
 * @param string $category_id  UUID kategori (dari get_categories)
 * @return array
 */
function create_ticket($title, $description, $category_id) {
    return api_post('/tickets', [
        'title'       => $title,
        'description' => $description,
        'category_id' => $category_id,
    ]);
}

/**
 * Staff klaim tiket. staff_id otomatis dari token.
 */
function claim_ticket($ticket_id) {
    return api_post('/tickets/' . $ticket_id . '/claim', []);
}

/**
 * Staff lepas tiket.
 */
function unclaim_ticket($ticket_id, $reason) {
    return api_post('/tickets/' . $ticket_id . '/unclaim', [
        'unclaim_reason' => $reason,
    ]);
}

/**
 * Manager assign staff ke tiket.
 */
function assign_ticket($ticket_id, $staff_id) {
    return api_post('/tickets/' . $ticket_id . '/assign', [
        'staff_id' => $staff_id,
    ]);
}

/**
 * Manager ubah status tiket.
 */
function update_ticket_status($ticket_id, $status) {
    return api_patch('/tickets/' . $ticket_id . '/status', [
        'status' => $status,
    ]);
}

/**
 * Staff set tiket ke pending.
 */
function set_ticket_pending($ticket_id, $reason) {
    return api_patch('/tickets/' . $ticket_id . '/pending', [
        'pending_reason' => $reason,
    ]);
}

/**
 * Staff resolve tiket.
 */
function resolve_ticket($ticket_id, $note) {
    return api_patch('/tickets/' . $ticket_id . '/resolve', [
        'resolution_note' => $note,
    ]);
}

/**
 * Manager set difficulty.
 */
function set_ticket_difficulty($ticket_id, $level) {
    return api_patch('/tickets/' . $ticket_id . '/difficulty', [
        'difficulty_level' => (int)$level,
    ]);
}

/**
 * Ambil daftar staff untuk assign.
 */
function get_staff_list() {
    return api_get('/tickets/staff-list');
}

// ============================================================
// CHAT
// ============================================================

/**
 * Ambil semua pesan chat pada tiket.
 */
function get_chat_messages($ticket_id) {
    return api_get('/chat/' . $ticket_id);
}

/**
 * Kirim pesan chat. sender_id otomatis dari token.
 */
function send_chat_message($ticket_id, $message) {
    return api_post('/chat/' . $ticket_id, [
        'message' => $message,
    ]);
}

// ============================================================
// USERS (Manager only)
// ============================================================

function get_users()       { return api_get('/users'); }
function get_user($id)     { return api_get('/users/' . $id); }

function create_user($name, $email, $phone, $password, $role) {
    return api_post('/users', [
        'name'     => $name,
        'email'    => $email,
        'phone'    => $phone,
        'password' => $password,
        'role'     => $role,
    ]);
}

function update_user($id, $name, $email, $phone, $role) {
    return api_put('/users/' . $id, [
        'name'  => $name,
        'email' => $email,
        'phone' => $phone,
        'role'  => $role,
    ]);
}

function toggle_user_active($id) {
    return api_patch('/users/' . $id . '/toggle-active', []);
}

// ============================================================
// PROFILE
// ============================================================

function get_profile() { return api_get('/profile'); }

function update_profile($name, $email, $phone) {
    return api_put('/profile', [
        'name'  => $name,
        'email' => $email,
        'phone' => $phone,
    ]);
}

function change_password($current, $new) {
    return api_put('/profile/password', [
        'current_password' => $current,
        'new_password'     => $new,
    ]);
}

// ============================================================
// LEADERBOARD
// ============================================================

function get_leaderboard($view = 'monthly', $month = null, $year = null) {
    $params = ['view' => $view];
    if ($month) $params['month'] = $month;
    if ($year)  $params['year']  = $year;
    return api_get('/leaderboard?' . http_build_query($params));
}

function get_leaderboard_periods() {
    return api_get('/leaderboard/periods');
}

// ============================================================
// HELPER FORMAT
// ============================================================

/**
 * Format tanggal ISO ke format Indonesia.
 */
function format_tanggal($iso) {
    if (!$iso) return '-';
    $dt = new DateTime($iso);
    return $dt->format('d/m/Y H:i');
}

/**
 * Potong teks panjang.
 */
function potong_teks($text, $max = 100) {
    if (strlen($text) <= $max) return $text;
    return substr($text, 0, $max) . '...';
}
