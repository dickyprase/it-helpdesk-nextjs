<?php
require_once '../../config/function.php';
requireRole('STAFF', 'MANAGER');

$staff_id = getCurrentUserId();
$tickets = getTickets("t.staff_id = '$staff_id' AND t.status IN ('RESOLVED','CLOSED')");

include '../../includes/header.php';
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">
            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-check-circle me-1"></i>
                    Tiket Selesai (<?= count($tickets) ?>)
                </div>
                <div class="card-body">
                    <?php if (empty($tickets)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p>Belum ada tiket yang selesai.</p>
                    </div>
                    <?php else: ?>
                    <table id="datatablesSimpleTicket">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>No Tiket</th>
                                <th>Nama</th>
                                <th>Tanggal</th>
                                <th>Deskripsi Kendala</th>
                                <th>Kategori</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; foreach ($tickets as $t): ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><?= htmlspecialchars($t['code'] ?? '-') ?></td>
                                <td><?= htmlspecialchars($t['user_name'] ?? '-') ?></td>
                                <td><?= formatTanggal($t['created_at'] ?? '') ?></td>
                                <td><?= htmlspecialchars(potongTeks($t['description'] ?? '', 80)) ?></td>
                                <td><?= htmlspecialchars($t['category_name'] ?? '-') ?></td>
                                <td>
                                    <?php if (($t['status'] ?? '') === 'RESOLVED'): ?>
                                        <span class="badge bg-info">Proses Validasi</span>
                                        <a href="<?= getBaseUrl() ?>page/chat/?id=<?= htmlspecialchars($t['id']) ?>" class="btn btn-warning btn-sm ms-1">Riwayat Chat</a>
                                    <?php else: ?>
                                        <span class="badge bg-secondary">Selesai</span>
                                        <a href="<?= getBaseUrl() ?>page/chat/?id=<?= htmlspecialchars($t['id']) ?>" class="btn btn-warning btn-sm ms-1">Riwayat Chat</a>
                                    <?php endif; ?>
                                </td>
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
