
# Good Coding Practice for Bruce Firmware ES5 Apps

## 1. Use ES5 Only
- `var` for variables; no `let` or `const`.
- Function declarations only; avoid arrow functions, classes, template strings.
- No modern constructs (Promises, async/await, for...of).

## 2. Structure
- Single file per app.
- Avoid nested block comments and top-level try/catch.
- Keep top-level code simple: init → main loop → exit.

## 3. Main Loop
- Use `now()` + `delay(ms)` for timing; no timers.
- Poll keyboard every loop; never starve input.
- Cap frame rate at ~22 FPS (≈45 ms delay); max 30 FPS.

## 4. Display Updates
- Prefer dirty rect updates; avoid full-screen clears except on init or mode transitions.
- Throttle redraws (e.g., countdown only updates when seconds change).
- Use two-phase rendering for animations: erase → update → draw.

## 5. Memory & Performance
- Reuse buffers and objects; avoid large closures.
- Minimise string churn in hot paths.
- Keep per-loop work short.

## 6. Input Handling
- `keyboard.getKeysPressed()` every loop.
- Support key variants: digits, arrows, symbols.
- Use `+` / `-` for increment/decrement; accept `=` / `_` as alternates.

## 7. GPIO Safety
- Pin LOW on init and exit.
- When cycling pins, set previous LOW before reinitialising.
- Never change pins mid-pulse; apply changes after pulse completes.

## 8. Exit Behaviour
- `Q` quits cleanly; leave last frame on screen.
- Ensure GPIO pins return to safe state.

## 9. QA Checklist Before## 9. QA Checklist Before Upload
- Balanced braces.
- No duplicate or unterminated functions.
- ES5 compliance.
