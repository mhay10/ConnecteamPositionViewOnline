// Run when page is done loading
document.addEventListener('DOMContentLoaded', function () {

    // Store the necessary elements on the form page
    const form = document.querySelector('form');
    const debugModeCheckbox = document.getElementById('DebugModeElem');
    const tabbedModeCheckbox = document.getElementById('TabbedModeElem');
    const funyModeCheckbox = document.getElementById('FunyModeElem');
    const namedModeCheckbox = document.getElementById('NamedModeElem');

    // Load the current setting from Chrome Storage and update the field state
    chrome.storage.sync.get(['debugModeSet', 'tabbedModeSet', 'namedModeSet'], function (result) {
        // Debugmode
        debugModeCheckbox.checked = result.debugModeSet;

        // Tabbed
        tabbedModeCheckbox.checked = result.tabbedModeSet;

        // Named
        namedModeCheckbox.checked = result.namedModeSet;

    });


    // Handle saving settings
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Store the updated setting in Chrome Storage
        chrome.storage.sync.set({
            debugModeSet: debugModeCheckbox.checked,
            tabbedModeSet: tabbedModeCheckbox.checked,
            namedModeSet: namedModeCheckbox.checked,
        });


        if (funyModeCheckbox.checked) {
            document.body.setAttribute("style", "background-image: url(https://c.tenor.com/i-6ik9tSTk4AAAAC/fish-spin.gif);")
            let sound = new Audio("https://drive.google.com/uc?id=1Bw09LUjSOLB3CZtdpOBY5DpGfrP0an_U&export=download");
            sound.loop = true;
            document.body.appendChild(sound);
            sound.play();
        }

        // Tell the background script to reload the connecteam page
        chrome.runtime.sendMessage({ reloadTabs: true });
        
        // Put new element on the page indicating the settings are saved
        topBar = document.getElementsByClassName("top-bar")[0];
        let saveText = document.createElement("p");
        saveText.innerText = "Settings Saved!";
        saveText.classList.add("save-message");
        topBar.prepend(saveText);
    });
});