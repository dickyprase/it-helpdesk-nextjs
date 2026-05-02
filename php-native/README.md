# IT Helpdesk — PHP Native

Sistem manajemen tiket IT Helpdesk menggunakan PHP Native Procedural + MySQL.

---

## Prasyarat

- **PHP** >= 8.0 (dengan ekstensi `mysqli`)
- **MySQL** >= 5.7 atau **MariaDB** >= 10.3
- **Web Server**: Apache (XAMPP/Laragon/LAMP) atau PHP built-in server

### Cek PHP & mysqli

```bash
php -v
php -m | grep mysqli
```

Jika `mysqli` belum aktif:
- **XAMPP**: Buka `php.ini`, hapus `;` di depan `extension=mysqli`
- **Linux**: `sudo apt install php-mysql && sudo systemctl restart apache2`

---

## Cara Deploy

### Langkah 1: Copy Folder

**XAMPP (Windows):**
```
Copy folder php-native/ ke C:\xampp\htdocs\helpdesk\
```

**Laragon (Windows):**
```
Copy folder php-native/ ke C:\laragon\www\helpdesk\
```

**Linux (Apache):**
```bash
sudo cp -r php-native/ /var/www/html/helpdesk/
sudo chown -R www-data:www-data /var/www/html/helpdesk/
sudo chmod -R 755 /var/www/html/helpdesk/
sudo chmod -R 777 /var/www/html/helpdesk/uploads/
```

**PHP Built-in Server (untuk testing):**
```bash
cd php-native
php -S localhost:8080
# Buka: http://localhost:8080/login/
```

---

### Langkah 2: Buat Database

#### Opsi A: Via phpMyAdmin (Rekomendasi)

1. Buka **phpMyAdmin** di browser (`http://localhost/phpmyadmin`)
2. Klik **"New"** di sidebar kiri
3. Isi nama database: `helpdesk`
4. Pilih collation: `utf8mb4_unicode_ci`
5. Klik **"Create"**
6. Pilih database `helpdesk` yang baru dibuat
7. Klik tab **"Import"**
8. Klik **"Choose File"** → pilih file `schema/helpdesk.sql`
9. Klik **"Go"**
10. Tunggu sampai muncul pesan sukses

#### Opsi B: Via Terminal

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
USE helpdesk;
SOURCE /path/to/php-native/schema/helpdesk.sql;

# Atau langsung:
mysql -u root -p helpdesk < schema/helpdesk.sql
```

---

### Langkah 3: Konfigurasi Database

Buka file `config/config.php` dan sesuaikan:

```php
<?php
// Base URL — sesuaikan dengan alamat server Anda
$url = "http://localhost/helpdesk/";

// Koneksi MySQL — sesuaikan dengan server MySQL Anda
$host     = 'localhost';
$username = 'root';       // username MySQL
$password = '';            // password MySQL (kosong jika XAMPP default)
$database = 'helpdesk';   // nama database
```

**Contoh konfigurasi:**

| Server | `$url` | `$host` | `$username` | `$password` |
|--------|--------|---------|-------------|-------------|
| XAMPP (default) | `http://localhost/helpdesk/` | `localhost` | `root` | `` (kosong) |
| Laragon | `http://helpdesk.test/` | `localhost` | `root` | `` (kosong) |
| Linux Apache | `http://localhost/helpdesk/` | `localhost` | `root` | `password_anda` |
| PHP built-in | `http://localhost:8080/` | `localhost` | `root` | `` |
| Server online | `https://helpdesk.domain.com/` | `localhost` | `db_user` | `db_password` |

> **Penting:** `$url` harus diakhiri dengan `/` (slash).

---

### Langkah 4: Buat User Pertama

#### Opsi A: Jalankan seed.php (Rekomendasi)

**Via browser:**
```
Buka: http://localhost/helpdesk/schema/seed.php
```

**Via terminal:**
```bash
cd php-native
php schema/seed.php
```

**Output yang diharapkan:**
```
=== IT Helpdesk — Seed Data ===

[OK] User MANAGER dibuat: admin@helpdesk.local / admin123
[OK] User STAFF dibuat: staff@helpdesk.local / staff123
[OK] User USER dibuat: user@helpdesk.local / user123
[SKIP] Kategori sudah ada (5 kategori)
[SKIP] WA_Setting sudah ada

=== Selesai! ===

Akun yang tersedia:
┌──────────┬────────────────────────┬──────────┐
│ Role     │ Email                  │ Password │
├──────────┼────────────────────────┼──────────┤
│ MANAGER  │ admin@helpdesk.local   │ admin123 │
│ STAFF    │ staff@helpdesk.local   │ staff123 │
│ USER     │ user@helpdesk.local    │ user123  │
└──────────┴────────────────────────┴──────────┘
```

#### Opsi B: Via phpMyAdmin (Manual)

1. Buka phpMyAdmin → pilih database `helpdesk` → pilih tabel `User`
2. Klik tab **"Insert"**
3. Isi field:

| Field | Nilai |
|-------|-------|
| id | *(biarkan kosong, akan auto UUID)* |
| name | `Super Admin` |
| email | `admin@helpdesk.local` |
| phone | *(kosong)* |
| password_hash | *(lihat cara generate di bawah)* |
| role | `MANAGER` |
| is_active | `1` |

**Cara generate password hash:**

Buat file sementara `generate_hash.php`:
```php
<?php
echo password_hash('admin123', PASSWORD_BCRYPT);
```

Jalankan:
```bash
php generate_hash.php
# Output: $2y$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy output tersebut ke field `password_hash` di phpMyAdmin.

#### Opsi C: Via SQL Query

```sql
INSERT INTO `User` (id, name, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    UUID(),
    'Super Admin',
    'admin@helpdesk.local',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'MANAGER',
    1,
    NOW(),
    NOW()
);
```

> **Catatan:** Hash di atas adalah untuk password `password`. Untuk keamanan, gunakan `seed.php` atau `generate_hash.php` untuk membuat hash yang benar.

---

### Langkah 5: Login

Buka browser:
```
http://localhost/helpdesk/login/
```

Akun default:

| Role | Email | Password | Halaman Setelah Login |
|------|-------|----------|----------------------|
| **Manager** | `admin@helpdesk.local` | `admin123` | Dashboard Manager (ranking) |
| **Staff** | `staff@helpdesk.local` | `staff123` | Dashboard Staff (stats + ranking) |
| **User** | `user@helpdesk.local` | `user123` | Form Buat Tiket |

---

## Setelah Deploy: Hapus File Sensitif

Setelah selesai setup, **hapus file-file ini** dari server production:

```bash
rm schema/seed.php          # Jangan biarkan seed bisa diakses publik
rm schema/helpdesk.sql      # Schema tidak perlu di server production
```

Atau tambahkan `.htaccess` di folder `schema/`:
```apache
Deny from all
```

---

## Troubleshooting

### Error "Koneksi database gagal"
- Pastikan MySQL/MariaDB sudah berjalan
- Cek `$host`, `$username`, `$password`, `$database` di `config/config.php`
- Pastikan database `helpdesk` sudah dibuat

### Error "Table doesn't exist"
- Import `schema/helpdesk.sql` ke database `helpdesk`
- Pastikan import berhasil (cek di phpMyAdmin → tabel harus ada 10)

### Halaman blank / error 500
- Cek PHP error log: `tail -f /var/log/apache2/error.log` (Linux) atau XAMPP error log
- Pastikan PHP >= 8.0 dan ekstensi `mysqli` aktif

### Login gagal padahal email/password benar
- Pastikan `seed.php` sudah dijalankan
- Cek apakah user ada di tabel `User` via phpMyAdmin
- Pastikan `is_active = 1`

### Sidebar tidak muncul / halaman redirect terus
- Pastikan `$url` di `config/config.php` sesuai dengan URL yang diakses
- Pastikan diakhiri `/` (slash)

---

## Struktur Folder

```
php-native/
├── index.php              ← redirect ke login
├── config/
│   ├── config.php         ← koneksi MySQL + base URL
│   └── function.php       ← 30+ fungsi CRUD
├── login/index.php        ← form login
├── logout/index.php       ← destroy session
├── includes/
│   ├── header.php         ← navbar + sidebar (role-based)
│   └── footer.php         ← JS includes
├── page/
│   ├── tiket/             ← CRUD tiket (USER + STAFF)
│   ├── chat/              ← chat + AJAX polling 3 detik
│   ├── dashboard/         ← stats + leaderboard
│   ├── akun/              ← kelola user (MANAGER)
│   ├── validasi/          ← validasi poin (MANAGER)
│   └── profil/            ← edit profil + ganti password
├── uploads/               ← file attachment
├── schema/
│   ├── helpdesk.sql       ← MySQL schema
│   └── seed.php           ← buat user + data awal
├── css/ js/ assets/       ← SB Admin template
```
