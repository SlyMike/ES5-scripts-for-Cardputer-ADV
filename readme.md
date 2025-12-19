

\# Bruce Firmware ES5 Scripts for Cardputer ADV



Welcome to the reference repository for ES5 JavaScript apps running on \*\*Bruce Firmware v1.12\*\* for the \*\*M5 Cardputer ADV (ESP32-S3)\*\*.



This repo provides:

\- \*\*Best Practices\*\* for writing Bruce-compatible ES5 scripts.

\- \*\*Hardware Configuration Notes\*\* for Cardputer ADV.

\- \*\*Interpreter Limitations\*\* to avoid common pitfalls.

\- \*\*Starter Scaffold\*\* for rapid app development.

\- \*\*Example Apps\*\* (Battery Monitor, Countdown Timer, GPIO Pulse Tester).



---



\## 📂 Documentation

\- \[GOOD\_CODING\_PRACTICE.md](GOOD\_CODING\_PRACTICE.md) – ES5 coding guidelines for Bruce.

\- \[HARDWARE\_CONFIGURATION.md](HARDWARE\_CONFIGURATION.md) – Display, GPIO, battery, and input details.

\- \[JS\_INTERPRETER\_LIMITATIONS.md](JS\_INTERPRETER\_LIMITATIONS.md) – Known quirks and constraints of Bruce’s JS interpreter.

\- \[CHEAT\_SHEET.txt](CHEAT\_SHEET.txt) – Quick reference for developers and coding agents.



---



\## ✅ Starter Scaffold

See `starter\_scaffold.js` for a minimal ES5 template:

\- Initialises display and keyboard.

\- Implements a polling main loop using `now()` + `delay(ms)`.

\- Includes safe exit handling and basic rendering.



---



\## 🔗 Useful Links

\- \[Bruce Firmware Repo](https://github.com/BruceDevices/firmware)

\- \[Working Examples](https://github.com/SlyMike/ES5-scripts-for-Cardputer-ADV)



---



\## ⚠ Important Notes

\- Bruce supports \*\*ES5 only\*\*. Avoid ES6+- Bruce supports \*\*ES5 only\*\*. Avoid ES6+ features.

\- Always check for \*\*balanced braces\*\* and \*\*duplicate functions\*\* before uploading.

\- Use `now()` + `delay(ms)` for timing; no timers.



