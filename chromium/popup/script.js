$(() => {
  const plot = document.getElementById("plot");

  Plotly.newPlot(
    plot,
    [
      {
        x: [1, 2, 3, 4, 5],
        y: [1, 2, 4, 8, 16],
        type: "bar"
      },
    ],
    {
      margin: { t: 0 },
    }
  );
});
