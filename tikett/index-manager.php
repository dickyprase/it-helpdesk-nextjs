<?php
include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-trophy me-1"></i>
                    Peringkat
                </div>
                <div class="card-body">
                    <table id="datatablesSimple">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Posisi</th>
                                <th>Status</th>
                                <th>Poin</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Rahmat</td>
                                <td>Support Programmer IT</td>
                                <td>
                                    <span class="badge-status active">Aktif</span>
                                </td>
                                <td>105</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Eko Septian</td>
                                <td>Support IT</td>
                                <td>
                                    <span class="badge-status active">Aktif</span>
                                </td>
                                <td>90</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Cahyo</td>
                                <td>Support IT</td>
                                <td>
                                    <span class="badge-status non-active">Tidak Aktif</span>
                                </td>
                                <td>55</td>
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