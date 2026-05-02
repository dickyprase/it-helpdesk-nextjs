// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

function getCurrentMonthDates() {
  const labels = [];
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan

  // ambil jumlah hari dalam bulan ini
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    let d = new Date(year, month, i);

    labels.push(
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      })
    );
  }

  return labels;
}

// Area Chart Example
var ctx = document.getElementById("myAreaChart");
var myLineChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: getCurrentMonthDates(),
    datasets: [{
      label: "Sessions",
      lineTension: 0.3,
      backgroundColor: "#a47aff3f",
      borderColor: "#8c57ff",
      pointRadius: 5,
      pointBackgroundColor: "#4300d3",
      pointBorderColor: "rgba(255,255,255,0.8)",
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#bb9cff",
      pointHitRadius: 50,
      pointBorderWidth: 2,
      data: [1,5,3,1,5,8,4,0],
    }],
  },
  options: {
    scales: {
      xAxes: [{
        time: {
          unit: 'date'
        },
        gridLines: {
          display: false
        },
        ticks: {
          maxTicksLimit: 31
        }
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: 10,
          maxTicksLimit: 20
        },
        gridLines: {
          color: "rgba(0, 0, 0, .125)",
        }
      }],
    },
    legend: {
      display: false
    }
  }
});
