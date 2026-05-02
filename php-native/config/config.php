<?php
// ============================================================
// config.php — Konfigurasi Database & Aplikasi
// ============================================================

// Base URL aplikasi (sesuaikan dengan server Anda)
$url = "http://localhost/helpdesk/";

// Koneksi MySQL
$host     = 'localhost';
$username = 'root';
$password = '';
$database = 'helpdesk';

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die('Koneksi database gagal: ' . $conn->connect_error);
}

// Set charset
mysqli_set_charset($conn, 'utf8mb4');
