<?php
// header.php harus di-include SETELAH function.php sudah di-require di halaman utama.
if (!function_exists('isLoggedIn')) {
    require_once __DIR__ . '/../config/function.php';
}
requireLogin();
$current_user_name = getCurrentUserName();
$current_role = getCurrentUserRole();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Dashboard - IT Helpdesk</title>
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@7.1.2/dist/style.min.css" rel="stylesheet" />
    <link href="<?= getBaseUrl() ?>css/styles.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>

<body class="sb-nav-fixed">
    <nav class="sb-topnav navbar navbar-expand " style="background-color: #f4f5fa">
        <a class="navbar-brand ps-3" href="<?= getBaseUrl() ?>"><i class="fas fa-ticket" style="color: #8c57ff;"></i> IT Helpdesk</a>
        <button class="btn btn-link btn-sm order-0 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#!" style="color: #8c57ff;"><i class="fas fa-bars"></i></button>
        <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user fa-fw"></i> <?= htmlspecialchars($current_user_name) ?>
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li><span class="dropdown-item-text text-muted small"><?= htmlspecialchars($current_role) ?></span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="<?= getBaseUrl() ?>page/profil/">Profil</a></li>
                    <li><a class="dropdown-item" href="<?= getBaseUrl() ?>logout/">Logout</a></li>
                </ul>
            </li>
        </ul>
    </nav>
    <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
            <nav class="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
                <div class="sb-sidenav-menu">
                    <div class="nav">

                        <?php if ($current_role === 'USER'): ?>
                        <!-- Menu User -->
                        <div class="sb-sidenav-menu-heading">
                            <div class="d-flex align-items-center mb-2">
                                <div style="flex:1; height:1px; background:#8c57ff33;"></div>
                                <div class="mx-2">Menu User</div>
                                <div style="flex:10; height:1px; background:#8c57ff33;"></div>
                            </div>
                        </div>
                        <a class="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#tiket_user" aria-expanded="false">
                            <div class="sb-nav-link-icon"><i class="fas fa-ticket"></i></div>
                            Tiket
                            <div class="sb-sidenav-collapse-arrow"><i class="fas fa-angle-down"></i></div>
                        </a>
                        <div class="collapse" id="tiket_user" data-bs-parent="#sidenavAccordion">
                            <nav class="sb-sidenav-menu-nested nav">
                                <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/buat.php">Buat Tiket Baru</a>
                                <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/antrian.php">Dalam Antrian</a>
                                <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/selesai.php">Selesai</a>
                            </nav>
                        </div>
                        <?php endif; ?>

                        <?php if ($current_role === 'STAFF'): ?>
                        <!-- Menu Support -->
                        <div class="sb-sidenav-menu-heading">
                            <div class="d-flex align-items-center mb-2">
                                <div style="flex:1; height:1px; background:#8c57ff33;"></div>
                                <div class="mx-2">Menu Support</div>
                                <div style="flex:10; height:1px; background:#8c57ff33;"></div>
                            </div>
                        </div>
                        <a class="nav-link" href="<?= getBaseUrl() ?>page/dashboard/">
                            <div class="sb-nav-link-icon"><i class="fas fa-home"></i></div>
                            Halaman Utama
                        </a>
                        <a class="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#tiket_support" aria-expanded="false">
                            <div class="sb-nav-link-icon"><i class="fas fa-ticket"></i></div>
                            Tiket
                            <div class="sb-sidenav-collapse-arrow"><i class="fas fa-angle-down"></i></div>
                        </a>
                        <div class="collapse" id="tiket_support" data-bs-parent="#sidenavAccordion">
                            <nav class="sb-sidenav-menu-nested nav">
                                <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/baru.php">Baru</a>
                                <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/proses.php">Dalam Antrian</a>
                                <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/riwayat.php">Selesai</a>
                            </nav>
                        </div>
                        <?php endif; ?>

                        <?php if ($current_role === 'MANAGER'): ?>
                        <!-- Menu Manager -->
                        <div class="sb-sidenav-menu-heading">
                            <div class="d-flex align-items-center mb-2">
                                <div style="flex:1; height:1px; background:#8c57ff33;"></div>
                                <div class="mx-2">Menu Manager</div>
                                <div style="flex:10; height:1px; background:#8c57ff33;"></div>
                            </div>
                        </div>
                        <a class="nav-link" href="<?= getBaseUrl() ?>page/dashboard/manager.php">
                            <div class="sb-nav-link-icon"><i class="fas fa-home"></i></div>
                            Halaman Ranking
                        </a>
                        <a class="nav-link" href="<?= getBaseUrl() ?>page/validasi/">
                            <div class="sb-nav-link-icon"><i class="fab fa-bitcoin"></i></div>
                            Validasi Poin
                        </a>
                        <a class="nav-link" href="<?= getBaseUrl() ?>page/tiket/baru.php">
                            <div class="sb-nav-link-icon"><i class="fas fa-ticket"></i></div>
                            Tiket Baru
                        </a>

                        <!-- Pengaturan (Manager only) -->
                        <div class="sb-sidenav-menu-heading">
                            <div class="d-flex align-items-center mb-2">
                                <div style="flex:1; height:1px; background:#8c57ff33;"></div>
                                <div class="mx-2">Pengaturan</div>
                                <div style="flex:10; height:1px; background:#8c57ff33;"></div>
                            </div>
                        </div>
                        <a class="nav-link" href="<?= getBaseUrl() ?>page/akun/">
                            <div class="sb-nav-link-icon"><i class="fas fa-user"></i></div>
                            Akun
                        </a>
                        <?php endif; ?>

                        <!-- Logout (semua role) -->
                        <div class="sb-sidenav-menu-heading">
                            <div class="d-flex align-items-center mb-2">
                                <div style="flex:1; height:1px; background:#8c57ff33;"></div>
                                <div class="mx-2">LogOut</div>
                                <div style="flex:10; height:1px; background:#8c57ff33;"></div>
                            </div>
                        </div>
                        <a class="nav-link" href="<?= getBaseUrl() ?>logout/">
                            <div class="sb-nav-link-icon"><i class="fas fa-door-open"></i></div>
                            Keluar
                        </a>

                    </div>
                </div>
                <div class="sb-sidenav-footer">
                    <div class="small">Login sebagai:</div>
                    <?= htmlspecialchars($current_user_name) ?> (<?= htmlspecialchars($current_role) ?>)
                </div>
            </nav>
        </div>
