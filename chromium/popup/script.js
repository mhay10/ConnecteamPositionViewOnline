// Keep track of which day is selected
const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
let currentDay = dayNames[new Date().getDay()];
let days = {};
let dateReference;

$(async () => {
  // Get days from local storage
  days = (await chrome.storage.local.get(["days"])).days;
  for (const day of Object.keys(days)) {
    // Convert start and end times to Date objects
    const shifts = days[day];
    for (const shift of shifts) {
      shift.startTime = new Date(shift.startTime);
      shift.endTime = new Date(shift.endTime);
    }
  }

  $("#next").on("click", getNextDay);
  $("#back").on("click", getPrevDay);
  $("#download-chart").on("click", downloadPlot);

  // Create chart of selected day
  createPlot(days[currentDay]);
});

// Get next day
function getNextDay() {
  currentDay = dayNames[(dayNames.indexOf(currentDay) + 1) % dayNames.length];
  createPlot(days[currentDay]);
}

// Get previous day
function getPrevDay() {
  currentDay =
    dayNames[
      (dayNames.indexOf(currentDay) + dayNames.length - 1) % dayNames.length
    ];
  createPlot(days[currentDay]);
}

function downloadPlot() {
  Plotly.downloadImage("chart", {
    filename: `${new Date(dateReference).toISOString().slice(0, 10)}-${currentDay}-schedule`,
    format: "png",
  });
}

function createPlot(shifts) {
  // Sort shifts by job title
  shifts.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));

  // Get colors for each job
  const shiftColors = shifts.map(({ jobTitle }) =>
    getColor(getLexographicValue(jobTitle))
  );

  // Create hover popup text
  const hoverText = shifts.map(({ name, jobTitle, startTime, endTime }) => {
    return `<b>${jobTitle}</b><br>${formatDate(startTime)} - ${formatDate(
      endTime
    )}`;
  });

  // Set chart data
  const durations = shifts.map(
    ({ startTime, endTime }) => endTime.getTime() - startTime.getTime()
  );
  const startTimes = shifts.map(({ startTime }) => startTime.getTime());
  const endTimes = shifts.map(({ endTime }) => endTime.getTime());
  const jobTitles = shifts.map(({ jobTitle }) => jobTitle);
  const names = shifts.map(({ name }) => {
    const split = name.split(" ");
    return `${split[0]} ${split[split.length - 1][0]}`;
  });
  const data = [
    {
      type: "bar",
      x: durations,
      base: startTimes,
      marker: {
        color: shiftColors.map((color) => color + "50"),
        line: {
          color: shiftColors,
          width: 2,
        },
      },
      textposition: "inside",
      text: names.map((name) => `<b>${name}</b>`),
      insidetextanchor: "middle",
      insidetextfont: {
        size: 14,
        family: "Arial",
      },
      constraintext: "none",
      hoverinfo: "text",
      hovertext: hoverText,
    },
  ];

  dateReference = startTimes[0];
  console.log(dateReference);

  // Set layout
  //let chartHeight = $("#chart").offsetHeight;
  let chartWidth = $("#chart").offsetWidth;
  const layout = {
    title: `<b>${titleCase(currentDay)} Schedule</b>`,
    width: chartWidth, //window.screen.availWidth * 0.89,
    height: window.screen.availHeight * 0.9,
    xaxis: {
      title: "<b>Time</b>",
      type: "date",
      tickformat: "%I:%M %p",
      tickangle: -50,
      tickmode: "linear",
      dtick: 30 * 60 * 1000,
      minor: {
        tickmode: "linear",
        dtick: 15 * 60 * 1000,
        showgrid: true,
      },
      autorange: false,
      // Set range to 15 minutes before first shift and 15 minutes after last shift
      range: [
        new Date(Math.min(...startTimes) - 25 * 60 * 1000),
        new Date(Math.max(...endTimes) + 25 * 60 * 1000),
      ],
      fixedrange: true,
    },
    yaxis: {
      title: "<b>Position</b>",
      type: "category",
      tickmode: "array",
      automargin: true,
      tickvals: jobTitles.map((_, i) => i),
      ticktext: jobTitles,
      showgrid: true,
      fixedrange: true,
    },
  };

  // Create chart
  Plotly.newPlot("chart", data, layout, { displayModeBar: false });
}

// Get ascii value of string
function getLexographicValue(s) {
  s = s.toLowerCase();

  let total = 0;
  for (let i = 0; i < s.length; i++) {
    let value = s.charCodeAt(i) - "A".charCodeAt(0) + 1;
    total += value * Math.pow(26, s.length - i - 1);
  }

  return total;
}

// RGB Value generator
const VAL_MAX = 1e25;
const RGB_MULT = VAL_MAX / 255;
function getColor(val) {
  // Range of values to map from
  const valRange = [0, VAL_MAX];
  const rgbRange = [0, 255];

  // Map value to RGB
  const r = Math.abs(Math.floor(map(val % 256, valRange, rgbRange) * RGB_MULT));
  const g = Math.abs(
    Math.floor(map(Math.floor(val / 256) % 256, valRange, rgbRange) * RGB_MULT)
  );
  const b = Math.abs(
    Math.floor(
      map(Math.floor(val / 256 ** 2) % 256, valRange, rgbRange) * RGB_MULT
    )
  );

  // Convert to hex
  const hex =
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0");
  return hex;
}

// Map a value from one range to another
function map(value, fromRange, toRange) {
  const [fromMin, fromMax] = fromRange;
  const [toMin, toMax] = toRange;

  return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}

// Capitalize the first letter of each word in a string
function titleCase(str) {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Format a date as "HH:MM AM/PM"
function formatDate(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isAM = hours < 12;
  const hour = hours % 12 || 12;

  return `${hour}:${minutes.toString().padStart(2, "0")} ${isAM ? "AM" : "PM"}`;
}
