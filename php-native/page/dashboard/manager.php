<?php
require_once '../../config/function.php';
requireRole('MANAGER');

$leaderboard = getLeaderboard();

include '../../includes/header.php';
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

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
    <?php include '../../includes/footer.php'; ?>
