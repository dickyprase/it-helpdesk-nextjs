window.addEventListener('DOMContentLoaded', event => {
    // Simple-DataTables
    // https://github.com/fiduswriter/Simple-DataTables/wiki

    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        new simpleDatatables.DataTable(datatablesSimple);
    }

    const datatablesSimple2 = document.getElementById('datatablesSimpleTicket');
    if (datatablesSimple2) {
        new simpleDatatables.DataTable(datatablesSimple2);
    }
    
    const datatablesSimple3 = document.getElementById('datatablesSimpleAkun');
    if (datatablesSimple3) {
        new simpleDatatables.DataTable(datatablesSimple3);
    }
});
