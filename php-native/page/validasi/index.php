<?php
require_once '../../config/function.php';
requireRole('MANAGER');

$success = '';
$error = '';

// Handle validation (set difficulty + close ticket)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['validate_id'])) {
    $ticket_id = $_POST['validate_id'];
    $difficulty = (int)($_POST['difficulty'] ?? 1);

    $r1 = setTicketDifficulty($ticket_id, $difficulty);
    if ($r1['status']) {
        $r2 = updateTicketStatus($ticket_id, 'CLOSED');
        if ($r2['status']) {
            $poin = $difficulty * 10;
            $success = "Tiket berhasil divalidasi! Poin yang diberikan: $poin";
        } else {
            $error = $r2['message'];
        }
    } else {
        $error = $r1['message'];
    }
}

// Get RESOLVED tickets (awaiting validation)
$tickets = getTickets("t.status = 'RESOLVED'");

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
                    <i class="fab fa-bitcoin me-1"></i>
                    Validasi Poin — Tiket Menunggu Validasi (<?= count($tickets) ?>)
                </div>
                <div class="card-body">
                    <?php if (empty($tickets)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p>Tidak ada tiket yang menunggu validasi.</p>
                    </div>
                    <?php else: ?>
                    <table id="datatablesSimpleTicket">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>No Tiket</th>
                                <th>Nama User</th>
                                <th>Staff</th>
                                <th>Tanggal</th>
                                <th>Deskripsi</th>
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
                                <td><?= htmlspecialchars($t['staff_name'] ?? '-') ?></td>
                                <td><?= formatTanggal($t['created_at'] ?? '') ?></td>
                                <td><?= htmlspecialchars(potongTeks($t['description'] ?? '', 60)) ?></td>
                                <td><?= htmlspecialchars($t['category_name'] ?? '-') ?></td>
                                <td>
                                    <a href="<?= getBaseUrl() ?>page/chat/?id=<?= htmlspecialchars($t['id']) ?>" class="btn btn-warning" style="font-size: 15px;">Riwayat Chat</a>
                                    <button class="btn btn-success" style="font-size: 15px;" data-bs-toggle="modal" data-bs-target="#valModal<?= $no ?>">Validasi</button>
                                </td>
                            </tr>

                            <!-- Validation Modal -->
                            <div class="modal fade" id="valModal<?= $no ?>" tabindex="-1">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content">
                                        <form method="POST">
                                            <input type="hidden" name="validate_id" value="<?= htmlspecialchars($t['id']) ?>">
                                            <div class="modal-header">
                                                <h5 class="modal-title">Validasi Tiket <?= htmlspecialchars($t['code'] ?? '') ?></h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div class="modal-body">
                                                <p><strong>Staff:</strong> <?= htmlspecialchars($t['staff_name'] ?? '-') ?></p>
                                                <p><strong>Deskripsi:</strong> <?= htmlspecialchars($t['description'] ?? '-') ?></p>
                                                <hr>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Tingkat Kesulitan</strong></label>
                                                    <select class="form-select" name="difficulty" required>
                                                        <option value="1">Mudah (10 Poin)</option>
                                                        <option value="2">Sedang (20 Poin)</option>
                                                        <option value="3">Sulit (30 Poin)</option>
                                                    </select>
                                                    <div class="form-text">Poin akan diberikan ke staff yang menangani.</div>
                                                </div>
                                            </div>
                                            <div class="modal-footer">
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                                                <button type="submit" class="btn btn-success">Validasi & Tutup Tiket</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>
    <?php include '../../includes/footer.php'; ?>
