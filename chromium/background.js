chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  if (sender.tab.url.match(/shiftscheduler/) != null) {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup/index.html"),
      focused: true,
      type: "popup",
      state: "maximized"
    });
  }
});
