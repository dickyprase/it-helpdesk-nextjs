<?php
include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">
            <div class="row">
                <div class="col-md-12 col-xl-4">

                    <div class="card shadow p-3 mb-4 bg-body rounded">

                        <div class="card-body text-center rounded" style="font-weight: bold; font-size: 30px; color: #fff; background-color: #8c57ff;">Form User Baru</div>

                        <hr>

                        <form>

                            <div class="mb-3">
                                <label for="#" class="form-label">Nama :</label>
                                <input type="text" class="form-control" name="nama">
                            </div>

                            <div class="mb-3">
                                <label for="#" class="form-label">Divisi :</label>
                                <input type="text" class="form-control" name="divisi">
                            </div>

                            <div class="mb-3">
                                <label for="#" class="form-label">Pilih Role :</label>
                                <select class="form-select" aria-label="Default select example">
                                    <option selected>Pilih Role</option>
                                    <option value="manager">Manager</option>
                                    <option value="support">Support</option>
                                    <option value="user">User</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="#" class="form-label">Password :</label>
                                <input type="password" class="form-control" name="password">
                            </div>

                            <div class="text-end">
                                <button type="submit" class="btn btn-success">Buat Akun</button>
                            </div>

                        </form>
                    </div>
                </div>
                <div class="col-md-12 col-xl-8">

                    <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                        <div class="card-header">
                            <i class="fas fa-user me-1"></i>
                            Akun User
                        </div>
                        <div class="card-body">
                            <table id="datatablesSimpleAkun">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>ID Akun</th>
                                        <th>Nama</th>
                                        <th>Divisi</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1</td>
                                        <td>#id0001</td>
                                        <td>Rahmat</td>
                                        <td>Administrasi</td>
                                        <td>
                                            <span class="badge-status active">Aktif</span>
                                        </td>
                                        <td>
                                            <!-- Button trigger modal -->
                                            <button type="button" class="btn btn-success" style="font-size: 15px;" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                                Ubah
                                            </button>

                                            <!-- Modal -->
                                            <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                <div class="modal-dialog modal-dialog-centered">
                                                    <div class="modal-content">
                                                        <div class="modal-header">
                                                            <h5 class="modal-title" id="staticBackdropLabel">Ubah Akun</h5>
                                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                        </div>
                                                        <form>
                                                            <div class="modal-body text-start">

                                                                <div class="mb-3">
                                                                    <label for="#" class="form-label">Nama :</label>
                                                                    <input type="text" class="form-control" name="nama">
                                                                </div>

                                                                <div class="mb-3">
                                                                    <label for="#" class="form-label">Divisi :</label>
                                                                    <input type="text" class="form-control" name="divisi">
                                                                </div>

                                                                <div class="mb-3">
                                                                    <label for="#" class="form-label">Pilih Role :</label>
                                                                    <select class="form-select" aria-label="Default select example">
                                                                        <option selected>Pilih Role</option>
                                                                        <option value="manager">Manager</option>
                                                                        <option value="support">Support</option>
                                                                        <option value="user">User</option>
                                                                    </select>
                                                                </div>

                                                                <div class="mb-3">
                                                                    <label for="#" class="form-label">Password :</label>
                                                                    <input type="password" class="form-control" name="password">
                                                                </div>

                                                            </div>
                                                            <div class="modal-footer">
                                                                <button type="button" class="btn btn-primary">Simpan Perubahan</button>
                                                                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Batal</button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>

                                            <a href="#" id="btnHapus" class="btn btn-danger" style="font-size: 15px;">Nonaktifkan</a>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>2</td>
                                        <td>#id0002</td>
                                        <td>Septian</td>
                                        <td>Support</td>
                                        <td>
                                            <span class="badge-status non-active">Non Aktif</span>
                                        </td>
                                        <td>
                                            <a href="#" class="btn btn-success" style="font-size: 15px;">Ubah</a>
                                            <a href="#" id="btnAktif" class="btn btn-warning" style="font-size: 15px;">Aktifkan</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <?php
    include "footer.php";
    ?>

    <script>
        document.getElementById('btnAktif').addEventListener('click', function(e) {
            e.preventDefault();
            Swal.fire({
                title: 'Konfirmasi',
                text: 'Apakah Yakin Ingin AKTIFKAN Akun Ini?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya',
                cancelButtonText: 'Belum'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Aktifasi Akun Berhasil!',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'akun.php';
                    });
                }
            });
        });
    </script>

    <script>
        document.getElementById('btnHapus').addEventListener('click', function(e) {
            e.preventDefault();
            Swal.fire({
                title: 'Konfirmasi',
                text: 'Apakah Yakin Ingin MENONAKTIFKAN Akun Ini?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya',
                cancelButtonText: 'Belum'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Menonaktifkan Akun Berhasil!',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'akun.php';
                    });
                }
            });
        });
    </script>