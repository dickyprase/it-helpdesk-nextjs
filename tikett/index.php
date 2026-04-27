<?php
include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">

            <div class="row">
                <div class="col-xl-6">
                    <div class="card shadow p-3 mb-1 bg-body rounded">
                        <div class="card-header">
                            <i class="fas fa-chart-area me-1"></i>
                            Progress Per Hari
                        </div>
                        <div class="card-body"><canvas id="myAreaChart" width="100%" height="40"></canvas></div>
                    </div>
                </div>
                <div class="col-xl-6">
                    <div class="card shadow p-3 mb-1 bg-body rounded">
                        <div class="card-header">
                            <i class="fas fa-chart-bar me-1"></i>
                            Progress Per Bulan
                        </div>
                        <div class="card-body"><canvas id="myBarChart" width="100%" height="40"></canvas></div>
                    </div>
                </div>
            </div>

            <div class="row mt-4" style="font-weight: bold; font-size: 20px; color: rgb(134, 134, 134);">

                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="row d-flex align-items-center mb-3">
                            <div class="col-8">
                                <div class="card-body">Tiket Baru</div>
                            </div>
                            <div class="col-4 text-end">
                                <div class="card-body" style="font-size: 30px; color: #8c57ff;">0</div>
                            </div>
                        </div>
                        <a class="btn" href="#" style="background-color: #8c57ff; color: white; text-decoration: none;">Selengkapnya</a>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="row d-flex align-items-center mb-3">
                            <div class="col-8">
                                <div class="card-body">Tiket Dalam Antrian</div>
                            </div>
                            <div class="col-4 text-end">
                                <div class="card-body" style="font-size: 30px; color: #8c57ff;">0</div>
                            </div>
                        </div>
                        <a class="btn" href="#" style="background-color: #8c57ff; color: white; text-decoration: none;">Selengkapnya</a>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="row d-flex align-items-center mb-3">
                            <div class="col-8">
                                <div class="card-body">Tiket Selesai</div>
                            </div>
                            <div class="col-4 text-end">
                                <div class="card-body" style="font-size: 30px; color: #8c57ff;">0</div>
                            </div>
                        </div>
                        <a class="btn" href="#" style="background-color: #8c57ff; color: white; text-decoration: none;">Selengkapnya</a>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card shadow p-3 mb-4 bg-body rounded" style="height: 165px;">
                        <div class="row d-flex justify-content-center align-items-center mb-3 text-center">
                            <!-- <div class="col-8"> -->
                            <div class="card-body">POIN KAMU</div>
                            <!-- </div> -->
                            <!-- <div class="col-4 text-end"> -->
                            <div style="font-size: 30px; color: #8c57ff;">0</div>
                            <!-- </div> -->
                        </div>
                    </div>
                </div>

            </div>

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