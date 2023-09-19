browser.runtime.onMessage.addListener((req, sender, sendRes) => {
  // Popup handling
  if (sender.tab.url.match(/shiftscheduler/) != null) {
    browser.windows.create({
      url: browser.runtime.getURL("popup/index.html"),
      type: "popup",
      width: window.screen.availWidth,
      height: window.screen.availHeight,
    });
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
