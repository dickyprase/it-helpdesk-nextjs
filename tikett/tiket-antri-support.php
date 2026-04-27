<?php
require_once 'function.php';
require_role('STAFF', 'MANAGER');

// Get staff's in-progress and pending tickets
$r1 = get_tickets(['status' => 'IN_PROGRESS']);
$r2 = get_tickets(['status' => 'PENDING']);
$tickets = array_merge(
    (!$r1['error'] && isset($r1['data'])) ? $r1['data'] : [],
    (!$r2['error'] && isset($r2['data'])) ? $r2['data'] : []
);

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
                        <p>Tidak ada tiket dalam antrian.</p>
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
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; foreach ($tickets as $t): ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><?= htmlspecialchars($t['code'] ?? '-') ?></td>
                                <td><?= htmlspecialchars($t['user']['name'] ?? '-') ?></td>
                                <td><?= format_tanggal($t['created_at'] ?? '') ?></td>
                                <td><?= htmlspecialchars(potong_teks($t['description'] ?? '', 80)) ?></td>
                                <td><?= htmlspecialchars($t['category']['name'] ?? '-') ?></td>
                                <td>
                                    <?php
                                    $st = $t['status'] ?? '';
                                    if ($st === 'IN_PROGRESS') echo '<span class="badge bg-primary">Diproses</span>';
                                    elseif ($st === 'PENDING') echo '<span class="badge bg-warning">Tertunda</span>';
                                    ?>
                                </td>
                                <td>
                                    <a href="chat.php?id=<?= htmlspecialchars($t['id']) ?>" class="btn btn-danger btn-sm">Buka Chat</a>
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
