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
Original Solution: 	Max Hay (mhay10)
Extension & Other Days:	David Jones (aclamendo)
*/


/////////////////////////////
// Operation flags
//    Optional flags that modify script behavior
/////////////////////////////

// when true, useful console.log statements will be printed to assist in debugging
const debugMode = false;



/////////////////////////////
// This function ensures that the rest of the content script will only load when applicable
// Prevents the script from doing anything further if on the wrong connecteam page
// Prevents the script from doing anything further if the element where the buttons are placed has not loaded
/////////////////////////////
function actionTiming() {

	console.log("%c [Θ_Θ] Watching connecteam SPA for schedules...", "color:green;");

	// Only run if document.url indicates shift scheduler:
	var url = document.URL;
	console.log(url);

	// observer waits for the button placement element to fully load before running inject
	const observer = new MutationObserver(function(mutationsList) {
		for (let mutation of mutationsList) {
			if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {

				// Only continue of the destination div is present
				const container = document.getElementsByClassName("buttons")[0];
				if (container) {
					inject();
					observer.disconnect(); // stop the observer after success.
				}
			}
		}
	})

	// Check if page is valid immediately
	if (url.match(/shiftscheduler/) != null) {
		console.log("%c [Θ_Θ] Scheduling page located, waiting for element...", "color:green;");

		// start observer and wait
		observer.observe(document, { childList: true, subtree: true });
	}

	// Check url after page changes
	window.onhashchange = function() {
		url = document.URL;

		if (url.match(/shiftscheduler/) != null) {
			console.log("%c [Θ_Θ] Scheduling page located, waiting for element...", "color:green;");

			// start observer and wait
			observer.observe(document, { childList: true, subtree: true });
		}
	}
}



/////////////////////////////
// Primary behavior
/////////////////////////////

// For inject, must be global to prevent multiple runs
var runTimes = 0;
const maxRuns = 1;

// Primary functionality of script
function inject() {
	// Limit number of times this script can run

	if (runTimes < maxRuns) {
		runTimes++;

		console.log("%c [O_O] Element found! Placing the button...", "color:green;");

		// Make buttons
		makeDayButton();
		makeWeekButton();

		if (debugMode) {
			const compressBut = document.createElement("button");
			compressBut.innerHTML = "Compress Rows";
			compressBut.classList.add("ct-button");
			compressBut.addEventListener("click", compressRows);

			const uncompressBut = document.createElement("button");
			uncompressBut.innerHTML = "Uncompress Rows";
			uncompressBut.classList.add("ct-button");
			uncompressBut.addEventListener("click", uncompressRows);

			const todayBoxesBut = document.createElement("button");
			todayBoxesBut.innerHTML = "Reset Today Boxes";
			todayBoxesBut.classList.add("ct-button");
			todayBoxesBut.addEventListener("click", resetTodayBoxes);

			const debugNotifier = document.createElement("p");
			debugNotifier.style.marginBottom = 0;
			debugNotifier.innerHTML = "Debug Buttons:"
			const debugButtons = document.createElement("div");
			debugButtons.appendChild(debugNotifier);
			debugButtons.appendChild(compressBut);
			debugButtons.appendChild(uncompressBut);
			debugButtons.appendChild(todayBoxesBut);

			const container = document.getElementsByClassName("quick-actions")[0];
			container.appendChild(debugButtons);
		}
	}
}

// Handle creation of the day button
function makeDayButton() {
	// Add button and set trigger
	const button = document.createElement("button");
	button.innerHTML = "PV Today";
	button.classList.add("connecteam-custom-btn")
	button.addEventListener("click", async function(e) {

		// shrink all rows so they are all visible on the DOM at once
		compressRows();
		await sleep(1000);

		// Get day of week to name output file
		const dayOfWeek = getDayOfWeek();

		// Shifts
		console.log("%c [•_•] Getting todays shifts...", "color:green;");
		console.log("%c [-_-] This can take a while...", "color:yellow;");
		const shifts = await getShifts();

		// Positions
		console.log("%c [•_•] Getting positions...", "color:green;");
		const positions = getPositions(shifts);

		console.log("%c [ò_ó] My wait shall end shortly...", "color:red;");

		// Merge the two
		console.log("%c [•_•] Sorting positions...", "color:green;");
		const posShifts = await sortShifts(shifts, positions);

		// For now, export CSV
		console.log("%c [•_•] Exporting to CSV...", "color:green;");
		await exportCSVWeek(posShifts, dayOfWeek);

		// Fix all rows back to normal
		await sleep(1000);
		uncompressRows();

	});

	const container = document.getElementsByClassName("buttons")[0];
	container.appendChild(button);
}

// Handle creation of week button
function makeWeekButton() {
	// Add button and set trigger
	const buttonWeek = document.createElement("button");
	buttonWeek.innerHTML = "PV Week";
	buttonWeek.classList.add("connecteam-custom-btn")
	buttonWeek.addEventListener("click", async function(e) {


		// shrink all rows so they are all visible on the DOM at once
		compressRows();
		await sleep(1000);

		// Start the cycle for the current day
		var currentDay = 0;

		// Move todayBoxes to sunday
		resetTodayBoxes();
		await sleep(1000);

		for (currentDay; currentDay < 7; currentDay++) {

			// Shifts
			console.log("%c [•_•] Getting this weeks shifts...", "color:green;");
			console.log("%c [-_-] This can take a while...", "color:yellow;");
			const shifts = await getShifts();

			// Positions
			console.log("%c [•_•] Getting positions...", "color:green;");
			const positions = getPositions(shifts);

			console.log("%c [ò_ó] My wait shall end shortly...", "color:red;");

			// Merge the two
			console.log("%c [•_•] Sorting positions...", "color:green;");
			const posShifts = await sortShifts(shifts, positions);

			// For now, export CSV
			console.log("%c [•_•] Exporting to CSV...", "color:green;");
			await exportCSVWeek(posShifts, currentDay);

			// This will move the today boxes over to the left, and failing that create new ones on sunday
			moveTodayBoxes();
		}


		// Fix all rows back to normal
		await sleep(1000);
		uncompressRows();

	});

	const container = document.getElementsByClassName("buttons")[0];
	container.appendChild(buttonWeek);
}



/////////////////////////////
// All shift acquisition and exporting behavior
/////////////////////////////

// Create a CSV file with the provided positionShifts,
// Name the file based on provided positionShifts
function exportCSVWeek(positionShifts, dayOfWeek) {
	// Create CSV text
	var csvString = "";
	for (var [position, shifts] of Object.entries(positionShifts)) {
		for (var shift of shifts) {
			const user = shift.user.match(/^\w+ \w/)[0];
			const start = shift.start;
			const end = shift.end;

			var csvRow = [position, user, start, end];
			csvString += csvRow + "\n";
		}
	}

	// Basic weekday translation
	var weekday = new Array(7);
	weekday[0] = "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";

	// Download CSV
	saveData(csvString, "shifts-" + weekday[dayOfWeek] + ".csv");
}

// Download data
const saveData = (function() {
	// Create download container
	var dl = document.createElement("a");
	document.body.appendChild(dl);
	dl.style = "display:none;";

	return function(data, filename) {
		// Create blob and url
		const blob = new Blob([data], {
			type: "text/csv"
		});
		const url = window.URL.createObjectURL(blob);

		// Download blob
		dl.href = url;
		dl.download = filename;
		dl.click();
		window.URL.revokeObjectURL(url);
	};
})();

// Convert string time to js time
function parseTime(time) {

	// Parse hour and minutes from time
	const [hourString, minuteString] = time.split(":");
	var hours = parseInt(hourString);
	var minutes = minuteString ? parseInt(minuteString.slice(0, -1)) : 0;

	// Modify for AM or PM
	var isPM = time.includes("p");
	if (isPM && hours != 12) hours += 12;
	else if (!isPM && hours == 12) hours = 0;

	// Return as Date object
	// The day is irrelavent as this function only cares about hours and minutes, will show as Dec 31 1899
	const date = new Date(0, 0, 0, hours, minutes);
	return date;
}

// Make it pretty
async function sortShifts(allShifts, positions) {
	var positionShifts = {};
	for (var [user, shifts] of Object.entries(allShifts)) {
		for (var shift of shifts) {
			// Get position
			const position = positions.find(function(p) {
				return shift.innerText.includes(p);
			});

			// Get start and end times
			const timeDuration = shift.innerText.slice(
				0,
				shift.innerText.indexOf(position)
			);
			var [startTime, endTime] = timeDuration.split(" - ");
			startTime = parseTime(startTime);
			endTime = parseTime(endTime);

			// Add result
			positionShifts[position] = !positionShifts[position] ? [] :
				positionShifts[position];
			positionShifts[position].push({
				user: user,
				start: startTime,
				end: endTime,
			});
		}
	}

	return positionShifts;
}

// Obtain position names from collected shifts
function getPositions(allShifts) {
	const positions = new Set();
	for (var [name, shifts] of Object.entries(allShifts)) {
		shifts.forEach(function(shift) {
			if (debugMode) console.log(shift.innerHTML)
			// Pull shiftname from innerHTML (monster of a regex, may fail depending on how shifts are named, and any changes to the SPA)
			const posName = shift.innerHTML.match(/<div class="tippy-child-container"><div style="overflow: hidden; overflow-wrap: break-word; text-overflow: ellipsis; white-space: nowrap; word-break: break-all;">([-_ a-zA-Z0-9\/!"#$%&'\(\)\*\+`\-\.:;\?@\[\]\\^\{\}\|~]+)<\/div>/)[1];
			if (debugMode) console.log(posName)
			positions.add(posName);
		});
	}

	return [...positions];
}

// Handles acquisition of shifts from the DOM
async function getShifts(e) {
	// Get days of week
	const daysContainer = document.querySelector("div.week-view-calendar-header");
	const days = daysContainer.getElementsByClassName("user-day-header-text");

	// Get number of users
	const res = await (
		await fetch("https://app.connecteam.com/api/UserDashboard/Chat/Users/", {
			referrer: "https://app.connecteam.com/index.html",
			referrerPolicy: "strict-origin-when-cross-origin",
			body: null,
			method: "GET",
			mode: "cors",
			credentials: "include",
		})
	).json();
	const users = res.data.users;

	// Get start of grid
	const gridContainer = document.querySelector("div.week-view-calendar-body");
	var grid = [...gridContainer.querySelectorAll("div[data-index]")].filter(
		function(elem) {
			return elem.innerText != "Open to claim";
		}
	);

	// Get rest of users
	// Limit iterations to prevent infinite looping when number
	// of workers in the current schedule does not match number of workers in the organization
	var maxIterations = 100;
	var iterations = 0;
	while (grid.length != users.length && iterations < maxIterations) {
		// set up scrolling behavior
		const scrollContainer = document.querySelector(
			"div.shift-scheduler-user-instance"
		);
		const scrollHeight = grid.slice(-5).reduce(function(sum, elem) {
			return sum + elem.scrollHeight * 2;
		}, 0);

		// scroll and wait for elements to load
		//scrollContainer.scrollBy(0, scrollHeight);
		await sleep(100);

		// Get the new elements that have loaded
		const subgrid = [...gridContainer.querySelectorAll("div[data-index]")];
		subgrid.forEach(function(elem) {
			if (!grid.includes(elem) && elem.innerText != "Open to claim") {
				grid.push(elem);
			}
		});
		iterations += 1;
	}

	// Return only ones for current day, prevents data cluttering
	var shifts = {};
	grid.forEach(function(row) {
		const name = row.firstChild.querySelector("div.multi-user-row-header")
			.lastChild.innerText;

		if(debugMode) console.log("in getShifts:\n");
		if(debugMode) console.log(row.firstChild.querySelectorAll("div.today-box"));
		const times = [
			...row.firstChild
				.querySelector("div.today-box")
				.querySelectorAll("div.week-shift"),
		];
		shifts[name] = times;
	});
	if (debugMode) console.log(shifts)


	// Obtains all shifts for the current page
	var allShifts = {};

	// Loop over each row
	grid.forEach(function(row) {

		// Get the worker's name
		const name = row.firstChild.querySelector("div.multi-user-row-header").lastChild.innerText;

		// Get all days associated with that worker
		const days = [...row.children, ];

		// Loop over each day
		days.forEach(function(day) {

			item = day.querySelectorAll("div.multi-user-calendar-cell");
			allShifts[name] = [item, ];
		});



	});
	if (debugMode) console.log(allShifts);
	return shifts;
}

// Compress all the rows in the schedule so they all fit on the screen at once
async function compressRows() {

	// modify all visible elements to make them smaller
	function modRows() {
		// Get all the rows from their class
		const elements = document.querySelectorAll('.week-view-calendar-row');
		elements.forEach(function (element) {
			// add style atttribute to shrink the rows
			element.style.height = '1px';
		});
	}

	// Use a mutation observer because the new rows only get added to the DOM when the rows above are shrunk
	const observer = new MutationObserver(function (mutationsList, observer) {
		// Call the modifyElements function whenever a mutation occurs
		modRows();
	});

	// start the observer
	observer.observe(document.body, { subtree: true, childList: true });

	// Force the call to happen once to begin the mutation chain
	modRows();

	// Wait for compression, then stop observer
	await sleep(1000);
	observer.disconnect();

}

// Undoes the effect of compressRows
async function uncompressRows() {
	var elements = document.querySelectorAll('.week-view-calendar-row');
  	elements.forEach(function (element) {
		// Remove the height attribute to undo the change
		element.style.removeProperty('height');
  	});
}






/////////////////////////////
// All Week behavior functions
/////////////////////////////

// Finds all elements with class "today-box" and moves them over
function moveTodayBoxes() {
	// Gather all today-boxes
	const todayBoxes = document.querySelectorAll('.today-box');

	// Move all today-boxes to the right if found
	if (todayBoxes.length > 0) {
		todayBoxes.forEach(todayBox => {
			if (todayBox.nextElementSibling) {
				todayBox.classList.remove('today-box');
				todayBox.nextElementSibling.classList.add('today-box');
			}
		});
	}

	// Create new today-boxes on sunday if none are found (for future or past weeks)
	if (todayBoxes.length === 0) {
		const calendarRows = document.querySelectorAll('.week-view-calendar-row');

		calendarRows.forEach(calendarRow => {
			const multiUserCells = calendarRow.querySelectorAll('.multi-user-calendar-cell');
			const hasTodayBox = Array.from(multiUserCells).some(cell => cell.classList.contains('today-box'));

			if (!hasTodayBox && multiUserCells.length > 0) {
				multiUserCells[0].classList.add('today-box');
			}
		});
	}
}

// Moves all today-box divs to sunday
function resetTodayBoxes() {
	if (debugMode) console.log("Resetting Today Boxes to Sunday")
	// Gather all today-boxes
	const todayBoxes = document.querySelectorAll('.today-box');
	if (debugMode) console.log(todayBoxes)

	// Delete any found today-boxes
	if (todayBoxes.length > 0) {
		todayBoxes.forEach(todayBox => {
			todayBox.classList.remove('today-box');
			
		});
	}

	// Create all new today-boxes
	const calendarRows = document.querySelectorAll('.week-view-calendar-row');

	calendarRows.forEach(calendarRow => {
		const multiUserCells = calendarRow.querySelectorAll('.multi-user-calendar-cell');
		const hasTodayBox = Array.from(multiUserCells).some(cell => cell.classList.contains('today-box'));

		if (!hasTodayBox && multiUserCells.length > 0) {
			multiUserCells[0].classList.add('today-box');
		}
	});

	if (debugMode) {
		const newBoxes = document.querySelectorAll('.today-box');
		console.log(newBoxes);
	}

}

// Abstract obtaining the day of the week to provide better compatibilit with both mods
function getDayOfWeek() {
	// gather all today-boxes
	const todayBoxes = document.querySelectorAll('.today-box');

	// Return the current day if the displayed week is this week
	if (todayBoxes.length > 0) {
		return new Date().getDay();
	}

	// Return sunday if the displayed week is some past or future week
	else {
		return 0;
	}
}




/////////////////////////////
// Non-script specific helper functions
/////////////////////////////
function sleep(ms) {
	return new Promise(function (r) {
		return setTimeout(r, ms);
	});
}


// start the script
actionTiming();