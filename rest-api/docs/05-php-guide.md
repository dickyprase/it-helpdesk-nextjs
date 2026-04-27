# Integrasi PHP (cURL)

Panduan mengintegrasikan REST API ke project PHP menggunakan **cURL procedural**.

## Arsitektur

```
Browser ──> PHP Page ──> function.php ──> cURL ──> REST API ──> PostgreSQL
                              │
                         $_SESSION
                       (token + user)
```

PHP tidak terhubung langsung ke database. Semua data diambil dan dikirim melalui REST API via HTTP request (cURL).

## Setup

### 1. Copy `function.php` ke project PHP Anda

File ini berisi semua fungsi untuk berkomunikasi dengan REST API.

### 2. Set Base URL API

Buka `function.php`, ubah baris ini sesuai alamat server REST API:

```php
$API_BASE_URL = "http://localhost:3001/api/v1";
```

Jika REST API di server berbeda:
```php
$API_BASE_URL = "http://192.168.1.100:3001/api/v1";
```

### 3. Pastikan PHP cURL aktif

```bash
php -m | grep curl
```

Jika belum aktif, install:
```bash
sudo apt install php-curl
sudo systemctl restart apache2
```

## Cara Kerja Session

```
1. User submit form login
2. PHP panggil api_login($email, $password)
3. function.php kirim POST /auth/login via cURL
4. REST API return { token, user }
5. function.php simpan di $_SESSION['token'] dan $_SESSION['user']
6. Setiap request selanjutnya, cURL otomatis kirim header:
   Authorization: Bearer <token-dari-session>
```

## Referensi Fungsi

### Helper

| Fungsi | Parameter | Return | Keterangan |
|--------|-----------|--------|------------|
| `api_get($endpoint)` | `"/tickets"` | `array` | GET request dengan token |
| `api_post($endpoint, $data)` | `"/tickets", [...]` | `array` | POST request |
| `api_put($endpoint, $data)` | `"/profile", [...]` | `array` | PUT request |
| `api_patch($endpoint, $data)` | `"/tickets/id/status", [...]` | `array` | PATCH request |

Semua return format: `['error' => bool, 'data' => ..., 'message' => '...']`

### Auth

| Fungsi | Keterangan |
|--------|------------|
| `api_login($email, $password)` | Login, simpan token di session. Return `true`/`false` |
| `api_logout()` | Hapus session + beritahu server |
| `is_logged_in()` | Cek apakah sudah login |
| `get_current_user_data()` | Return array user: `['id', 'name', 'email', 'role']` |
| `get_user_role()` | Return string: `'USER'`, `'STAFF'`, `'MANAGER'` |
| `require_login()` | Redirect ke `login.php` jika belum login |
| `require_role('USER')` | Redirect jika role tidak sesuai |

### Tickets

| Fungsi | Parameter | Keterangan |
|--------|-----------|------------|
| `get_tickets($params)` | `['status' => 'OPEN']` | List tiket (USER otomatis hanya tiket sendiri) |
| `get_ticket($id)` | UUID | Detail satu tiket |
| `create_ticket($title, $desc, $cat_id)` | string, string, UUID | Buat tiket baru |
| `claim_ticket($id)` | UUID | Staff klaim tiket |
| `unclaim_ticket($id, $reason)` | UUID, string | Staff lepas tiket |
| `resolve_ticket($id, $note)` | UUID, string | Staff resolve tiket |
| `set_ticket_pending($id, $reason)` | UUID, string | Staff set pending |
| `update_ticket_status($id, $status)` | UUID, string | Manager ubah status |
| `set_ticket_difficulty($id, $level)` | UUID, int(1-3) | Manager set difficulty |
| `assign_ticket($id, $staff_id)` | UUID, UUID | Manager assign staff |
| `get_staff_list()` | - | List staff untuk dropdown assign |

### Categories

| Fungsi | Keterangan |
|--------|------------|
| `get_categories()` | List semua kategori untuk dropdown |

### Chat

| Fungsi | Parameter | Keterangan |
|--------|-----------|------------|
| `get_chat_messages($ticket_id)` | UUID | Ambil semua pesan chat |
| `send_chat_message($ticket_id, $msg)` | UUID, string | Kirim pesan |

### Users (Manager)

| Fungsi | Keterangan |
|--------|------------|
| `get_users()` | List semua user |
| `create_user($name, $email, $phone, $pass, $role)` | Buat user baru |
| `update_user($id, $name, $email, $phone, $role)` | Edit user |
| `toggle_user_active($id)` | Aktifkan/nonaktifkan |

### Profile

| Fungsi | Keterangan |
|--------|------------|
| `get_profile()` | Ambil profil sendiri |
| `update_profile($name, $email, $phone)` | Update profil |
| `change_password($current, $new)` | Ganti password |

### Helper Format

| Fungsi | Keterangan |
|--------|------------|
| `format_tanggal($iso)` | Format ISO date ke `dd/mm/yyyy HH:ii` |
| `potong_teks($text, $max)` | Potong teks panjang + `...` |

---

## Contoh Integrasi Lengkap

### login.php

```php
<?php
require_once 'function.php';

// Jika sudah login, redirect
if (is_logged_in()) {
    header('Location: tiket-baru-user.php');
    exit;
}

// Handle form submit
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (api_login($email, $password)) {
        // Redirect berdasarkan role
        $role = get_user_role();
        if ($role === 'MANAGER') header('Location: index-manager.php');
        elseif ($role === 'STAFF') header('Location: index.php');
        else header('Location: tiket-baru-user.php');
        exit;
    } else {
        $error = $_SESSION['login_error'] ?? 'Login gagal';
        unset($_SESSION['login_error']);
    }
}
?>
<!-- Form HTML -->
<form method="POST" action="">
    <input name="email" type="email" required />
    <input name="password" type="password" required />
    <button type="submit">Login</button>
</form>
```

### Buat Tiket (CREATE)

```php
<?php
require_once 'function.php';
require_role('USER'); // Hanya USER yang bisa buat tiket

// Handle form submit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $result = create_ticket(
        $_POST['title'],
        $_POST['description'],
        $_POST['category_id']
    );

    if (!$result['error']) {
        $success = 'Tiket berhasil dibuat! Kode: ' . $result['data']['code'];
    } else {
        $error = $result['message'];
    }
}

// Ambil kategori untuk dropdown
$categories = get_categories();
$cat_list = $categories['data'] ?? [];
?>
<form method="POST">
    <input name="title" placeholder="Judul kendala" required />

    <select name="category_id" required>
        <option value="">-- Pilih Kategori --</option>
        <?php foreach ($cat_list as $cat): ?>
        <option value="<?= $cat['id'] ?>"><?= $cat['name'] ?></option>
        <?php endforeach; ?>
    </select>

    <textarea name="description" required></textarea>
    <button type="submit">Kirim</button>
</form>
```

### List Tiket (READ)

```php
<?php
require_once 'function.php';
require_role('USER');

// Ambil tiket dalam antrian
$result = get_tickets(['status' => 'IN_PROGRESS']);
$tickets = $result['data'] ?? [];
?>
<table>
    <tr>
        <th>Kode</th><th>Judul</th><th>Status</th><th>Staff</th><th>Tanggal</th>
    </tr>
    <?php foreach ($tickets as $t): ?>
    <tr>
        <td><?= $t['code'] ?></td>
        <td><?= $t['title'] ?></td>
        <td><?= $t['status'] ?></td>
        <td><?= $t['staff']['name'] ?? 'Belum ada' ?></td>
        <td><?= format_tanggal($t['created_at']) ?></td>
    </tr>
    <?php endforeach; ?>
</table>
```

### Logout

```php
<?php
// logout.php
require_once 'function.php';
api_logout();
header('Location: login.php');
exit;
```

---

## Mapping Halaman → Fungsi → Endpoint

| Halaman PHP | Fungsi yang Dipanggil | Endpoint API |
|-------------|----------------------|--------------|
| `login.php` | `api_login()` | `POST /auth/login` |
| `logout.php` | `api_logout()` | `POST /auth/logout` |
| `tiket-baru-user.php` | `get_categories()`, `create_ticket()` | `GET /categories`, `POST /tickets` |
| `tiket-antri-user.php` | `get_tickets(['status'=>'OPEN'])` dst | `GET /tickets?status=OPEN` |
| `tiket-selesai-user.php` | `get_tickets(['status'=>'RESOLVED'])` dst | `GET /tickets?status=RESOLVED` |
| `tiket-baru-support.php` | `get_tickets(['status'=>'OPEN'])` | `GET /tickets?status=OPEN` |
| `tiket-antri-support.php` | `get_tickets(...)`, `claim_ticket()` | `GET /tickets`, `POST /tickets/:id/claim` |
| `chat.php` | `get_chat_messages()`, `send_chat_message()` | `GET /chat/:id`, `POST /chat/:id` |
| `akun.php` | `get_users()`, `create_user()`, `update_user()`, `toggle_user_active()` | `GET /users`, `POST /users`, `PUT /users/:id`, `PATCH /users/:id/toggle-active` |
| `validasi-poin.php` | `update_ticket_status($id, 'CLOSED')` | `PATCH /tickets/:id/status` |

---

## Tips

### Cek apakah API bisa diakses dari PHP

```php
<?php
$ch = curl_init("http://localhost:3001/api/v1");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
echo $response;
// Harus tampil: {"error":false,"message":"IT Helpdesk REST API v1 is running"}
```

### Debug response API

```php
$result = get_tickets();
echo '<pre>';
print_r($result);
echo '</pre>';
```

### Error "Gagal terhubung ke server"

- Pastikan REST API sudah berjalan (`npm start` di folder rest-api)
- Pastikan `$API_BASE_URL` di `function.php` benar
- Jika beda server, pastikan firewall mengizinkan port 3001
