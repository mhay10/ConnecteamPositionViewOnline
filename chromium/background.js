// Handle zooming behavior
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "zoomOut") {
    // Get the current tab and adjust the zoom level
    chrome.tabs.get(sender.tab.id, function (tab) {
      console.log("Caught message from content script, zooming out");
      console.log("Tab ID: " + sender.tab.id);
      const newZoomFactor = 0.25; // Adjust this value as needed
      chrome.tabs.setZoom(sender.tab.id, message.scalar);
    });
  }
  else if (message.action === "zoomIn") {
    chrome.tabs.get(sender.tab.id, function (tab) {
      console.log("Caught message from content script, zooming in");
      console.log("Tab ID: " + sender.tab.id);
      const newZoomFactor = 1; // Adjust this value as needed
      chrome.tabs.setZoom(sender.tab.id, newZoomFactor);
    }); 
  }
});