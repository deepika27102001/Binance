let chart;
let socket;
let storedData = {};

function initializeChart() {
  const ctx = document.getElementById("candlestickChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "candlestick",
    data: {
      datasets: [
        {
          label: "Candlestick Data",
          data: [],
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "minute",
          },
        },
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}

function addDataToChart(klineData) {
  const newCandlestick = {
    x: new Date(klineData.t),
    o: parseFloat(klineData.o),
    h: parseFloat(klineData.h),
    l: parseFloat(klineData.l),
    c: parseFloat(klineData.c),
  };

  chart.data.datasets[0].data.push(newCandlestick);
  chart.update();
}

function connectToWebSocket(symbol, interval) {
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

  if (socket) {
    socket.close();
  }

  socket = new WebSocket(wsUrl);

  socket.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.e === "kline") {
      const klineData = message.k;

      addDataToChart(klineData);

      if (!storedData[symbol]) {
        storedData[symbol] = {};
      }
      if (!storedData[symbol][interval]) {
        storedData[symbol][interval] = [];
      }
      storedData[symbol][interval].push(klineData);
    }
  };

  socket.onclose = function () {
    console.log("WebSocket connection closed.");
  };
}

document.getElementById("symbol").addEventListener("change", function () {
  const selectedSymbol = this.value;
  const selectedInterval = document.getElementById("interval").value;

  chart.data.datasets[0].data = [];

  if (
    storedData[selectedSymbol] &&
    storedData[selectedSymbol][selectedInterval]
  ) {
    storedData[selectedSymbol][selectedInterval].forEach(addDataToChart);
  }

  connectToWebSocket(selectedSymbol, selectedInterval);
});

document.getElementById("interval").addEventListener("change", function () {
  const selectedSymbol = document.getElementById("symbol").value;
  const selectedInterval = this.value;

  chart.data.datasets[0].data = [];

  if (
    storedData[selectedSymbol] &&
    storedData[selectedSymbol][selectedInterval]
  ) {
    storedData[selectedSymbol][selectedInterval].forEach(addDataToChart);
  }

  connectToWebSocket(selectedSymbol, selectedInterval);
});

initializeChart();
connectToWebSocket("ethusdt", "1m");
