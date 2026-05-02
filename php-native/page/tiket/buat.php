<?php
require_once '../../config/function.php';
requireRole('USER');

$success = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $category_id = $_POST['category_id'] ?? '';

    if ($title && $description && $category_id) {
        $result = createTicket($title, $description, $category_id);
        if ($result['status']) $success = $result['message'];
        else $error = $result['message'];
    } else {
        $error = 'Semua field wajib diisi';
    }
}

$categories = getCategories();
include '../../includes/header.php';
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid">
            <div class="row mt-4 d-flex justify-content-center">
                <div class="col">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="card-body text-center rounded" style="font-weight: bold; font-size: 30px; color: #fff; background-color: #8c57ff;">Form Tiket Baru</div>
                        <hr>

                        <?php if ($success): ?>
                        <div class="alert alert-success"><?= htmlspecialchars($success) ?></div>
                        <?php endif; ?>

                        <?php if ($error): ?>
                        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
                        <?php endif; ?>

                        <form method="POST" action="">

                            <div class="mb-3">
                                <label for="title" class="form-label">Judul Kendala :</label>
                                <input type="text" class="form-control" name="title" id="title" placeholder="Contoh: Printer lantai 2 error" minlength="5" maxlength="200" required value="<?= htmlspecialchars($_POST['title'] ?? '') ?>">
                            </div>

                            <div class="mb-3">
                                <label for="category_id" class="form-label">Kategori :</label>
                                <select class="form-select" name="category_id" id="category_id" required>
                                    <option value="">-- Pilih Kategori --</option>
                                    <?php foreach ($categories as $cat): ?>
                                    <option value="<?= htmlspecialchars($cat['id']) ?>" <?= (isset($_POST['category_id']) && $_POST['category_id'] === $cat['id']) ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($cat['name']) ?>
                                    </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="form-floating mb-3">
                                <textarea class="form-control" id="description" name="description" style="height: 200px" minlength="10" maxlength="5000" required placeholder="Tulis kendala"><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
                                <label for="description">Tulis Kendala Disini</label>
                            </div>

                            <div class="text-end">
                                <button type="submit" class="btn btn-success">Kirim Kendala</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <?php include '../../includes/footer.php'; ?>
