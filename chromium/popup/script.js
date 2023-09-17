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
  const jobTitles = shifts.map(({ jobTitle }) => jobTitle);
  const data = [
    {
      type: "bar",
      mode: "text",
      x: durations,
      base: startTimes,
      marker: {
        color: shiftColors.map((color) => color + "50"),
        line: {
          color: shiftColors,
          width: 2,
        },
      },
      text: shifts.map(({ name }) => `<b>${name}</b>`),
      hoverinfo: "text",
      hovertext: hoverText,
    },
  ];

  //let chartHeight = $("#chart").offsetHeight;
  let chartWidth = $("#chart").offsetWidth;

  // Set layout
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
      fixedrange: true,
    },
    yaxis: {
      title: "<b>Position</b>",
      type: "category",
      tickmode: "array",
      automargin: true,
      tickvals: shifts.map((_, i) => i),
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
  const r = Math.floor(map(val % 256, valRange, rgbRange) * RGB_MULT);
  const g = Math.floor(
    map(Math.floor(val / 256) % 256, valRange, rgbRange) * RGB_MULT
  );
  const b = Math.floor(
    map(Math.floor(val / 256 ** 2) % 256, valRange, rgbRange) * RGB_MULT
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

// Generate 30 minute intervals between two times
function generateIntervalRange(startTimeStr, endTimeStr) {
  // Parse the input time strings into Date objects with a common date (e.g., 1970-01-01)
  const commonDate = new Date();
  const startTime = new Date(`${commonDate.toDateString()} ${startTimeStr}`);
  const endTime = new Date(`${commonDate.toDateString()} ${endTimeStr}`);

  // Check if the input times are valid
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return [];
  }

  // Initialize an array to store the intervals
  const intervalRange = [];

  // Create intervals of 30 minutes until the end time is reached
  while (startTime < endTime) {
    intervalRange.push(new Date(startTime));
    startTime.setMinutes(startTime.getMinutes() + 30);
  }

  return intervalRange;
}

// Format a date as "HH:MM AM/PM"
function formatDate(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isAM = hours < 12;
  const hour = hours % 12 || 12;

  return `${hour}:${minutes.toString().padStart(2, "0")} ${isAM ? "AM" : "PM"}`;
}
