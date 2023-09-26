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
      chrome.windows.create({
        url: chrome.runtime.getURL("popup/index.html"),
        focused: true,
        type: "popup",
        state: "maximized"
      });
    }
  }

  // Options page will send message to reload the connecteam tab
  if (req.reloadTabs) {
    // Reload tabs that match Connecteam and Popup
    const urlPattern = /(^https:\/\/app\.connecteam\.com\/.*\/shiftscheduler\/)|(^chrome-extension:\/\/[a-z]+\/popup\/index\.html)/

    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (debugMode) console.log(tab);
        if (urlPattern.test(tab.url)) {
          if (debugMode) console.log(tab);
          chrome.tabs.reload(tab.id);
        }
      }
    });
  }

});
