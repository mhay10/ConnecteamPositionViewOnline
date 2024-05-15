/*
           ______   ______   .__   __. .__   __.  _______   ______ .___________. _______     ___      .___  ___.              
          /      | /  __  \  |  \ |  | |  \ |  | |   ____| /      ||           ||   ____|   /   \     |   \/   |              
         |  ,----'|  |  |  | |   \|  | |   \|  | |  |__   |  ,----'`---|  |----`|  |__     /  ^  \    |  \  /  |              
         |  |     |  |  |  | |  . `  | |  . `  | |   __|  |  |         |  |     |   __|   /  /_\  \   |  |\/|  |              
         |  `----.|  `--'  | |  |\   | |  |\   | |  |____ |  `----.    |  |     |  |____ /  _____  \  |  |  |  |              
          \______| \______/  |__| \__| |__| \__| |_______| \______|    |__|     |_______/__/     \__\ |__|  |__|              
                                                                                                                              
.______     ______        _______. __  .___________. __    ______   .__   __.    ____    ____  __   ___________    __    ____ 
|   _  \   /  __  \      /       ||  | |           ||  |  /  __  \  |  \ |  |    \   \  /   / |  | |   ____\   \  /  \  /   / 
|  |_)  | |  |  |  |    |   (----`|  | `---|  |----`|  | |  |  |  | |   \|  |     \   \/   /  |  | |  |__   \   \/    \/   /  
|   ___/  |  |  |  |     \   \    |  |     |  |     |  | |  |  |  | |  . `  |      \      /   |  | |   __|   \            /   
|  |      |  `--'  | .----)   |   |  |     |  |     |  | |  `--'  | |  |\   |       \    /    |  | |  |____   \    /\    /    
| _|       \______/  |_______/    |__|     |__|     |__|  \______/  |__| \__|        \__/     |__| |_______|   \__/  \__/     

This is the primary content script that handles the creation of shift data csv files.
Original Solution:  Max Hay (mhay10)
Extension & Other Days: David Jones (aclamendo)
*/

/////////////////////////////
// Operational flags
//    Optional flags that modify script behavior
//    These are set by an options page
/////////////////////////////

// Get user set options
let debugMode; // not doing anything right now
let tabbedMode;

browser.storage.sync.get(["debugModeSet", "tabbedModeSet"], function (result) {
  debugMode = result.debugModeSet;
  tabbedMode = result.tabbedModeSet;

  // Log settings
  console.log("debugMode set to:");
  console.log(debugMode);

  console.log("tabbedMode set to");
  console.log(tabbedMode);
});

/////////////////////////////
// This function ensures that the rest of the content script will only load when applicable
// Prevents the script from doing anything further if on the wrong connecteam page
// Prevents the script from doing anything further if the element where the buttons are placed has not loaded
/////////////////////////////
// Makes sure the script is injected only once
let runTimes = 0;
const maxRuns = 1;

function actionTiming() {
  console.log("Watching connecteam SPA for schedules...");

  // Only run if document.url indicates shift scheduler:
  let url = document.URL;
  console.log(url);

  // observer waits for the button placement element to fully load before running inject
  const observer = new MutationObserver(function (mutationsList) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Only continue of the destination div is present
        const container = document.getElementsByClassName("buttons")[0];
        if (container) {
          inject();
          observer.disconnect(); // stop the observer after success.
        }
      }
    }
  });

  // Check if page is valid immediately
  if (url.match(/shiftscheduler/) != null) {
    console.log("Scheduling page immediately located, waiting for element...");

    // start observer and wait
    observer.observe(document, { childList: true, subtree: true });
  }

  // Check url after page changes
  addEventListener("hashchange", function () {
    url = document.URL;

    if (url.match(/shiftscheduler/) != null) {
      console.log("Scheduling page located after load, waiting for element...");
      runTimes = 0;

      // start observer and wait
      observer.observe(document, { childList: true, subtree: true });
    }
  });
}

async function inject() {
  if (runTimes < maxRuns) {
    runTimes++;

    console.log("Injecting");

    // Add buttons
    const buttons = document.getElementsByClassName("buttons")[0];
    if (buttons) {
      console.log("Adding buttons");

      // Add the button to get the shifts
      const shiftsButton = document.createElement("button");
      shiftsButton.innerHTML = "Position View";
      shiftsButton.classList = "connecteam-custom-btn";
      shiftsButton.onclick = createPositionView;

      // Add button to the page
      buttons.appendChild(shiftsButton);

      console.log("Buttons added");
    }
  }
}

// Main function to create the position view
async function createPositionView() {
  // Get the shifts
  const shifts = await getShifts();
  const { jobs, users } = await getJobsAndUsers();

  // Assign shifts to users
  const assignedShifts = shifts.map((shift) => {
    // Get the shift info
    const { jobId, startTime, endTime } = shift;
    const userId = shift.assignedUserIds[0];

    // Get the job and user info
    const job = jobs.find((job) => job.id === jobId);
    const user = users.find((user) => user.id === userId);

    // Return job title, user's name, and start and end times
    return {
      jobTitle: job.title,
      name: `${user.firstname} ${user.lastname}`,
      color: job.color,
      startTime: new Date(startTime * 1000).toLocalISO(),
      endTime: new Date(endTime * 1000).toLocalISO(),
    };
  });

  // Sort shifts into days
  const days = {};
  days.keys = [];
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  for (const shift of assignedShifts) {

    // Get day of shift
    const day = new Date(shift.startTime).toLocalISO().slice(0, 10);

    // Ensure key for day exists
    if (!days[day]) {
      days[day] = [];
      days.keys.push(day);
    }

    // Add shift to that day
    days[day].push(shift);
  }

  days.keys.sort();
  if (debugMode) console.log(days);

  localStorage.setItem("days", JSON.stringify(days));

  openSchedulePopup(days);
}

function openSchedulePopup(days) {
  console.log("Opening schedule popup");
  browser.storage.local.set({ days });
  browser.runtime.sendMessage({popup: true});
}

async function getShifts() {
  // Get the date range
  const { startDate, endDate } = getDateRange();

  // Get shifts from api
  const res = await fetch(
    "https://app.connecteam.com/api/UserDashboard/ShiftScheduler/Shifts/",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
      },
      referrer: "https://app.connecteam.com/index.html",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: JSON.stringify({
        objectId: "3342741",
        courseId: "2881759",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone: "UTC",
        _spirit: getCookie("_spirit"),
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    }
  );

  // Check if the response is ok
  if (!res.ok) {
    alert("Error fetching shifts");
    return;
  }

  // Return shifts
  const json = await res.json();
  const shifts = json.data.shifts;
  console.log(`${shifts.length} shifts fetched`);

  return shifts;
}

async function getJobsAndUsers() {
  // Get jobs and users from api
  const res = await fetch(
    "https://app.connecteam.com/api/UserDashboard/ShiftScheduler/Data/?objectId=3342741&courseId=2881759",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
      },
      referrer: "https://app.connecteam.com/index.html",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );

  // Check if the response is ok
  if (!res.ok) {
    alert("Error fetching job ids");
    return;
  }

  // Return jobs and users
  const json = await res.json();
  const jobs = json.data.scheduler_user_data.jobs;
  const users = json.data.scheduler_user_data.users;
  console.log(`${jobs.length} jobs fetched`);
  console.log(`${users.length} users fetched`);

  return { jobs, users };
}

function getCookie(cname) {
  // Get cookie by name
  const name = cname + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split("; ");

  // Look through cookies until one with the correct name is found
  for (const cookie of cookies) {
    if (cookie.startsWith(name)) return cookie.split("=")[1];
  }

  // Return null if none is found
  return null;
}

function getDateRange() {
  // Calculate date range for the next 2 weeks
  const today = new Date();
  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay() - 7
  );

  const endDate = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000);

  // Return the dates
  return { startDate, endDate };
}


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

actionTiming();

