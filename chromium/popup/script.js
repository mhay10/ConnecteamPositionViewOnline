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

$(async () => {
  // Get days from local storage
  const { days } = await chrome.storage.local.get(["days"]);
  for (const day of Object.keys(days)) {
    const shifts = days[day];
    for (const shift of shifts) {
      shift.startTime = new Date(shift.startTime);
      shift.endTime = new Date(shift.endTime);
    }
  }

  // Create chart of selected day
  createPlot(days[currentDay]);
});

function createPlot(shifts) {
  // Sort shifts by job title
  shifts.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));

  // Get colors for each job
  const shiftColors = shifts.map(({ jobTitle }) =>
    getColor(getLexographicValue(jobTitle))
  );

  // Set chart data
  const durations = shifts.map(
    ({ startTime, endTime }) => endTime.getTime() - startTime.getTime()
  );
  const startTimes = shifts.map(({ startTime }) => startTime.getTime());
  const data = [
    {
      type: "bar",
      mode: "lines",
      x: durations,
      base: startTimes,
      marker: {
        color: shiftColors.map((color) => color + "50"),
        line: {
          color: shiftColors,
          width: 2,
        },
      },
    },
  ];

  // Set layout
  const now = new Date();
  const layout = {
    title: `<b>${titleCase(currentDay)} Schedule</b>`,
    xaxis: {
      title: "Time",
      type: "date",
      tickformat: "%I:%M %p",
      tickmode: "linear",
      dtick: 30 * 60 * 1000,
      minor: {
        tickmode: "linear",
        dtick: 15 * 60 * 1000,
        showgrid: true,
      },
    },
    yaxis: {
      title: "Position",
      type: "category",
      tickmode: "array",
      tickvals: shifts.map((_, i) => i),
      ticktext: shifts.map(({ jobTitle }) => jobTitle),
      showgrid: true,
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

function titleCase(str) {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

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
