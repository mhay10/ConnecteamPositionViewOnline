// Run when page is done loading
document.addEventListener('DOMContentLoaded', function () {

    // Store the necessary elements on the form page
    const form = document.querySelector('form');
    const debugModeCheckbox = document.getElementById('DebugModeElem');
    const tabbedModeCheckbox = document.getElementById('TabbedModeElem');

    // Load the current setting from browser Storage and update the field state
    browser.storage.sync.get(['debugModeSet', 'tabbedModeSet'], function (result) {
        // Debugmode
        debugModeCheckbox.checked = result.debugModeSet;

        // Tabbed
        tabbedModeCheckbox.checked = result.tabbedModeSet;

    });


    // Handle saving settings
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Store the updated setting in browser Storage
        browser.storage.sync.set({
            debugModeSet: debugModeCheckbox.checked,
            tabbedModeSet: tabbedModeCheckbox.checked
        });


        // Tell the background script to reload the connecteam page
        browser.runtime.sendMessage({ reloadTabs: true });
        
        // Put new element on the page indicating the settings are saved
        topBar = document.getElementsByClassName("top-bar")[0];
        let saveText = document.createElement("p");
        saveText.innerText = "Settings Saved!";
        saveText.classList.add("save-message");
        topBar.prepend(saveText);
    });
});