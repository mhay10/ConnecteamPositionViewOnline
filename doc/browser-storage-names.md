# Browser Storage Variable Ref Sheet

## User settings & Options
### Within Browser Storage
**Rule:** `*ModeSet`
- `debugModeSet`
- `tabbedModeSet`
- `namedModeSet`

### `options.js` context
**Rule:** `*ModeCheckbox.checked`
- `debugModeCheckbox.checked`
- `tabbedModeCheckbox.checked`
- `namedModeCheckbox.checked`

### `options.html` context
**Rule:** `*ModeElem`
- `DebugModeElem`
- `TabbedModeElem`
- `NamedModeElem`

### `pageAction.js` context
**Rule:** `*Mode`
- `debugMode`
- `tabbedMode`
- `namedMode`

## Other Data
The browser storage will also contain an object called `"days"`. This object contains all days where shifts were captured, each day contains an array of shifts. `pageAction.js` collects the data from the Connecteam API and stores it. `popup/script.js` will retrieve the data and display it using plotly.js