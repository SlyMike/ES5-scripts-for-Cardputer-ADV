
# Cardputer ADV Hardware Configuration for Bruce Firmware

## Display
- ST7789 240x135 via SPI.
- Use `display.width()` and `display.height()` for dimensions.
- Colours via `display.color(r,g,b)`.
- Backlight control may vary; guard calls to `display.setBacklight()`.

## Keyboard
- Poll with `keyboard.getKeysPressed()`.
- Keys returned as strings: `"Q"`, `"ArrowLeft"`, `"Digit1"`, etc.
- Implement robust mapping for variants.

## GPIO
- `gpio.pinMode(pin,"output")` for shutter pins.
- `gpio.digitalWrite(pin,true/false)` for HIGH/LOW.
- Default shutter pins: G1..G4 (mapped to 1,2,3,4).
- Always initialise pins LOW and return LOW on exit.

## Battery
- `device.getBatteryCharge()` returns percentage.
- Voltage API (`device.getBatteryVoltage()`) may not exist; guard access.
- Approximate voltage: 3.6V = 0%, 4.2V = 100%.

## Audio
- Not guaranteed; exclude unless explicitly required.
- Guard calls to `audio.tone()` or `audio.beep()`.

## LED
- Internal RGB LED naming varies; avoid unless necessary.

## Timing
- Use `now()` for milliseconds since boot.
- `delay(ms)` for loop pacing; avoid timers.

## Frame Rate
- Recommended: ~22 FPS (≈45 ms delay- Recommended: ~22 FPS (≈45 ms delay).
