<?php
require_once 'function.php';
require_role('USER');

// GET tiket milik user yang sedang dalam antrian (OPEN, IN_PROGRESS, PENDING)
$result = get_tickets(['status' => 'OPEN']);
$tickets_open = (!$result['error'] && isset($result['data'])) ? $result['data'] : [];

$result2 = get_tickets(['status' => 'IN_PROGRESS']);
$tickets_progress = (!$result2['error'] && isset($result2['data'])) ? $result2['data'] : [];

$result3 = get_tickets(['status' => 'PENDING']);
$tickets_pending = (!$result3['error'] && isset($result3['data'])) ? $result3['data'] : [];

// Gabung semua tiket dalam antrian
$tickets = array_merge($tickets_open, $tickets_progress, $tickets_pending);

include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">
            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-list me-1"></i>
                    Tiket dalam Antrian (<?= count($tickets) ?>)
                </div>
                <div class="card-body">
                    <?php if (empty($tickets)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p>Belum ada tiket dalam antrian.</p>
                        <a href="tiket-baru-user.php" class="btn btn-success">Buat Tiket Baru</a>
                    </div>
                    <?php else: ?>
                    <table id="datatablesSimpleTicket">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Tiket</th>
                                <th>Judul</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Staff</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; foreach ($tickets as $t): ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><code><?= htmlspecialchars($t['code'] ?? '-') ?></code></td>
                                <td><?= htmlspecialchars(potong_teks($t['title'] ?? '', 50)) ?></td>
                                <td><?= htmlspecialchars($t['category']['name'] ?? '-') ?></td>
                                <td>
                                    <?php
                                    $status = $t['status'] ?? '';
                                    $badge = 'secondary';
                                    $label = $status;
                                    if ($status === 'OPEN')        { $badge = 'success'; $label = 'Terbuka'; }
                                    if ($status === 'IN_PROGRESS') { $badge = 'primary'; $label = 'Diproses'; }
                                    if ($status === 'PENDING')     { $badge = 'warning'; $label = 'Tertunda'; }
                                    ?>
                                    <span class="badge bg-<?= $badge ?>"><?= $label ?></span>
                                </td>
                                <td><?= htmlspecialchars($t['staff']['name'] ?? 'Belum ada') ?></td>
                                <td><?= format_tanggal($t['created_at'] ?? '') ?></td>
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
