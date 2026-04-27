<?php
require_once 'function.php';
require_role('STAFF', 'MANAGER');

$ticket_id = $_GET['id'] ?? '';
if (!$ticket_id) { header('Location: tiket-antri-support.php'); exit; }

// Handle send message
$msg_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['send_message'])) {
        $message = trim($_POST['message'] ?? '');
        if ($message) {
            $result = send_chat_message($ticket_id, $message);
            if ($result['error']) $msg_error = $result['message'] ?? 'Gagal mengirim pesan';
        }
    }
    if (isset($_POST['resolve_ticket'])) {
        $note = trim($_POST['resolution_note'] ?? '');
        if ($note) {
            $result = resolve_ticket($ticket_id, $note);
            if (!$result['error']) {
                header('Location: tiket-selesai-support.php');
                exit;
            } else {
                $msg_error = $result['message'] ?? 'Gagal menyelesaikan tiket';
            }
        } else {
            $msg_error = 'Catatan penyelesaian wajib diisi';
        }
    }
}

// Fetch ticket detail + chat messages
$ticket_result = get_ticket($ticket_id);
$ticket = (!$ticket_result['error'] && isset($ticket_result['data'])) ? $ticket_result['data'] : null;
if (!$ticket) { header('Location: tiket-antri-support.php'); exit; }

$chat_result = get_chat_messages($ticket_id);
$messages = (!$chat_result['error'] && isset($chat_result['data'])) ? $chat_result['data'] : [];

$current_user = get_current_user_data();
$is_in_progress = ($ticket['status'] ?? '') === 'IN_PROGRESS';

include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <?php if ($msg_error): ?>
            <div class="alert alert-danger mt-3"><?= htmlspecialchars($msg_error) ?></div>
            <?php endif; ?>

            <!-- Ticket Detail Table -->
            <div class="card mb-4 shadow p-3 bg-body rounded mt-3">
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
                                    <th>Nama</th>
                                    <th>Kategori</th>
                                    <th>Tanggal</th>
                                    <th>Deskripsi Kendala</th>
                                    <th>Status</th>
                                    <?php if ($is_in_progress): ?>
                                    <th>Aksi</th>
                                    <?php endif; ?>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="text-center align-middle">
                                    <td><?= htmlspecialchars($ticket['code'] ?? '-') ?></td>
                                    <td class="text-start"><?= htmlspecialchars($ticket['user']['name'] ?? '-') ?></td>
                                    <td><?= htmlspecialchars($ticket['category']['name'] ?? '-') ?></td>
                                    <td><?= format_tanggal($ticket['created_at'] ?? '') ?></td>
                                    <td class="text-start"><?= htmlspecialchars($ticket['description'] ?? '-') ?></td>
                                    <td>
                                        <?php
                                        $st = $ticket['status'] ?? '';
                                        if ($st === 'IN_PROGRESS') echo '<span class="badge bg-primary">Diproses</span>';
                                        elseif ($st === 'PENDING') echo '<span class="badge bg-warning">Tertunda</span>';
                                        elseif ($st === 'RESOLVED') echo '<span class="badge bg-info">Selesai</span>';
                                        elseif ($st === 'CLOSED') echo '<span class="badge bg-secondary">Ditutup</span>';
                                        else echo '<span class="badge bg-success">Terbuka</span>';
                                        ?>
                                    </td>
                                    <?php if ($is_in_progress): ?>
                                    <td>
                                        <button class="btn btn-success" style="font-size: 15px;" data-bs-toggle="modal" data-bs-target="#resolveModal">Selesai</button>
                                    </td>
                                    <?php endif; ?>
                                </tr>
                            </tbody>
                        </table>
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
                                            <?php $is_own = ($msg['sender_id'] ?? '') === ($current_user['id'] ?? ''); ?>
                                            <div class="d-flex flex-row <?= $is_own ? 'justify-content-end' : 'justify-content-start' ?>">
                                                <div>
                                                    <p class="small <?= $is_own ? 'me-3 text-end' : 'ms-3' ?> mb-3 rounded-3 text-muted"><?= htmlspecialchars($msg['sender_name'] ?? '-') ?> (<?= htmlspecialchars($msg['sender_role'] ?? '-') ?>)</p>
                                                    <p class="small p-2 <?= $is_own ? 'me-3 text-white rounded-3 bg-primary' : 'ms-3 rounded-3 bg-light' ?> mb-1"><?= htmlspecialchars($msg['message'] ?? '') ?></p>
                                                    <p class="small <?= $is_own ? 'me-3' : 'ms-3 float-end' ?> mb-3 rounded-3 text-muted"><?= format_tanggal($msg['created_at'] ?? '') ?></p>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>

                                <!-- Send Message Form -->
                                <?php if (($ticket['status'] ?? '') !== 'CLOSED'): ?>
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

    <!-- Resolve Modal -->
    <?php if ($is_in_progress): ?>
    <div class="modal fade" id="resolveModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <form method="POST">
                    <div class="modal-header">
                        <h5 class="modal-title">Selesaikan Tiket</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Catatan Penyelesaian <span class="text-danger">*</span></label>
                            <textarea name="resolution_note" class="form-control" rows="4" required minlength="10" placeholder="Jelaskan solusi yang diberikan..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" name="resolve_ticket" value="1" class="btn btn-success">Selesaikan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php include "footer.php"; ?>
