<?php
require_once '../../config/function.php';
requireRole('STAFF', 'MANAGER');

$success = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['claim_id'])) {
    $result = claimTicket($_POST['claim_id']);
    if ($result['status']) $success = $result['message'];
    else $error = $result['message'];
}

$tickets = getTickets("t.status = 'OPEN' AND t.staff_id IS NULL");

include '../../includes/header.php';
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <?php if ($success): ?>
            <div class="alert alert-success mt-3"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="alert alert-danger mt-3"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-ticket me-1"></i>
                    Tiket Baru (<?= count($tickets) ?>)
                </div>
                <div class="card-body">
                    <?php if (empty($tickets)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p>Tidak ada tiket baru saat ini.</p>
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
                                <th>Aksi</th>
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
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Ambil tiket ini?')">
                                        <input type="hidden" name="claim_id" value="<?= htmlspecialchars($t['id']) ?>">
                                        <button type="submit" class="btn btn-success btn-sm">Ambil Tiket</button>
                                    </form>
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
