<?php
require_once 'function.php';
require_role('USER');

// GET tiket milik user yang sudah selesai (RESOLVED + CLOSED)
$result = get_tickets(['status' => 'RESOLVED']);
$tickets_resolved = (!$result['error'] && isset($result['data'])) ? $result['data'] : [];

$result2 = get_tickets(['status' => 'CLOSED']);
$tickets_closed = (!$result2['error'] && isset($result2['data'])) ? $result2['data'] : [];

$tickets = array_merge($tickets_resolved, $tickets_closed);

include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">
            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-check-circle me-1"></i>
                    Tiket Terselesaikan (<?= count($tickets) ?>)
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
                                <th>Kode Tiket</th>
                                <th>Judul</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Staff</th>
                                <th>Tanggal</th>
                                <th>Aksi</th>
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
                                    if ($status === 'RESOLVED') { $badge = 'info';      $label = 'Selesai'; }
                                    if ($status === 'CLOSED')   { $badge = 'secondary';  $label = 'Ditutup'; }
                                    ?>
                                    <span class="badge bg-<?= $badge ?>"><?= $label ?></span>
                                </td>
                                <td><?= htmlspecialchars($t['staff']['name'] ?? '-') ?></td>
                                <td><?= format_tanggal($t['created_at'] ?? '') ?></td>
                                <td>
                                    <a href="chat-user.php?id=<?= htmlspecialchars($t['id']) ?>" class="btn btn-warning btn-sm">Riwayat Chat</a>
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

    <?php include "footer.php"; ?>
