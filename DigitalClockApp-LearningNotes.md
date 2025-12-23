📚 Digital Clock App – Bruce JS (Cardputer ADV)
This document captures key learnings, tips, and best practices from building the interactive Digital Clock app for Bruce firmware v1.12 on the Cardputer ADV.

✅ Features Implemented

Large digital clock (HH:MM:SS) with size 3 digits, centred on screen.
Manual time setting:

E → Enter edit mode.
Arrow keys (< / >) → Move between units (HH, MM, SS).
+ / - → Adjust selected unit.
Enter → Confirm changes.
Esc or Q → Cancel edit mode.


Colour customisation:

T → Cycle text colour.
B → Cycle background colour.


HUD shows battery percentage.
Efficient redraw: updates only when seconds change (or during edit mode).
ES5-compliant, single file, parse-safe.


✅ Controls Summary

















































KeyActionQQuit app gracefullyHToggle HUD visibilityCToggle overlay (future use)EEnter/exit edit modeArrowLeftMove selection leftArrowRightMove selection right+ / -Increment/decrement unitEnterConfirm time changeTCycle text colourBCycle background colour

✅ Key Bruce/SlyMike Best Practices

ES5 Only:

Use var, function declarations.
Avoid let, const, arrow functions, classes, template strings.


Single File:

No external imports except require('<module>').


Parse Safety:

Balanced braces.
No duplicate or unterminated functions.
Avoid nested block comments.


Looping:

Use now() + delay(ms) for polling.
No timers (setTimeout, setInterval).
Cap at ~22 FPS (frameMs ≈ 45 ms).


Display:

Dirty rect updates.
Full screen clear only on init or mode transitions.
Throttle redraw (e.g., once per second for clock).


Keyboard:

Poll every loop.
Support variants: ArrowLeft, <, , etc.


UI:

Banner at top, HUD at bottom.
Large clock centred.
Underline selected unit in edit mode.


Power:

Battery info via device.getBatteryCharge().
Guard calls for missing APIs.




✅ Tips & Tricks

Text centring: Calculate width using charWidth = 6 * size.
Underline logic: Use display.drawFillRect() under selected digits.
Colour cycling: Predefine palettes for text and background.
RTC fallback: If device.getTime() is missing, simulate clock using now() + offset.
Apply time changes:

If device.setTime() exists, update RTC.
Else, adjust offsetMs for uptime-based clock.


Throttle redraw: Compare current second to lastSec before updating.


✅ Findings from This Session

Parse errors: Even a single stray line or missing brace breaks Bruce interpreter. Always audit before running.
Font scaling: display.setTextSize(n) works, but centring requires manual width calculation.
Performance: Redrawing only when seconds change avoids SPI overload and flicker.
UI clarity: Underline highlighting for edit mode is intuitive and matches SlyMike’s style.
Colour options: Simple palettes add flexibility without complexity.


✅ Next Steps / Ideas

Add date display (DD/MM/YYYY) above the clock.
Implement 12/24-hour toggle.
Add brightness control (guard for missing API).
Optional overlay splash with controls info on startup.
Persist user settings (colours, format) across sessions if storage API available.


🔗 References

https://github.com/BruceDevices
https://github.com/SlyMike/ES5-scripts-for-Cardputer-ADV/tree/main
