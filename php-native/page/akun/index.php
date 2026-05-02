<?php
require_once '../../config/function.php';
requireRole('MANAGER');

$success = '';
$error = '';

// Handle create user
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_user'])) {
    $result = createUser(
        trim($_POST['nama'] ?? ''),
        trim($_POST['email'] ?? ''),
        trim($_POST['phone'] ?? ''),
        $_POST['password'] ?? '',
        $_POST['role'] ?? 'USER'
    );
    if ($result['status']) $success = $result['message'];
    else $error = $result['message'];
}

// Handle update user
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_user'])) {
    $result = updateUser(
        $_POST['user_id'],
        trim($_POST['edit_nama'] ?? ''),
        trim($_POST['edit_email'] ?? ''),
        trim($_POST['edit_phone'] ?? ''),
        $_POST['edit_role'] ?? 'USER'
    );
    if ($result['status']) $success = $result['message'];
    else $error = $result['message'];
}

// Handle toggle active
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_id'])) {
    $result = toggleUserActive($_POST['toggle_id']);
    if ($result['status']) $success = $result['message'];
    else $error = $result['message'];
}

$users = getUsers();

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

            <div class="row mt-4">
                <!-- Form Buat User Baru -->
                <div class="col-md-12 col-xl-4">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="card-body text-center rounded" style="font-weight: bold; font-size: 30px; color: #fff; background-color: #8c57ff;">Form User Baru</div>
                        <hr>
                        <form method="POST">
                            <div class="mb-3">
                                <label for="nama" class="form-label">Nama :</label>
                                <input type="text" class="form-control" name="nama" id="nama" required minlength="2">
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email :</label>
                                <input type="email" class="form-control" name="email" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="phone" class="form-label">No. HP (opsional) :</label>
                                <input type="text" class="form-control" name="phone" id="phone">
                            </div>
                            <div class="mb-3">
                                <label for="role" class="form-label">Pilih Role :</label>
                                <select class="form-select" name="role" id="role" required>
                                    <option value="USER">User</option>
                                    <option value="STAFF">Support</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password :</label>
                                <input type="password" class="form-control" name="password" id="password" required minlength="6">
                            </div>
                            <div class="text-end">
                                <button type="submit" name="create_user" value="1" class="btn btn-success">Buat Akun</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Daftar User -->
                <div class="col-md-12 col-xl-8">
                    <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                        <div class="card-header">
                            <i class="fas fa-user me-1"></i>
                            Akun User (<?= count($users) ?>)
                        </div>
                        <div class="card-body">
                            <table id="datatablesSimpleAkun">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php $no = 1; foreach ($users as $u): ?>
                                    <tr>
                                        <td><?= $no++ ?></td>
                                        <td><?= htmlspecialchars($u['name'] ?? '-') ?></td>
                                        <td><?= htmlspecialchars($u['email'] ?? '-') ?></td>
                                        <td><?= htmlspecialchars($u['role'] ?? '-') ?></td>
                                        <td>
                                            <?php if ($u['is_active'] ?? true): ?>
                                                <span class="badge bg-success">Aktif</span>
                                            <?php else: ?>
                                                <span class="badge bg-danger">Non Aktif</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <!-- Button trigger modal -->
                                            <button type="button" class="btn btn-success" style="font-size: 15px;" data-bs-toggle="modal" data-bs-target="#editModal<?= $no ?>">
                                                Ubah
                                            </button>

                                            <!-- Edit Modal -->
                                            <div class="modal fade" id="editModal<?= $no ?>" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
                                                <div class="modal-dialog modal-dialog-centered">
                                                    <div class="modal-content">
                                                        <div class="modal-header">
                                                            <h5 class="modal-title">Ubah Akun</h5>
                                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                                        </div>
                                                        <form method="POST">
                                                            <input type="hidden" name="user_id" value="<?= htmlspecialchars($u['id']) ?>">
                                                            <div class="modal-body text-start">
                                                                <div class="mb-3">
                                                                    <label class="form-label">Nama :</label>
                                                                    <input type="text" class="form-control" name="edit_nama" value="<?= htmlspecialchars($u['name'] ?? '') ?>" required>
                                                                </div>
                                                                <div class="mb-3">
                                                                    <label class="form-label">Email :</label>
                                                                    <input type="email" class="form-control" name="edit_email" value="<?= htmlspecialchars($u['email'] ?? '') ?>" required>
                                                                </div>
                                                                <div class="mb-3">
                                                                    <label class="form-label">No. HP :</label>
                                                                    <input type="text" class="form-control" name="edit_phone" value="<?= htmlspecialchars($u['phone'] ?? '') ?>">
                                                                </div>
                                                                <div class="mb-3">
                                                                    <label class="form-label">Pilih Role :</label>
                                                                    <select class="form-select" name="edit_role">
                                                                        <option value="USER" <?= ($u['role'] ?? '') === 'USER' ? 'selected' : '' ?>>User</option>
                                                                        <option value="STAFF" <?= ($u['role'] ?? '') === 'STAFF' ? 'selected' : '' ?>>Support</option>
                                                                        <option value="MANAGER" <?= ($u['role'] ?? '') === 'MANAGER' ? 'selected' : '' ?>>Manager</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div class="modal-footer">
                                                                <button type="submit" name="update_user" value="1" class="btn btn-primary">Simpan Perubahan</button>
                                                                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Batal</button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>

                                            <form method="POST" style="display:inline" onsubmit="return confirm('<?= ($u['is_active'] ?? true) ? 'Apakah Yakin Ingin MENONAKTIFKAN Akun Ini?' : 'Apakah Yakin Ingin AKTIFKAN Akun Ini?' ?>')">
                                                <input type="hidden" name="toggle_id" value="<?= htmlspecialchars($u['id']) ?>">
                                                <?php if ($u['is_active'] ?? true): ?>
                                                    <button type="submit" class="btn btn-danger" style="font-size: 15px;">Nonaktifkan</button>
                                                <?php else: ?>
                                                    <button type="submit" class="btn btn-warning" style="font-size: 15px;">Aktifkan</button>
                                                <?php endif; ?>
                                            </form>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <?php include '../../includes/footer.php'; ?>
