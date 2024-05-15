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
Additional Development & Bugfixes: David Jones (wycre)
*/



/////////////////////////////
// Operational flags
//    Optional flags that modify script behavior
//    These are set by an options page
/////////////////////////////

// Get user set options
let debugMode; // not doing anything right now
let tabbedMode;

chrome.storage.sync.get(["debugModeSet", "tabbedModeSet"], function (result) {
  debugMode = result.debugModeSet;
  tabbedMode = result.tabbedModeSet;

  // Log settings
  console.log("[Connecteam Position View] debugMode set to:");
  console.log(debugMode);

  console.log("[Connecteam Position View] tabbedMode set to");
  console.log(tabbedMode);
});



// Ensure main injection only runs once.
let runTimes = 0;
const maxRuns = 1;

/**
 * This function handles timing of this plugins injection behavior.
 */
function actionTiming() {
  console.log("[Connecteam Position View] Watching DOM for schedules...");

  // Only run if document.url indicates shift scheduler:
  let url = document.URL;

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
    console.log("[Connecteam Position View] Scheduling page located {1}, waiting for element...");

    // start observer and wait
    observer.observe(document, { childList: true, subtree: true });
  }

  // Check url after page changes
  addEventListener("hashchange", function () {
    url = document.URL;

    if (url.match(/shiftscheduler/) != null) {
      console.log("[Connecteam Position View] Scheduling page located {2}, waiting for element...");
      runTimes = 0;

      // start observer and wait
      observer.observe(document, { childList: true, subtree: true });
    }
  });
}

/**
 * Updates DOM to expose main extension behavior
 */
async function inject() {
  if (runTimes < maxRuns) {
    runTimes++;

    console.log("[Connecteam Position View] Injecting...");

    // Add buttons
    const buttons = document.getElementsByClassName("buttons")[0];
    if (buttons) {
      console.log("[Connecteam Position View] Adding buttons...");

      // Add the button to get the shifts
      const shiftsButton = document.createElement("button");
      shiftsButton.innerHTML = "Position View";
      shiftsButton.classList = "connecteam-custom-btn";
      shiftsButton.onclick = createPositionView;

      // Add button to the page
      buttons.appendChild(shiftsButton);

      console.log("[Connecteam Position View] Buttons added");
    }
  }
}

/**
 * Obtains all shift data and renders position view
 */
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
  console.log("[Connecteam Position View] Opening schedule popup");
  chrome.storage.local.set({ days });
  chrome.runtime.sendMessage({popup: true});
}

/**
 * Obtains shifts from the Connecteam API
 * @returns Object containing Shift data, or nothing.
 */
async function getShifts() {
  // Get the date range
  const { startDate, endDate } = getDateRange();

  // Get Course ID and Object ID
  courseID = getCourseID();
  objectID = getObjectID();

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
        objectId: objectID,
        courseId: courseID,
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

/**
 * Obtains list of jobs and users from Connecteam API
 * @returns Object containing lists of jobs and users, or nothing.
 */
async function getJobsAndUsers() {
  
  // get Course ID and Object ID
  courseID = getCourseID();
  objectID = getObjectID();
  
  // Get jobs and users from api
  const res = await fetch(
    "https://app.connecteam.com/api/UserDashboard/ShiftScheduler/Data/?objectId="+objectID+"&courseId="+courseID,
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



/**
 * Converts date objects to the ISO string for the current time zone
 * @returns ISO string representation of this Date in the current time zone
 */
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


/**
 * Gets the Course ID for use in API requests
 * @returns Course ID if found, otherwise 0
 */
function getCourseID() {
  const path = document.URL.split('#')[1];

  const segments = path.split('/');

  return segments[3]

}

/**
 * Gets the Object ID for use in API requests
 * @returns Object ID if found, otherwise 0
 */
function getObjectID() {
  const path = document.URL.split('#')[1];

  const segments = path.split('/');

  return segments[5]
}

// Start injection wait
actionTiming();

