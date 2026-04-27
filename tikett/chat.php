<?php
include "header.php";
?>
<div id="layoutSidenav_content">
  <main>

    <div class="container-fluid px-4">

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
                  <tr class="text-center align-middle">
                    <td>1</td>
                    <td>#tkt00001</td>
                    <td class="text-start">Rahmat</td>
                    <td>Administrasi</td>
                    <td>24/04/2026</td>
                    <td class="text-start">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Eveniet autem provident similique consequuntur explicabo facere et ipsa quidem, quae repellat neque expedita! Alias necessitatibus possimus aliquid vitae deserunt amet, quasi totam! Numquam similique qui tempore aspernatur dolore, accusantium exercitationem inventore nihil fuga nulla, reiciendis tempora reprehenderit velit vero nisi suscipit.</td>
                    <td>
                      <a href="#" class="btn btn-warning" target="_blank"><i class="fas fa-file-image"></i></a>
                    </td>
                    <td>
                      <a href="#" id="btnSelesai" class="btn btn-success" style="font-size: 15px;">Selesai</a>
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>
        </div>
      </div>

      <!-- Chat -->
      <div class="container-fluid pb-5">

        <div class="row">

          <div class="col">

            <div class="card shadow p-3 mb-5 bg-body rounded">
              <div class="card-body">

                <div class="pt-3 pe-3 chat-box">

                  <div class="d-flex flex-row justify-content-start">
                    <div>
                      <p class="small ms-3 mb-3 rounded-3 text-muted">#Nama User# | #No Tiket#</p>
                      <p class="small p-2 ms-3 mb-1 rounded-3 bg-light">Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus necessitatibus quaerat ipsa esse. Ipsa alias facere dicta a veniam molestiae architecto corporis consectetur, beatae nulla suscipit laboriosam explicabo. Repellendus voluptatem tempora quasi consectetur adipisci dolorem qui nisi voluptates eaque! Facilis quo incidunt voluptates quam consequuntur inventore facere distinctio possimus perferendis. Beatae culpa deserunt nemo cum dolore officiis sint illum unde. Ex dolores dolorum quisquam adipisci, consectetur id veniam vero aut explicabo. Ab aliquid quia ipsam necessitatibus amet, facilis tempora expedita facere, nulla animi placeat aliquam est nostrum sed excepturi asperiores repellendus sequi dolor harum quidem at! Tenetur fugit hic nesciunt?</p>
                      <p class="small ms-3 mb-3 rounded-3 text-muted float-end">10:00 | 24 Apr 26</p>
                    </div>
                  </div>

                  <div class="d-flex flex-row justify-content-end">
                    <div>
                      <p class="small me-3 mb-3 rounded-3 text-muted text-end">#Nama Support#</p>
                      <p class="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                      <p class="small me-3 mb-3 rounded-3 text-muted">10:05 | 24 Apr 26</p>
                    </div>
                  </div>

                </div>

                <div class="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                  <input type="text" class="form-control form-control-lg" id="exampleFormControlInput2"
                    placeholder="Tulis Pesan">
                  <a class="ms-1 text-muted" href="#!"><i class="fas fa-paperclip"></i></a>
                  <a class="ms-3" href="#!"><i class="fas fa-paper-plane"></i></a>
                </div>

              </div>
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
    document.getElementById('btnSelesai').addEventListener('click', function(e) {
      e.preventDefault();
      Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah Permasalahan Sudah Terselesaikan?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Sudah Terselesaikan',
        cancelButtonText: 'Belum'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Berhasil!',
            text: 'Permasalahan telah diselesaikan',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            window.location.href = 'tiket-baru-support.php';
          });
        }
      });
    });
  </script>