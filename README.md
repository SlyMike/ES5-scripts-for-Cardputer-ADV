🧰 Cardputer ADV – Bruce JS Apps (ES5)
Welcome to the Cardputer ADV ES5 Scripts Repository!
This repo contains single-file ES5 JavaScript apps designed for the Bruce firmware v1.12 running on the M5 Cardputer ADV (ESP32-S3).

✅ About This Repo

All scripts are Bruce interpreter compatible.
Written in classic ES5 (no let, const, arrow functions, classes, promises).
Parse-safe: balanced braces, no duplicate or unterminated functions.
Driven by a polling main loop using now() + delay(ms) (no timers).
Optimised for ST7789 display with dirty rect updates and throttled redraws.


📂 Included Apps
1. Digital Clock App

Large, easy-to-read clock (HH:MM:SS).
Manual time setting with underline highlighting.
Colour customisation for text and background.
HUD showing battery percentage.
Efficient redraw (updates only when seconds change).
DigitalClockApp-LearningNotes.md


2. Camera Shutter Timer

Countdown timer for camera shutter control.
Safe GPIO pulsing (G1–G4 cycling).
Pulse width adjustment (200–3000 ms).
HUD shows mode, shots, GPIO pin, pulse duration.
Full-screen colour change during pulse (BLUE).
Ideal for photography workflows.


3. Hello World App

Minimal example for Bruce JS syntax.
Demonstrates text rendering and basic keyboard input.
Great starting point for new developers.


4. Battery Monitor

Displays battery percentage (and voltage if available).
Simple HUD layout.
Useful for power management testing.


5. Key Tester

Polls keyboard input and displays pressed keys.
Helps validate key mapping and input handling.


✅ Controls Summary (Digital Clock)

Key          Action
Q            Quit app gracefully
H            Toggle HUD visibility
E            Enter/exit edit mode
ArrowLeft    Move selection left
ArrowRight   Move selection right  
+ / -        Increment/decrement unit
Enter        Confirm time change
T            Cycle text colour
B            Cycle background colour

🔗 References

https://github.com/BruceDevices
https://github.com/SlyMike/ES5-scripts-for-Cardputer-ADV/tree/main


✅ Best Practices

Stick to ES5 syntax for Bruce interpreter stability.
Verify balanced braces and no stray code before running.
Use dirty rect rendering and throttle redraws for performance.
Poll keyboard input every loop; avoid timers.
Guard calls for optional APIs (device.getBatteryCharge(), device.getTime()).


🚀 Next Steps

Add date display and 12/24-hour toggle.
Implement brightness control (guard for missing API).
Persist user settings (colours, format) if storage API available.
Expand examples for GPIO automation, animations, and interactive menus.
