const observer = new MutationObserver(async (mutList) => {
  for (const mut of mutList) {
    if (mut.type === "childList" && mut.addedNodes.length > 0) {
      const container = document.getElementsByClassName("buttons")[0];
      if (container) {
        await inject();
        observer.disconnect();
      }
    }
  }
});

const url = document.URL;
if (url.includes("shiftscheduler"))
  observer.observe(document, { childList: true, subtree: true });

async function inject() {
  // const { Chart } = await import(chrome.runtime.getURL("./chart.umd.min.js"));
  addChartJS();

  const buttons = document.getElementsByClassName("buttons")[0];
  if (buttons) {
    const div = document.createElement("div");
    div.id = "plot";
    buttons.appendChild(div);

    const data = Array.from({ length: 7 }, (_, i) => ({
      year: 2010 + i,
      count: (i + 1) * 10,
    }));

    const chart = new Chart(document.getElementById("plot"), {
      type: "bar",
      data: {
        labels: data.map((d) => d.year),
        datasets: [
          {
            label: "Count",
            data: data.map((d) => d.count),
          },
        ],
      },
    });
  }
}

function addChartJS() {
  const script = `<script src=https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" content="script-src 'self' http://xxxx 'unsafe-inline' 'unsafe-eval';
"></script>  `;

  document.head.innerHTML += script;
}
