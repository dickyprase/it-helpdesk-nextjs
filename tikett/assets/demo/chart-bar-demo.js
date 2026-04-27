// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

function getCurrentYearMonths() {
  const labels = [];
  const now = new Date();
  const year = now.getFullYear();

  for (let i = 0; i < 12; i++) {
    let d = new Date(year, i, 1);

    labels.push(
      d.toLocaleDateString('id-ID', {
        month: 'long',
        year: '2-digit'
      })
    );
  }

  return labels;
}

// Bar Chart Example
var ctx = document.getElementById("myBarChart");
var myLineChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: getCurrentYearMonths(),
    datasets: [{
      label: "Revenue",
      backgroundColor: "#8c57ff",
      borderColor: "#b08bff",
      data: [30, 55, 80, 10],
    }],
  },
  options: {
    scales: {
      xAxes: [{
        time: {
          unit: 'month'
        },
        gridLines: {
          display: false
        },
        ticks: {
          maxTicksLimit: 12
        }
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: 100,
          maxTicksLimit: 10
        },
        gridLines: {
          display: true
        }
      }],
    },
    legend: {
      display: false
    }
  }
});
