<?php
require_once '../../config/function.php';
requireRole('USER');

$ticket_id = $_GET['id'] ?? '';
if (!$ticket_id) { header('Location: ' . getBaseUrl() . 'page/tiket/antrian.php'); exit; }

$msg_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['send_message'])) {
    $message = trim($_POST['message'] ?? '');
    if ($message) {
        $r = sendMessage($ticket_id, $message);
        if (!$r['status']) $msg_error = $r['message'];
    }
}

$ticket = getTicketById($ticket_id);
if (!$ticket) { header('Location: ' . getBaseUrl() . 'page/tiket/antrian.php'); exit; }

$messages = getChatMessages($ticket_id);
$current_user_id = getCurrentUserId();

include '../../includes/header.php';
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <?php if ($msg_error): ?>
            <div class="alert alert-danger mt-3"><?= htmlspecialchars($msg_error) ?></div>
            <?php endif; ?>

            <!-- Ticket Detail -->
            <div class="container-fluid">
                <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                    <div class="card-header text-center">
                        <i class="fas fa-tools me-1"></i>
                        Permasalahan
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered border-primary table-overflow" id="table-respon">
                                <thead>
                                    <tr class="text-center align-middle">
                                        <th>No Tiket</th>
                                        <th>Nama Support</th>
                                        <th>Kategori</th>
                                        <th>Tanggal</th>
                                        <th>Deskripsi Kendala</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="text-center align-middle">
                                        <td><?= htmlspecialchars($ticket['code'] ?? '-') ?></td>
                                        <td class="text-start"><?= htmlspecialchars($ticket['staff_name'] ?? 'Belum ada') ?></td>
                                        <td><?= htmlspecialchars($ticket['category_name'] ?? '-') ?></td>
                                        <td><?= formatTanggal($ticket['created_at'] ?? '') ?></td>
                                        <td class="text-start"><?= htmlspecialchars($ticket['description'] ?? '-') ?></td>
                                        <td>
                                            <?php
                                            $st = $ticket['status'] ?? '';
                                            if ($st === 'OPEN') echo '<span class="badge bg-success">Terbuka</span>';
                                            elseif ($st === 'IN_PROGRESS') echo '<span class="badge bg-primary">Diproses</span>';
                                            elseif ($st === 'PENDING') echo '<span class="badge bg-warning">Tertunda</span>';
                                            elseif ($st === 'RESOLVED') echo '<span class="badge bg-info">Selesai</span>';
                                            else echo '<span class="badge bg-secondary">Ditutup</span>';
                                            ?>
                                        </td>
                                        <td>
                                            <a href="<?= getBaseUrl() ?>page/tiket/antrian.php" class="btn btn-success" style="font-size: 15px;">Kembali</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat Messages -->
            <div class="container-fluid pb-5">
                <div class="row">
                    <div class="col">
                        <div class="card shadow p-3 mb-5 bg-body rounded">
                            <div class="card-body">
                                <div class="pt-3 pe-3 chat-box" id="chatBox" style="max-height:400px; overflow-y:auto;">
                                    <?php if (empty($messages)): ?>
                                    <p class="text-muted text-center">Belum ada pesan.</p>
                                    <?php else: ?>
                                        <?php foreach ($messages as $msg): ?>
                                            <?php $is_own = ($msg['sender_id'] ?? '') === $current_user_id; ?>
                                            <div class="d-flex flex-row <?= $is_own ? 'justify-content-end' : 'justify-content-start' ?>">
                                                <div>
                                                    <p class="small <?= $is_own ? 'me-3 text-end' : 'ms-3' ?> mb-3 rounded-3 text-muted"><?= htmlspecialchars($msg['sender_name'] ?? '-') ?> (<?= htmlspecialchars($msg['sender_role'] ?? '-') ?>)</p>
                                                    <p class="small p-2 <?= $is_own ? 'me-3 text-white rounded-3 bg-primary' : 'ms-3 rounded-3 bg-light' ?> mb-1"><?= htmlspecialchars($msg['message'] ?? '') ?></p>
                                                    <p class="small <?= $is_own ? 'me-3' : 'ms-3 float-end' ?> mb-3 rounded-3 text-muted"><?= formatTanggal($msg['created_at'] ?? '') ?></p>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>

                                <?php if (($ticket['status'] ?? '') !== 'CLOSED' && ($ticket['status'] ?? '') !== 'RESOLVED'): ?>
                                <div class="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                                    <form method="POST" class="d-flex w-100 gap-2">
                                        <input type="text" name="message" class="form-control form-control-lg" placeholder="Tulis Pesan" required autocomplete="off">
                                        <button type="submit" name="send_message" value="1" class="btn btn-primary ms-3"><i class="fas fa-paper-plane"></i></button>
                                    </form>
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <script>
    var ticketId = '<?= htmlspecialchars($ticket_id) ?>';
    var currentUserId = '<?= htmlspecialchars(getCurrentUserId()) ?>';
    function loadMessages() {
        fetch('<?= getBaseUrl() ?>page/chat/ajax_messages.php?id=' + ticketId)
            .then(r => r.json())
            .then(messages => {
                var box = document.getElementById('chatBox');
                var html = '';
                messages.forEach(function(msg) {
                    var isOwn = msg.sender_id === currentUserId;
                    html += '<div class="d-flex flex-row ' + (isOwn ? 'justify-content-end' : 'justify-content-start') + '">';
                    html += '<div>';
                    html += '<p class="small ' + (isOwn ? 'me-3 text-end' : 'ms-3') + ' mb-3 rounded-3 text-muted">' + msg.sender_name + ' (' + msg.sender_role + ')</p>';
                    html += '<p class="small p-2 ' + (isOwn ? 'me-3 text-white rounded-3 bg-primary' : 'ms-3 rounded-3 bg-light') + ' mb-1">' + msg.message + '</p>';
                    html += '<p class="small ' + (isOwn ? 'me-3' : 'ms-3 float-end') + ' mb-3 rounded-3 text-muted">' + (msg.created_at || '') + '</p>';
                    html += '</div></div>';
                });
                if (html) box.innerHTML = html;
                box.scrollTop = box.scrollHeight;
            })
            .catch(function() {});
    }
    setInterval(loadMessages, 3000);
    document.addEventListener('DOMContentLoaded', function() {
        var box = document.getElementById('chatBox');
        if (box) box.scrollTop = box.scrollHeight;
    });
    </script>

    <?php include '../../includes/footer.php'; ?>
