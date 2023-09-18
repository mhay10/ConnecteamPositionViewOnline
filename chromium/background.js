chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  
  // Popup handling
  if (sender.tab.url.match(/shiftscheduler/) != null) {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup/index.html"),
      focused: true,
      type: "popup",
      state: "maximized"
    });
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
