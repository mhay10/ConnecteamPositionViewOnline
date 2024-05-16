/////////////////////////////
// Operational flags
//    Optional flags that modify script behavior
//    These are set by an options page
/////////////////////////////

// Get user set options
let debugMode; // not doing anything right now
let tabbedMode;

// Get config settings outside of listener to ensure settings are stored before message is received
chrome.storage.sync.get(['debugModeSet', 'tabbedModeSet'], function (result) {
  debugMode = result.debugModeSet;
  tabbedMode = result.tabbedModeSet;

  // Log settings
  console.log("debugMode set to:");
  console.log(debugMode);

  console.log("tabbedMode set to");
  console.log(tabbedMode);
});


// Popup window parameters
let newWindowParameters;
let managedTabUrlPattern;

// Set default behavior based on Browser
// If the Browser is firefox, we want to ensure
try {
  if (chrome.runtime.getBrowserInfo()) {
    newWindowParameters = {
      url: chrome.runtime.getURL("popup/index.html"),
      focused: true,
      type: "popup",
      width: window.screen.availWidth,
      height: window.screen.availHeight
    };
    managedTabUrlPattern = /(^https:\/\/app\.connecteam\.com\/.*\/shiftscheduler\/)|(^moz-extension:)/;
  }
  else {
    newWindowParameters = {
      url: chrome.runtime.getURL("popup/index.html"),
      focused: true,
      type: "popup",
      state: "maximized",
    };
    managedTabUrlPattern = /(^https:\/\/app\.connecteam\.com\/.*\/shiftscheduler\/)|(^chrome-extension:)/;
  }
} catch { // Chromium does not have a Browser.runtime.getBrowserInfo
  newWindowParameters = {
    url: chrome.runtime.getURL("popup/index.html"),
    focused: true,
    type: "popup",
    state: "maximized",
  };
  managedTabUrlPattern = /(^https:\/\/app\.connecteam\.com\/.*\/shiftscheduler\/)|(^chrome-extension:)/;
}

// Listen for data changes
chrome.runtime.onMessage.addListener((req, sender, sendRes) => {

  // Get config settings inside listener to ensure changes are recorded
  chrome.storage.sync.get(['debugModeSet', 'tabbedModeSet'], function (result) {
    debugMode = result.debugModeSet;
    tabbedMode = result.tabbedModeSet;

    // Log settings
    console.log("debugMode set to:");
    console.log(debugMode);

    console.log("tabbedMode set to");
    console.log(tabbedMode);
  });


  // Popup handling
  if (req.popup) {

    if (tabbedMode) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("popup/index.html"),
        index: 0,
      });
    }
    else {
      chrome.windows.create(newWindowParameters);
    }
  }

  // Options page will send message to reload the relevant tabs
  if (req.reloadTabs) {
    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (debugMode) console.log(tab);
        if (managedTabUrlPattern.test(tab.url)) {
          if (debugMode) console.log(tab);
          chrome.tabs.reload(tab.id);
        }
      }
    });
  }

});


