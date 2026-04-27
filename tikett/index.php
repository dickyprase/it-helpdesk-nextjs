<?php
require_once 'function.php';
require_role('STAFF');

// Fetch ticket counts
$r_open = get_tickets(['status' => 'OPEN']);
$r_progress = get_tickets(['status' => 'IN_PROGRESS']);
$r_resolved = get_tickets(['status' => 'RESOLVED']);
$r_closed = get_tickets(['status' => 'CLOSED']);

$count_new = (!$r_open['error'] && isset($r_open['data'])) ? count($r_open['data']) : 0;
$count_queue = (!$r_progress['error'] && isset($r_progress['data'])) ? count($r_progress['data']) : 0;
$count_done = 0;
if (!$r_resolved['error'] && isset($r_resolved['data'])) $count_done += count($r_resolved['data']);
if (!$r_closed['error'] && isset($r_closed['data'])) $count_done += count($r_closed['data']);

// Fetch leaderboard
$lb_result = get_leaderboard('monthly');
$leaderboard = (!$lb_result['error'] && isset($lb_result['data'])) ? $lb_result['data'] : [];

// Find current user's points
$my_points = 0;
$current_user = get_current_user_data();
foreach ($leaderboard as $entry) {
    if (($entry['staff_id'] ?? '') === ($current_user['id'] ?? '')) {
        $my_points = $entry['total_points'] ?? 0;
        break;
    }
}

include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <div class="row mt-4" style="font-weight: bold; font-size: 20px; color: rgb(134, 134, 134);">

                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="row d-flex align-items-center mb-3">
                            <div class="col-8">
                                <div class="card-body">Tiket Baru</div>
                            </div>
                            <div class="col-4 text-end">
                                <div class="card-body" style="font-size: 30px; color: #8c57ff;"><?= $count_new ?></div>
                            </div>
                        </div>
                        <a class="btn" href="tiket-baru-support.php" style="background-color: #8c57ff; color: white; text-decoration: none;">Selengkapnya</a>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="row d-flex align-items-center mb-3">
                            <div class="col-8">
                                <div class="card-body">Tiket Dalam Antrian</div>
                            </div>
                            <div class="col-4 text-end">
                                <div class="card-body" style="font-size: 30px; color: #8c57ff;"><?= $count_queue ?></div>
                            </div>
                        </div>
                        <a class="btn" href="tiket-antri-support.php" style="background-color: #8c57ff; color: white; text-decoration: none;">Selengkapnya</a>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="row d-flex align-items-center mb-3">
                            <div class="col-8">
                                <div class="card-body">Tiket Selesai</div>
                            </div>
                            <div class="col-4 text-end">
                                <div class="card-body" style="font-size: 30px; color: #8c57ff;"><?= $count_done ?></div>
                            </div>
                        </div>
                        <a class="btn" href="tiket-selesai-support.php" style="background-color: #8c57ff; color: white; text-decoration: none;">Selengkapnya</a>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded" style="height: 165px;">
                        <div class="row d-flex justify-content-center align-items-center mb-3 text-center">
                            <div class="card-body">POIN KAMU</div>
                            <div style="font-size: 30px; color: #8c57ff;"><?= $my_points ?></div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Leaderboard -->
            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-trophy me-1"></i>
                    Peringkat
                </div>
                <div class="card-body">
                    <?php if (empty($leaderboard)): ?>
                    <p class="text-muted text-center">Belum ada data ranking bulan ini.</p>
                    <?php else: ?>
                    <table id="datatablesSimple">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Email</th>
                                <th>Poin</th>
                                <th>Tiket Selesai</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; foreach ($leaderboard as $lb): ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><?= htmlspecialchars($lb['staff_name'] ?? '-') ?></td>
                                <td><?= htmlspecialchars($lb['staff_email'] ?? '-') ?></td>
                                <td><strong><?= $lb['total_points'] ?? 0 ?></strong></td>
                                <td><?= $lb['tickets_closed'] ?? 0 ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </main>
    <?php include "footer.php"; ?>
