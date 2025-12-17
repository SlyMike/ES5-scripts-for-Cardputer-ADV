
// Servo Tester on G2 (GPIO2) for Cardputer-Adv
// Bruce Interpreter (ES5 only)
//
// Controls:
//   M        -> Mode (Sweep → Centre → Live)
//   1..5     -> Presets (0°, 45°, 90°, 135°, 180°) — override, switch to Live
//   </>      -> Nudge −step / +step (ArrowLeft/ArrowRight also)
//   S        -> Toggle step size (1° → 5° → 10°)
//   P        -> Pause / Resume
//   C        -> Hold to view controls (release returns to tester UI)
//   Q        -> Quit (pull GPIO LOW; no post-loop drawing)
//
// Wiring:
//   Signal : G3  -> servo signal (yellow/white)
//   Ground : GND -> servo ground (brown/black)
//   Power  : 4.8–6V external supply (share ground with Cardputer)

var gpio     = require('gpio');
var display  = require('display');
var keyboard = require('keyboard');

// ---------- Screen & colors ----------
var W = display.width();
var H = display.height();
var BLACK  = display.color(0,0,0);
var WHITE  = display.color(255,255,255);
var YELLOW = display.color(255,255,0);
var GREEN  = display.color(0,200,0);
var GREY   = display.color(40,40,40);

// Layout
var HUD_H = 18;
var BAR_H = 14;
var BAR_Y = H - BAR_H - 3;
var BAR_X = 6;
var BAR_W = W - BAR_X*2;

// ---------- Servo timing ----------
var SERVO_PIN = 3;              // "G2" == GPIO2
var PERIOD_MS = 20;             // ~50Hz frame

function angleToMs(deg) {
  if (deg < 0) deg = 0;
  if (deg > 180) deg = 180;
  return 1 + (deg / 180);       // 0..180° → 1.0..2.0 ms
}

// Bresenham-style dither (choose 1ms or 2ms each frame to match fractional average)
function Dither() { this.frac = 0; this.acc = 0; }
Dither.prototype.setTargetMs = function(ms) {
  if (ms < 1) ms = 1;
  if (ms > 2) ms = 2;
  this.frac = ms - 1;           // 0..1
};
Dither.prototype.nextHighMs = function() {
  this.acc += this.frac;
  if (this.acc >= 1) { this.acc -= 1; return 2; }
  return 1;
};

// ---------- Modes ----------
var MODE_SWEEP  = 0;
var MODE_CENTRE = 1;
var MODE_LIVE   = 2;
var mode = MODE_SWEEP;

// Sweep: 2s per direction → ~100 frames → ~1.8°/frame
var sweepStepDeg = 1.8;
var sweepDir = +1;

// Position & dither
var currentDeg = 90;
var dither = new Dither();
dither.setTargetMs(angleToMs(currentDeg));

// Step sizes
var stepSizes = [1, 5, 10];
var stepIdx = 1; // start with 5°
function currentStep() { return stepSizes[stepIdx]; }

// ---------- Global run/UI state ----------
var paused = false;
var running = true;
var overlayActive = false;

// “C-hold grace” latch: keep overlay until C hasn’t been seen for this long
var cLastSeenTs = 0;
var C_HOLD_GRACE_MS = 2000;  // try 400ms; increase if you still see flicker

// ---------- Small helpers ----------
function fmt2(ms) { return Math.floor(ms * 100 + 0.5) / 100; }
function printAt(x, y, s) {
  if (typeof display.drawString === "function") {
    display.drawString(s, x, y);
  } else {
    if (typeof display.setCursor === "function") display.setCursor(x, y);
    display.print(s);
  }
}

// ---------- HUD ----------
function drawHUD() {
  display.drawFillRect(0, 0, W, HUD_H, BLACK);
  if (typeof display.setCursor === "function") display.setCursor(2, 2);
  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize === "function") display.setTextSize(1);

  var modeStr = (mode===MODE_SWEEP ? "Sweep" : (mode===MODE_CENTRE ? "Centre" : "Live"));
  display.print("M:"); display.print(modeStr);
  display.print("  A:"); display.print(currentDeg); display.print("d");
  display.print("  P:~"); display.print(fmt2(angleToMs(currentDeg))); display.print("ms");
  display.print("  S:"); display.print(currentStep()); display.print("d");
  if (paused) display.print("  [Paused]");
}

// ---------- Bar (throttled updates) ----------
var lastBarTs = 0;
var BAR_REFRESH_MS = 120;
var lastFillX = BAR_X;

function drawBarStatic() {
  display.drawFillRect(0, BAR_Y - 3, W, BAR_H + 6, BLACK);
  display.drawFillRect(BAR_X, BAR_Y, BAR_W, BAR_H, GREY);

  // Tick marks (1.0ms, 1.5ms, 2.0ms)
  var x1  = BAR_X;
  var x15 = BAR_X + Math.floor(0.5 * BAR_W);
  var x2  = BAR_X + BAR_W - 1;
  display.drawFillRect(x1,  BAR_Y, 1, BAR_H, WHITE);
  display.drawFillRect(x15, BAR_Y, 1, BAR_H, WHITE);
  display.drawFillRect(x2,  BAR_Y, 1, BAR_H, WHITE);
}

function barFillXForMs(ms) {
  if (ms < 1) ms = 1;
  if (ms > 2) ms = 2;
  var t = (ms - 1);
  var fillW = Math.floor(t * BAR_W);
  if (fillW < 1) fillW = 1;
  return BAR_X + fillW;
}

function drawBarIfDue(nowMs) {
  if ((nowMs - lastBarTs) < BAR_REFRESH_MS) return;

  var ms = angleToMs(currentDeg);
  var fillX = barFillXForMs(ms);

  if (fillX !== lastFillX) {
    var left  = (fillX < lastFillX ? fillX : lastFillX);
    var right = (fillX > lastFillX ? fillX : lastFillX);
    var eraseW = right - left;
    if (eraseW > 0) {
      display.drawFillRect(left, BAR_Y, eraseW, BAR_H, GREY);
    }
  }
  display.drawFillRect(BAR_X, BAR_Y, (fillX - BAR_X), BAR_H, GREEN);

  lastFillX = fillX;
  lastBarTs = nowMs;
}

// ---------- Presets ----------
function applyPresetIndex(idx) {
  var a = idx * 45; // 0..4 → 0°,45°,90°,135°,180°
  currentDeg = a;
  dither.setTargetMs(angleToMs(currentDeg));
  mode = MODE_LIVE;
  drawHUD();
}

// ---------- Splash screen ----------
function drawWarningTriangle(cx, cy, size, color) {
  // Reduced size for readability
  var half = Math.floor(size / 2);
  var x0 = cx,        y0 = cy - half;
  var x1 = cx - half, y1 = cy + half;
  var x2 = cx + half, y2 = cy + half;

  if (typeof display.drawLine === "function") {
    display.drawLine(x0, y0, x1, y1, color);
    display.drawLine(x1, y1, x2, y2, color);
    display.drawLine(x2, y2, x0, y0, color);
  } else {
    // Fallback: outline with thin rects
    display.drawFillRect(x0, y0, 1, y2 - y0, color);
    display.drawFillRect(x1, y1, x2 - x1, 1, color);
    display.drawFillRect(x0, y0, x2 - x0, 1, color);
  }

  // Exclamation mark
  var barW = 3, barH = Math.floor(size * 0.42);
  var barX = cx - Math.floor(barW / 2);
  var barY = cy - Math.floor(size * 0.18);
  display.drawFillRect(barX, barY, barW, barH, color);

  var dotR = 2;
  display.drawFillCircle(cx, cy + Math.floor(size * 0.20), dotR, color);
}

function splash() {
  display.drawFillRect(0, 0, W, H, BLACK);
  var triSize = 56; // smaller icon
  drawWarningTriangle(Math.floor(W / 2), Math.floor(H / 2) - 10, triSize, YELLOW);

  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize === "function") display.setTextSize(1);

  // Messages (left aligned to avoid wrapping)
  printAt(8, Math.floor(H / 2) + 18, "USE ONLY WHEN CONNECTED TO USB POWER!");
  printAt(8, Math.floor(H / 2) + 30, "USE AT YOUR OWN RISK!");
  printAt(8, Math.floor(H / 2) + 42, "Press any key to continue...");

  // Wait for any key or 3000ms
  var start = now();
  while (true) {
    var ks = keyboard.getKeysPressed();
    if (ks && ks.length > 0) break;
    if ((now() - start) > 3000) break;
    delay(20);
  }

  // Explicit black clear after warning
  display.drawFillRect(0, 0, W, H, BLACK);
}

// ---------- Controls overlay (press & hold C) ----------
var lastOverlayTs = 0;
var OVERLAY_REFRESH_MS = 250;

function drawControlsOverlay(force) {
  var t = now();
  if (!force && (t - lastOverlayTs) < OVERLAY_REFRESH_MS) return;

  // Full black before overlay to avoid artifacts
  display.drawFillRect(0, 0, W, H, BLACK);

  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize === "function") display.setTextSize(1);

  printAt(2, 2,  "Controls:");
  printAt(2, 16, "M: mode (Sw → Ce → Li)");
  printAt(2, 28, "1..5: presets (0,45,90,135,180 degrees)");
  printAt(2, 40, "< / > or Arrow ← / → : nudge ±step");
  printAt(2, 52, "S: step size (1 → 5 → 10 degrees)");
  printAt(2, 64, "P: pause / resume");
  printAt(2, 76, "C: hold to view this screen");
  printAt(2, 88, "Q: quit (G2 LOW)");

  lastOverlayTs = t;
}

// ---------- Keyboard ----------
function handleKeys() {
  var ks = keyboard.getKeysPressed();
  if (!ks) ks = [];

  var t = now();

  // Check “C” presence this frame; latch overlay for a grace window
  var cSeen = false;
  var i;
  for (i = 0; i < ks.length; i++) {
    var k0 = "" + ks[i];
    if (k0 === "C" || k0 === "c") { cSeen = true; break; }
  }

  if (cSeen) {
    cLastSeenTs = t;                 // update last-seen timestamp
    if (!overlayActive) {
      overlayActive = true;
      drawControlsOverlay(true);     // show overlay immediately
    } else {
      drawControlsOverlay(false);    // throttle overlay redraws
    }
    return; // ignore other inputs while overlay is visible
  }

  // If overlay is active but C not seen, keep overlay until grace expires
  if (overlayActive) {
    if ((t - cLastSeenTs) <= C_HOLD_GRACE_MS) {
      // still within grace window: keep overlay up
      drawControlsOverlay(false);
      return;
    }
    // grace expired: exit overlay and restore tester UI
    overlayActive = false;
    display.drawFillRect(0, 0, W, H, BLACK);
    drawHUD();
    drawBarStatic();
    lastBarTs = now();
  }

  if (ks.length === 0) return;

  // Process keys
  for (i = 0; i < ks.length; i++) {
    var k = "" + ks[i];

    if (k === "Q" || k === "q") { running = false; continue; }
    if (k === "P" || k === "p") { paused = !paused; drawHUD(); continue; }

    if (k === "M" || k === "m") {
      if (mode === MODE_SWEEP) mode = MODE_CENTRE;
      else if (mode === MODE_CENTRE) mode = MODE_LIVE;
      else mode = MODE_SWEEP;
      if (mode === MODE_CENTRE) { currentDeg = 90; dither.setTargetMs(angleToMs(currentDeg)); }
      drawHUD();
      continue;
    }

    if (k === "S" || k === "s") { stepIdx = (stepIdx + 1) % stepSizes.length; drawHUD(); continue; }

    if ((k.length===1 && k>="1" && k<="5") ||
        (k.indexOf("Digit")==0 && k.length>=6 && k[5]>="1" && k[5]<="5") ||
        (k.indexOf("KEY_")==0  && k.length>=5 && k[4]>="1" && k[4]<="5")) {
      var d = 0;
      if (k.length===1) d = k.charCodeAt(0) - 48;
      else if (k.indexOf("Digit")==0) d = k.charCodeAt(5) - 48;
      else d = k.charCodeAt(4) - 48;
      applyPresetIndex(d - 1);
      continue;
    }

    if (k === "<" || k === "," || k === "LEFT" || k === "ArrowLeft" || k === "Left") {
      currentDeg -= currentStep(); if (currentDeg < 0) currentDeg = 0;
      dither.setTargetMs(angleToMs(currentDeg));
      mode = MODE_LIVE;
      drawHUD();
      continue;
    }
    if (k === ">" || k === "." || k === "RIGHT" || k === "ArrowRight" || k === "Right") {
      currentDeg += currentStep(); if (currentDeg > 180) currentDeg = 180;
      dither.setTargetMs(angleToMs(currentDeg));
      mode = MODE_LIVE;
      drawHUD();
      continue;
    }
  }
}

// ---------- Setup ----------
gpio.pinMode(SERVO_PIN, "output");
gpio.digitalWrite(SERVO_PIN, false);

// Splash
display.drawFillRect(0, 0, W, H, BLACK);
splash();

// Black screen before UI to avoid any carry-over artifacts
display.drawFillRect(0, 0, W, H, BLACK);

// Initial UI
drawHUD();
drawBarStatic();
lastBarTs = now();

// ---------- Main loop ----------
while (running) {
  var t = now();
  handleKeys();

  if (!paused) {
    if (mode === MODE_SWEEP) {
      currentDeg += sweepDir * sweepStepDeg;
      if (currentDeg >= 180) { currentDeg = 180; sweepDir = -1; }
      if (currentDeg <= 0)   { currentDeg = 0;   sweepDir = +1; }
      dither.setTargetMs(angleToMs(currentDeg));
    } else if (mode === MODE_CENTRE) {
      currentDeg = 90;
      dither.setTargetMs(angleToMs(currentDeg));
    }
    // MODE_LIVE: handled by keys

    var highMs = dither.nextHighMs();
    gpio.digitalWrite(SERVO_PIN, true);  delay(highMs);
    gpio.digitalWrite(SERVO_PIN, false); delay(PERIOD_MS - highMs);

       if (!overlayActive) drawBarIfDue(t);
  } else {
    gpio.digitalWrite(SERVO_PIN, false);
    delay(PERIOD_MS);
  }
}

// Clean exit: pull signal LOW; no post-loop drawing
