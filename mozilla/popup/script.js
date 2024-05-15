/////////////////////////////
// Operational flags
//    Optional flags that modify script behavior
//    These are set by an options page
/////////////////////////////

// Get user set options
let debugMode = true; // not doing anything right now
let tabbedMode;
let namedMode;


// New ISO function that converts all stored dates and times to local time zone
Date.prototype.toLocalISO = function () {
  const year = this.getFullYear();
  const month = String(this.getMonth() + 1).padStart(2, '0');
  const day = String(this.getDate()).padStart(2, '0');
  const hours = String(this.getHours()).padStart(2, '0');
  const minutes = String(this.getMinutes()).padStart(2, '0');
  const seconds = String(this.getSeconds()).padStart(2, '0');
  const milliseconds = String(this.getMilliseconds()).padStart(3, '0');
  const offsetMinutes = this.getTimezoneOffset();
  const offsetHours = Math.abs(offsetMinutes / 60);
  const offsetSign = offsetMinutes < 0 ? '+' : '-';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(Math.abs(offsetMinutes % 60)).padStart(2, '0')}`;
}

browser.storage.sync.get(["debugModeSet", "tabbedModeSet", 'namedModeSet'], function (result) {
  debugMode = result.debugModeSet;
  tabbedMode = result.tabbedModeSet;
  namedMode = result.namedModeSet;

  // Log settings
  console.log("debugMode set to:");
  console.log(debugMode);

  console.log("tabbedMode set to");
  console.log(tabbedMode);

  console.log("namedMode set to");
  console.log(namedMode);
  if (namedMode) {
    $("#swap").text("Jobs");
  }
  else {
    $("#swap").text("Names");
  }
});

// Date formatting
Date.prototype.toFormattedDate = function () {
  const year = this.getFullYear();
  const month = (this.getMonth() + 1).toString().padStart(2, "0");
  const day = this.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
};

Date.prototype.toFormattedTime = function () {
  const hours = this.getHours();
  const minutes = this.getMinutes().toString().padStart(2, "0");
  const isAM = hours < 12;
  const hour = hours % 12 || 12;

  return `${hour}:${minutes} ${isAM ? "AM" : "PM"}`;
};

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

let currentDay = new Date().toLocalISO().slice(0, 10);
let days = {};

let dateReference;

// Run once document is loaded
$(async () => {
  // Get days from local storage
  days = (await browser.storage.local.get(["days"])).days;
  for (const day of days.keys) {
    // Convert start and end times to Date objects

    const shifts = days[day];
    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      shift.startTime = new Date(shift.startTime);
      shift.endTime = new Date(shift.endTime);

      if (shift.startTime.toFormattedDate() !== day)
        incorrectShifts.push({ shift, day });
    }
  }

  console.log(days[currentDay]);


  $("#next").on("click", getNextDay);
  $("#back").on("click", getPrevDay);
  $("#download-chart").on("click", downloadPlot);
  $("#swap").on("click", swapRendering);

  // Create chart of selected day
  createPlot(days[currentDay]);
});

function swapRendering() {
  if (namedMode) {
    namedMode = false;
    $("#swap").text("Names");
  }
  else {
    namedMode = true;
    $("#swap").text("Jobs");
  }

  createPlot(days[currentDay]);
}

// Get next day
function getNextDay() {
  currentDay = days.keys[(days.keys.indexOf(currentDay) + 1) % days.keys.length];
  createPlot(days[currentDay]);
}

// Get previous day
function getPrevDay() {
  currentDay = days.keys[(days.keys.indexOf(currentDay) + days.keys.length - 1) % days.keys.length];
  createPlot(days[currentDay]);
}

function downloadPlot() {
  Plotly.downloadImage("chart", {
    filename: `${new Date(dateReference).toISOString().slice(0, 10)}-${dayNames[new Date(currentDay+'T00:00:00.000').getDay()]}-schedule`,
    format: "png",
  });
}

function sortShifts(shifts, reverse = false) {
  // Group shifts into position
  const groups = {};
  for (const shift of shifts) {
    let shiftGroup = shift.jobTitle.replace("Training - ", "").replace("Sr Tech - ", "");
    if (!groups[shiftGroup]) groups[shiftGroup] = [];

    groups[shiftGroup].push(shift);
  }

  // Sort shifts in each group
  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
  }

  // Convert grouped shifts into array
  const result = Object.values(groups).reduce((acc, cur) => acc.concat(...cur), []);

  // Move "Called Out" shifts to bottom
  const idxs = result
    .map((shift, i) => shift.jobTitle === "Called Out" ? i : null)
    .filter((idx) => idx != null)
    .reverse();
  for (const idx of idxs) {
    result.splice(result.length - 1, 0, result.splice(idx, 1)[0]);
  }

  // Reverse shifts if needed
  if (reverse) result.reverse();

  return result; 
}

function createPlot(shifts) {

  if (namedMode) {
    // Sort shifts by job title
    shifts.sort((a, b) => b.name.localeCompare(a.name));

    // Get colors for each job
    const shiftColors = shifts.map(({ color }) => {
      const hsv = HEXtoHSV(color);
      hsv[2] = 85;
      return HSVtoHEX(hsv[0], hsv[1], hsv[2]);
    });

    if (debugMode) {
      console.log("Colors:");
      console.log(shiftColors);
    }

    // Create hover popup text
    const hoverText = shifts.map(({ jobTitle, startTime, endTime }) => {
      return `<b>${jobTitle}</b><br>${startTime.toFormattedTime()} - ${endTime.toFormattedTime()}`;
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

    const nameVals = names.map((name) => names.indexOf(name));

    if (debugMode) {
      console.log("Numbers assigned to names:");
      console.log(nameVals);
    }

    let data = [];

    if (debugMode) {
      console.log("Names, shift names and shift-index:")
      console.log(names);
    }

    for (shift in shifts) {

      if (debugMode) {
        console.log(shifts[shift].name);
        console.log(shift);
      }
      data.push(
        {
          type: "bar",
          x: [durations[shift],],
          y: [nameVals[shift],],
          base: [startTimes[shift],],
          marker: {
            color: [shiftColors[shift] + 50,],
            line: {
              color: [shiftColors[shift],],
              width: 2,
            },
          },
          textposition: "inside",
          text: [`<b>${shifts[shift].jobTitle}</b>`,],
          insidetextanchor: "middle",
          insidetextfont: {
            size: 14,
            family: "Arial",
          },
          constraintext: "none",
          hoverinfo: "text",
          hovertext: [hoverText[shift],],
          orientation: 'h',
          offset: -0.4,
        });
    }

    if (debugMode) {
      console.log("All Data:")
      console.log(data);
    }
    dateReference = startTimes[0];

    // tabbedMode height adjustments
    let setHeight;
    if (tabbedMode) {
      setHeight = window.screen.availHeight * 0.825;
    } else {
      setHeight = window.screen.availHeight * 0.9;
    }

    // Set layout
    //let chartHeight = $("#chart").offsetHeight;
    let chartWidth = $("#chart").offsetWidth;
    const dayName = dayNames[getDate(currentDay).getDay()];
    const layout = {
      title: `<b>${titleCase(dayNames[new Date(currentDay+'T00:00:00.000').getDay()])} Schedule (${new Date(dateReference).toISOString().slice(0, 10)})</b>`,
      width: chartWidth, //window.screen.availWidth * 0.89,
      height: setHeight,
      showlegend: false,
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
        tickvals: nameVals,
        ticktext: names,
        showgrid: true,
        fixedrange: true,
      },
    };

    // Create chart
    Plotly.newPlot("chart", data, layout, { displayModeBar: false });
  }
  else
  {
    // Sort shifts by job title
    shifts = sortShifts(shifts, true);

    // Get colors for each job
    const shiftColors = shifts.map(({ color }) => {
      const hsv = HEXtoHSV(color);
      hsv[2] = 85;
      return HSVtoHEX(hsv[0], hsv[1], hsv[2]);
    });

    // Create hover popup text
    const hoverText = shifts.map(({ jobTitle, startTime, endTime }) => {
      return `<b>${jobTitle}</b><br>${startTime.toFormattedTime()} - ${endTime.toFormattedTime()}`;
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

    // tabbedMode height adjustments
    let setHeight;
    if (tabbedMode) {
      setHeight = window.screen.availHeight * 0.825;
    } else {
      setHeight = window.screen.availHeight * 0.9;
    }

    // Set layout
    //let chartHeight = $("#chart").offsetHeight;
    let chartWidth = $("#chart").offsetWidth;
    const dayName = dayNames[getDate(currentDay).getDay()];
    const layout = {
      title: `<b>${titleCase(dayNames[new Date(currentDay+'T00:00:00.000').getDay()])} Schedule (${new Date(dateReference).toISOString().slice(0, 10)})</b>`,
      width: chartWidth, //window.screen.availWidth * 0.89,
      height: setHeight,
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
}

// Convert hex to hsv
function HEXtoHSV(hexStr) {
  // Parse RGB vals
  const regex = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const matches = regex.exec(hexStr);

  // Create values for hsv conversion
  const r = parseInt(matches[1], 16) / 255;
  const g = parseInt(matches[2], 16) / 255;
  const b = parseInt(matches[3], 16) / 255;

  // Calculate HSV values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let v = max;

  // Saturation
  const diff = max - min;
  s = max == 0 ? 0 : diff / max;

  // Hue
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }

    h /= 6;
  }

  // Convert to integers
  h = Math.floor(h * 100);
  s = Math.floor(s * 100);
  v = Math.floor(v * 100);

  return [h, s, v];
}

// Convert hsv to hex
function HSVtoHEX(h, s, v) {
  // Convert range to 0-1
  h = h / 100;
  s = s / 100;
  v = v / 100;

  console.log(h, s, v);
  
  let r, g, b;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  r = Math.floor(r * 255);
  g = Math.floor(g * 255);
  b = Math.floor(b * 255);

  return "#" +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
}


// Capitalize the first letter of each word in a string
function titleCase(str) {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getDate(str) {
  const [year, month, day] = str.split("-");
  return new Date(year, month - 1, day);
}
