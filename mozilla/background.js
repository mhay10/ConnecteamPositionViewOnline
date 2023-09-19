/////////////////////////////
// Operational flags
//    Optional flags that modify script behavior
//    These are set by an options page
/////////////////////////////

// Get user set options
let debugMode; // not doing anything right now
let tabbedMode;

browser.runtime.onMessage.addListener((req, sender, sendRes) => {

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
  if (sender.tab.url.match(/shiftscheduler/) != null) {
    if (tabbedMode) {
      browser.tabs.create({
        url: browser.runtime.getURL("popup/index.html"),
        index: 0,
      });
    }
    else {
      browser.windows.create({
        url: browser.runtime.getURL("popup/index.html"),
        type: "popup",
        width: window.screen.availWidth,
        height: window.screen.availHeight,
      });
    }
  }

  // Options page will send message to reload the connecteam tab
  if (req.reloadTabs) {
    // Reload tabs that match the specified URL pattern
    const urlPattern = /^https:\/\/app\.connecteam\.com\/.*\/shiftscheduler\//;

    browser.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (urlPattern.test(tab.url)) {
          browser.tabs.reload(tab.id);
        }
      }
    });
  }
});
