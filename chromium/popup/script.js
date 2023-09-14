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
  
  // Default selected day to today
  const currentSchedule = $("#current-schedule");
  currentSchedule.text("Viewing Schedule: " + titleCase(currentDay));
  
  // Create chart of selected day
  createPlot(days[currentDay]);
});

function createPlot(shifts) {
  // Sort shifts by job title
  shifts.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
  
  const chart = $("#chart")[0];
  Plotly.newPlot("chart", [{
    x: [1, 2, 3, 4, 5],
    y: [1, 2, 4, 6, 16]
  }, {margin: { t: 0 }}]);
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
  const r = map(val % 256, valRange, rgbRange);
  const g = map(Math.floor(val / 256) % 256, valRange, rgbRange);
  const b = map(Math.floor(val / 256 ** 2) % 256, valRange, rgbRange);

  // Make sure RGB values are big enough and integers
  return [r * RGB_MULT, g * RGB_MULT, b * RGB_MULT].map((v) => Math.floor(v));
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
