# Connecteam Position View

This is a web browser extension and python script designed to pull all shifts from a Connecteam schedule and create a pretty graph that is easy to read, respectively.
*********************
### How to use:

Installing the Extension:
  1. Merge the provided registry file
  2. Restart your intended browser
  3. Go to your browsers extension page and turn on developer mode
  4. Drag the relavent extension file (chromium.crx) onto the extension page
  5. Ensure that the extension is enabled

Usage:
  1. Open a connecteam shift scheduler page <br>
    a. Click "PV Today" in the top right to generate todays schedule <br>
    b. Click "PV Week" in the top right to generate the schedules for all the days of the week.
  3. Wait for the `shifts-day.csv` file(s) to download
  4. Drag each downloaded `csv` file over the provided `position_view.exe` file to convert the data to an image
    - If you would like, you can then download the image to save it elsewhere
