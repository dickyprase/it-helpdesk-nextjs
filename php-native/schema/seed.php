<?php
// ============================================================
// seed.php — Buat data awal (user admin + kategori)
// 
// Cara pakai:
//   1. Pastikan database 'helpdesk' sudah dibuat dan schema sudah di-import
//   2. Jalankan di terminal: php seed.php
//   3. Atau buka di browser: http://localhost/helpdesk/schema/seed.php
// ============================================================

require_once __DIR__ . '/../config/config.php';

echo "=== IT Helpdesk — Seed Data ===\n\n";

// ============================================================
// 1. Buat User Admin (MANAGER)
// ============================================================
$admin_name     = 'Super Admin';
$admin_email    = 'admin@helpdesk.local';
$admin_password = 'admin123';
$admin_hash     = password_hash($admin_password, PASSWORD_BCRYPT);

// Cek apakah sudah ada
$check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$admin_email'");
if (mysqli_num_rows($check) === 0) {
    $q = "INSERT INTO `User` (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
          VALUES (UUID(), '$admin_name', '$admin_email', NULL, '$admin_hash', 'MANAGER', 1, NOW(), NOW())";
    if (mysqli_query($conn, $q)) {
        echo "[OK] User MANAGER dibuat: $admin_email / $admin_password\n";
    } else {
        echo "[ERROR] Gagal buat admin: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "[SKIP] User admin sudah ada: $admin_email\n";
}

// ============================================================
// 2. Buat User Staff
// ============================================================
$staff_name     = 'IT Support Staff';
$staff_email    = 'staff@helpdesk.local';
$staff_password = 'staff123';
$staff_hash     = password_hash($staff_password, PASSWORD_BCRYPT);

$check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$staff_email'");
if (mysqli_num_rows($check) === 0) {
    $q = "INSERT INTO `User` (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
          VALUES (UUID(), '$staff_name', '$staff_email', NULL, '$staff_hash', 'STAFF', 1, NOW(), NOW())";
    if (mysqli_query($conn, $q)) {
        echo "[OK] User STAFF dibuat: $staff_email / $staff_password\n";
    } else {
        echo "[ERROR] Gagal buat staff: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "[SKIP] User staff sudah ada: $staff_email\n";
}

// ============================================================
// 3. Buat User Biasa (untuk testing)
// ============================================================
$user_name     = 'User Demo';
$user_email    = 'user@helpdesk.local';
$user_password = 'user123';
$user_hash     = password_hash($user_password, PASSWORD_BCRYPT);

$check = mysqli_query($conn, "SELECT id FROM `User` WHERE email = '$user_email'");
if (mysqli_num_rows($check) === 0) {
    $q = "INSERT INTO `User` (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
          VALUES (UUID(), '$user_name', '$user_email', NULL, '$user_hash', 'USER', 1, NOW(), NOW())";
    if (mysqli_query($conn, $q)) {
        echo "[OK] User USER dibuat: $user_email / $user_password\n";
    } else {
        echo "[ERROR] Gagal buat user: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "[SKIP] User demo sudah ada: $user_email\n";
}

// ============================================================
// 4. Cek Kategori (sudah ada dari schema.sql)
// ============================================================
$cat_check = mysqli_query($conn, "SELECT COUNT(*) AS total FROM `Category`");
$cat_row = mysqli_fetch_assoc($cat_check);
if ((int)$cat_row['total'] === 0) {
    // Insert kategori jika belum ada
    $categories = ['Account', 'Hardware', 'Network', 'Software', 'Other'];
    $descs = [
        'Masalah terkait akun, login, hak akses',
        'Masalah perangkat keras (printer, PC, monitor, dll)',
        'Masalah jaringan, internet, WiFi, VPN',
        'Masalah aplikasi, sistem operasi, update',
        'Masalah lain yang tidak termasuk kategori di atas'
    ];
    foreach ($categories as $i => $cat) {
        $desc = $descs[$i];
        mysqli_query($conn, "INSERT INTO `Category` (id, name, description) VALUES (UUID(), '$cat', '$desc')");
    }
    echo "[OK] 5 kategori dibuat\n";
} else {
    echo "[SKIP] Kategori sudah ada ({$cat_row['total']} kategori)\n";
}

// ============================================================
// 5. Cek WA_Setting
// ============================================================
$wa_check = mysqli_query($conn, "SELECT COUNT(*) AS total FROM `WA_Setting`");
$wa_row = mysqli_fetch_assoc($wa_check);
if ((int)$wa_row['total'] === 0) {
    mysqli_query($conn, "INSERT INTO `WA_Setting` (id, is_enabled, connection_status) VALUES (UUID(), 0, 'disconnected')");
    echo "[OK] WA_Setting dibuat\n";
} else {
    echo "[SKIP] WA_Setting sudah ada\n";
}

echo "\n=== Selesai! ===\n";
echo "\nAkun yang tersedia:\n";
echo "┌──────────┬────────────────────────┬──────────┐\n";
echo "│ Role     │ Email                  │ Password │\n";
echo "├──────────┼────────────────────────┼──────────┤\n";
echo "│ MANAGER  │ admin@helpdesk.local   │ admin123 │\n";
echo "│ STAFF    │ staff@helpdesk.local   │ staff123 │\n";
echo "│ USER     │ user@helpdesk.local    │ user123  │\n";
echo "└──────────┴────────────────────────┴──────────┘\n";
echo "\nBuka: {$url}login/\n";
