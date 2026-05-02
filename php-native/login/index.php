<?php
require_once '../config/function.php';

if (isLoggedIn()) {
    $role = getCurrentUserRole();
    if ($role === 'MANAGER') header('Location: ' . getBaseUrl() . 'page/dashboard/manager.php');
    elseif ($role === 'STAFF') header('Location: ' . getBaseUrl() . 'page/dashboard/');
    else header('Location: ' . getBaseUrl() . 'page/tiket/buat.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    if ($email && $password) {
        if (!checkRateLimit('login_' . $email)) {
            $error = 'Terlalu banyak percobaan. Coba lagi nanti.';
        } else {
            $result = login($email, $password);
            if ($result['status']) {
                $role = getCurrentUserRole();
                if ($role === 'MANAGER') header('Location: ' . getBaseUrl() . 'page/dashboard/manager.php');
                elseif ($role === 'STAFF') header('Location: ' . getBaseUrl() . 'page/dashboard/');
                else header('Location: ' . getBaseUrl() . 'page/tiket/buat.php');
                exit;
            } else {
                $error = $result['message'];
            }
        }
    } else {
        $error = 'Email dan password wajib diisi';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Login - IT Helpdesk</title>
    <link href="<?= getBaseUrl() ?>css/styles.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
</head>
<body>
    <div id="layoutAuthentication">
        <div id="layoutAuthentication_content">
            <main>
                <div class="container">
                    <div class="row justify-content-center" style="margin-top: 150px;">
                        <div class="col-lg-5">
                            <div class="card shadow-lg border-0 rounded-lg mt-5">
                                <div class="card-header"><h3 class="text-center font-weight-light my-4">Login</h3></div>
                                <div class="card-body">

                                    <?php if ($error): ?>
                                    <div class="alert alert-danger" role="alert">
                                        <?= htmlspecialchars($error) ?>
                                    </div>
                                    <?php endif; ?>

                                    <form method="POST" action="">
                                        <div class="form-floating mb-3">
                                            <input class="form-control" id="inputEmail" name="email" type="email" placeholder="name@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required />
                                            <label for="inputEmail">Email address</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <input class="form-control" id="inputPassword" name="password" type="password" placeholder="Password" required />
                                            <label for="inputPassword">Password</label>
                                        </div>
                                        <div class="d-flex align-items-center justify-content-center mt-4 mb-0">
                                            <button type="submit" class="btn btn-success px-4">Login</button>
                                        </div>
                                    </form>
                                </div>
                                <div class="card-footer text-center py-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="<?= getBaseUrl() ?>js/scripts.js"></script>
</body>
</html>
