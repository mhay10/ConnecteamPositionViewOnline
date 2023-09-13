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

// Check if the page is the correct one
const url = document.URL;
if (url.match(/shiftscheduler/) != null)
  observer.observe(document, { childList: true, subtree: true });

// Makes sure the script is injected only once
let injected = false;

async function inject() {
  console.log("Injecting");

  // Add the plotly.js script
  addScript("https://cdn.plot.ly/plotly-2.25.2.min.js", true);
  console.log("Added plotly.js");

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

    return {
      jobTitle: job.title,
      userName: `${user.firstname} ${user.lastname}`,
      startTime: new Date(startTime * 1000),
      endTime: new Date(endTime * 1000),
    };
  });

  console.log(assignedShifts);
}

// Function to add a script tag to the page
function addScript(url, external = false) {
  // Get extension url if internal
  if (!external) url = chrome.runtime.getURL(url);

  // Create and add script tag
  const script = document.createElement("script");
  script.src = url;
  const elem = (
    document.body ||
    document.head ||
    document.documentElement
  ).appendChild(script);

  // Return true if the script was added
  return !!elem;
}

async function getShifts() {
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
      body: '{"objectId":"3342741","courseId":"2881759","startDate":"2023-09-09T06:00:00.000Z","endDate":"2023-09-17T06:00:00.000Z","timezone":"America/Denver","_spirit":"84df7edd-eb90-4a38-9f25-5b6fe905be3e"}',
      method: "POST",
      credentials: "include",
    }
  );

  // Check if the response is ok
  if (!res.ok) {
    console.log("Error fetching shifts");
    return;
  } else console.log("Shifts fetched");

  // Return shifts
  const json = await res.json();
  const shifts = json.data.shifts;
  return shifts;
}

async function getJobsAndUsers() {
  // Get jobs and users from api
  const res = await fetch(
    "https://app.connecteam.com/api/UserDashboard/ShiftScheduler/Data/?objectId=3342741&courseId=2881759",
    {
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
      },
      referrer: "https://app.connecteam.com/index.html",
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );

  // Check if the response is ok
  if (!res.ok) {
    console.log("Error fetching job ids");
    return;
  } else console.log("Job ids fetched");

  // Return jobs and users
  const json = await res.json();
  const jobs = json.data.scheduler_user_data.jobs;
  const users = json.data.scheduler_user_data.users;
  return { jobs, users };
}
