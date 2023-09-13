$(async () => {
  const { days } = await chrome.storage.local.get(["days"]);

  createPlot(days["monday"]);
});

function getLexographicValue(str) {
  str = str.toLowerCase();

  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const value = str.charCodeAt(i) - "A".charCodeAt(0) + 1;
    total += value * Math.pow(26, str.length - i - 1);
  }

  return total;
}

function getColor(value) {
  const valueRange = [0, Number.MAX_SAFE_INTEGER];
  const rgbRange = [0, 255];

  const red = Math.floor(mapRange(value % 256, valueRange, rgbRange));
  const green = Math.floor(
    mapRange(Math.floor(value / 256) % 256, valueRange, rgbRange)
  );
  const blue = Math.floor(
    mapRange(Math.floor(value / Math.pow(256, 2)) % 256, valueRange, rgbRange)
  );

  console.log(red, green, blue);
}

function mapRange(value, [inMin, inMax], [outMin, outMax]) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}
