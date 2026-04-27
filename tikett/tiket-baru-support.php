<?php
include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-trophy me-1"></i>
                    Tiket Baru
                </div>
                <div class="card-body">
                    <table id="datatablesSimpleTicket">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>No Tiket</th>
                                <th>Nama</th>
                                <th>Divisi</th>
                                <th>Tanggal</th>
                                <th>Deskripsi Kendala</th>
                                <th>Bukti Kendala</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>#tkt00001</td>
                                <td>Rahmat</td>
                                <td>Administrasi</td>
                                <td>24/04/2026</td>
                                <td>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Eveniet autem provident similique consequuntur explicabo facere et ipsa quidem, quae repellat neque expedita! Alias necessitatibus possimus aliquid vitae deserunt amet, quasi totam! Numquam similique qui tempore aspernatur dolore, accusantium exercitationem inventore nihil fuga nulla, reiciendis tempora reprehenderit velit vero nisi suscipit.</td>
                                <td>
                                    <a href="#" class="btn btn-warning" target="_blank"><i class="fas fa-file-image"></i></a>
                                </td>
                                <td>
                                    <a href="#" id="btnAmbil" class="btn btn-success" style="font-size: 15px;">Ambil Tiket</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <?php
    include "footer.php";
    ?>

    <script>
        document.getElementById('btnAmbil').addEventListener('click', function(e) {
            e.preventDefault();

            Swal.fire({
                title: 'Ambil tiket?',
                // text: 'Pastikan data sudah benar',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, ambil!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'tiket-antri-support.php';
                }
            });
        });
    </script>