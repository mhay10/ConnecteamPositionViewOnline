/////////////////////////////
// Operational flags
//    Optional flags that modify script behavior
//    These are set by an options page
/////////////////////////////

// Get user set options
let debugMode; // not doing anything right now
let tabbedMode;


chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  
  // Get config settings
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
    // Reload tabs that match the specified URL pattern
    const urlPattern = /^https:\/\/app\.connecteam\.com\/.*\/shiftscheduler\//;

    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (urlPattern.test(tab.url)) {
          chrome.tabs.reload(tab.id);
        }
      }
    });
  }

});
