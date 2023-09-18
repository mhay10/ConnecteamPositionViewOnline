// Run when page is done loading
document.addEventListener('DOMContentLoaded', function () {

    // Store the necessary elements on the form page
    const form = document.querySelector('form');
    const debugModeCheckbox = document.getElementById('DebugModeElem');

    // Load the current setting from Chrome Storage and update the field state
    chrome.storage.sync.get(['debugModeSet'], function (result) {
        // Debugmode
        debugModeCheckbox.checked = result.debugModeSet;

    });


    // Handle saving settings
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Store the updated setting in Chrome Storage
        chrome.storage.sync.set({
            debugModeSet: debugModeCheckbox.checked,
        });

        // Tell the background script to reload the connecteam page
        chrome.runtime.sendMessage({ reloadTabs: true });
        
        // Put new element on the page indicating the settings are saved
        saveButton = document.getElementsByClassName("save-area")[0];
        let saveText = document.createElement("p");
        saveText.innerText = "Settings Saved!";
        saveButton.appendChild(saveText);
    });
});