// Observer to inject the script when the page is loaded
const observer = new MutationObserver(async (mutList) => {
  for (const mut of mutList) {
    if (mut.type === "childList" && mut.addedNodes.length > 0) {
      const container = document.getElementsByClassName("buttons")[0];
      if (container && !injected) {
        inject();
        injected = true;
        observer.disconnect();
      }
    }
  }
});


// Get user set options
let debugMode; // not doing anything right now

chrome.storage.sync.get(['debugModeSet'], function (result) {
    debugMode = result.debugModeSet;

    // Log settings
    console.log("debugMode set to:");
    console.log(debugMode);
});



// Inject when job scheduler is opened
window.onhashchange = () => {
  const url = document.URL;
  if (url.match(/shiftscheduler/) != null)
    observer.observe(document, { childList: true, subtree: true });
};


// Check if the page is the correct one
const url = document.URL;
if (url.match(/shiftscheduler/) != null)
  observer.observe(document, { childList: true, subtree: true });

// Makes sure the script is injected only once
let injected = false;

async function inject() {
  console.log("Injecting");

  // Add buttons
  const buttons = document.getElementsByClassName("buttons")[0];
  if (buttons) {
    console.log("Adding buttons");

    // Add the button to get the shifts
    const shiftsButton = document.createElement("button");
    shiftsButton.innerHTML = "Get Shifts";
    shiftsButton.classList = "connecteam-custom-btn";
    shiftsButton.onclick = createPositionView;

    // Add button to the page
    buttons.appendChild(shiftsButton);

    console.log("Buttons added");
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
      startTime: new Date(startTime * 1000).toISOString(),
      endTime: new Date(endTime * 1000).toISOString(),
    };
  });

  // Sort shifts into days
  const days = {};
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
    // Get the day of the shift
    const day = dayNames[new Date(shift.startTime).getDay()];

    // Make array of shifts for the day if it doesn't exist
    if (!days[day]) days[day] = [];

    // Add shift to the day
    days[day].push(shift);
  }

  localStorage.setItem("days", JSON.stringify(days));
  openSchedulePopup(days);
}

function openSchedulePopup(days) {
  console.log("Opening schedule popup");
  chrome.storage.local.set({ days });
  chrome.runtime.sendMessage({});
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
  // Calculate last Sunday and next Sunday
  const today = new Date();
  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay() - 1
  );
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Return the dates
  return { startDate, endDate };
}
