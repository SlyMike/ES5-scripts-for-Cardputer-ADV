
// Camera Shutter Timer (ES5, Bruce) — v1.9 (stable)
// Features: BLUE background during pulse, throttled redraws, ~22 FPS loop.
// UI: Top-right status (Paused/Running/Pulse) in banner; HUD shows Mode, Shots, GPIO, Pulse.
// Controls:
//   LEFT/RIGHT : select unit (D/H/M/S)
//   + / -      : adjust selected unit (paused only)
//   M          : toggle mode (Repeat / 1-Shot)
//   SPACE/ENTER: start/pause
//   E          : reset remaining to configured duration
//   H          : toggle HUD
//   C          : toggle Controls overlay (startup splash 3s)
//   G          : cycle GPIO pin (G1/G2/G3/G4)
//   D          : cycle pulse duration (200/500/1000/2000/3000 ms)
//   Q          : quit

var display = require('display');
var keyboard = require('keyboard');
var gpio = require('gpio');

// --- Screen & colors ---
var W = display.width();
var H = display.height();

var BG       = display.color(0,0,0);
var WHITE    = display.color(255,255,255);
var ACCENT   = display.color(0,180,240);
var BG_PULSE = display.color(0,60,200); // blue while pulsing
var bgIsPulse = false;

var HUD_H   = 16;
var TITLE_Y = 6;

// --- Countdown band layout ---
var CNT_X = 4;
var CNT_Y = 24;
var CNT_W = W - 8;
var CNT_H = 68;
var UNIT_Y = CNT_Y + CNT_H + 4;

// --- GPIO & pulse cfg ---
var gpioPins = [1,2,3,4];       // G1..G4
var SHUTTER_PIN = 2;            // default G2
var PULSE_MS = 200;             // default width
var pulseDurations = [200,500,1000,2000,3000];

// Runtime pulse flags
var pulseActive = false;
var pulseStartMs = 0;

// Init pin safely
gpio.pinMode(SHUTTER_PIN, "output");
gpio.digitalWrite(SHUTTER_PIN, false);

// --- Mode & run state ---
var MODE_REPEAT = 0, MODE_ONESHOT = 1;
var mode = MODE_REPEAT;
var running = true;
var armed = false;

// --- Counters ---
var shotsCount = 0;

// --- Overlay & HUD ---
var showHud = true;
var controlsVisible = false;

// --- Duration limits ---
var MAX_MS = 7 * 24 * 3600 * 1000; // 7d
var MIN_MS = 1000;                 // 1s

// --- Configured countdown (editable via units) ---
var cfgDays = 0, cfgHours = 0, cfgMins = 0, cfgSecs = 10; // default 10s
var selIdx = 3; // 0=days,1=hours,2=mins,3=secs

// --- Runtime countdown ---
var totalMs = 0;         // derived from cfg units
var remainingMs = 0;     // live countdown
var lastTickMs = now();  // for delta timing

// --- Throttled big-band rendering state ---
var lastShownSec  = -1;
var nextBandDrawTs = 0;

// --- Text helpers ---
function setText(size){
  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize  === "function") display.setTextSize(size || 1);
}
function charW(size){
  if (size<=1) return 6;
  if (size===2) return 12;
  if (size===3) return 18;
  return 24;
}
function printAt(x,y,s){
  if (typeof display.drawString === "function") display.drawString(s,x,y);
  else { if (typeof display.setCursor === "function") display.setCursor(x,y); display.print(s); }
}
function clearRect(x,y,w,h,color){ display.drawFillRect(x,y,w,h,(color||BG)); }
function fmt2(n){ return (n<10?"0":"")+n; }

// --- UI background pulse switcher ---
function setUiBackgroundPulse(on){
  on = !!on;
  if (bgIsPulse === on) return;
  bgIsPulse = on;

  BG = on ? BG_PULSE : display.color(0,0,0);

  // Full clear once (treated as mode change), then redraw bands
  display.drawFillRect(0,0,W,H,BG);
  drawBanner();
  drawCountdownThrottled(true);
  drawHud(true);
}

// --- Duration helpers ---
function clampCfg(){
  if (cfgDays  < 0) cfgDays  = 0;
  if (cfgHours < 0) cfgHours = 0;
  if (cfgMins  < 0) cfgMins  = 0;
  if (cfgSecs  < 0) cfgSecs  = 0;
  if (cfgHours > 23) cfgHours = 23;
  if (cfgMins  > 59) cfgMins  = 59;
  if (cfgSecs  > 59) cfgSecs  = 59;

  totalMs = (cfgDays*86400 + cfgHours*3600 + cfgMins*60 + cfgSecs) * 1000;

  if (totalMs > MAX_MS){ totalMs = MAX_MS; toUnits(totalMs); }
  if (totalMs < MIN_MS){ totalMs = MIN_MS; toUnits(totalMs); }

  // Optional: keep PULSE_MS < totalMs (soft guard)
  if (PULSE_MS >= totalMs && totalMs > 1){ PULSE_MS = totalMs - 1; }
}
function toUnits(ms){
  var t = Math.floor(ms/1000);
  var d = Math.floor(t/86400); t -= d*86400;
  var h = Math.floor(t/3600);  t -= h*3600;
  var m = Math.floor(t/60);
  var s = t - m*60;
  cfgDays=d; cfgHours=h; cfgMins=m; cfgSecs=s;
}

// --- Top-right status in banner ---
function topStatusText(){ if (pulseActive) return "Pulse"; return armed ? "Running" : "Paused"; }
function drawTopStatus(){
  var status = topStatusText();
  var wpx = status.length * charW(1);
  var x = W - (wpx + 6);
  if (x < 100) x = 100;
  setText(1);
  printAt(x, TITLE_Y, status);
}

// --- Banner & HUD ---
function drawBanner(){
  clearRect(0,0,W,20,BG);
  setText(1);
  printAt(6, TITLE_Y, "Camera Shutter Timer");
  drawTopStatus();
}
function drawHud(force){
  if (!showHud && !force) return;
  clearRect(0, H-HUD_H, W, HUD_H, BG);
  if (!showHud) return;
  setText(1);
  var x=6, y=H-HUD_H+2;
  var modeStr = (mode===MODE_REPEAT?"Repeat":"1-Shot");
  printAt(x, y, "Mode:"+modeStr+" Shots:"+shotsCount+" GPIO:G"+SHUTTER_PIN+" Pulse:"+PULSE_MS+"ms");
}

// --- Countdown rendering ---
function splitDHMS(ms){
  var t = Math.floor(ms/1000);
  var d = Math.floor(t/86400); t -= d*86400;
  var h = Math.floor(t/3600);  t -= h*3600;
  var m = Math.floor(t/60);
  var s = t - m*60;
  return {d:d,h:h,m:m,s:s};
}
function drawCountdownBig(isArmed){
  clearRect(CNT_X, CNT_Y, CNT_W, CNT_H, BG);

  var ms = (isArmed ? remainingMs : totalMs);
  var T = splitDHMS(ms);
  var hh = fmt2(T.h), mm = fmt2(T.m), ss = fmt2(T.s);
  var line = hh + ":" + mm + ":" + ss;

  var size = 4;
  var widthPx = line.length * charW(size);
  if (widthPx > CNT_W - 4){ size = 3; widthPx = line.length * charW(size); }

  var x = CNT_X + Math.floor((CNT_W - widthPx)/2); if (x < CNT_X + 2) x = CNT_X + 2;
  var lineH = (size===4 ? 24 : 18);
  var y = CNT_Y + Math.floor((CNT_H - lineH)/2); if (y < CNT_Y+2) y = CNT_Y+2;

  if (T.d > 0){
    var dStr = ""+T.d+"d";
    var dSize = 2;
    var dx = CNT_X + Math.floor((CNT_W - (dStr.length * charW(dSize)))/2);
    var dy = y - 18; if (dy < CNT_Y+2) dy = CNT_Y+2;
    setText(dSize); printAt(dx,dy,dStr);
  }

  setText(size); printAt(x,y,line);

  clearRect(CNT_X, UNIT_Y-2, CNT_W, 16, BG);
  setText(1); printAt(CNT_X, UNIT_Y, "D H M S");
  var selX = CNT_X + (selIdx*14);
  display.drawFillRect(selX, UNIT_Y+10, 10, 2, ACCENT);
}
function drawCountdownThrottled(force){
  if (force){
    drawCountdownBig(armed);
    var msNow = armed ? remainingMs : totalMs;
    lastShownSec = Math.floor(msNow/1000);
    nextBandDrawTs = now() + 100;
    return;
  }
  if (!armed){
    drawCountdownBig(false);
    lastShownSec = Math.floor(totalMs/1000);
    nextBandDrawTs = now() + 100;
    return;
  }
  var t = now();
  if (t < nextBandDrawTs) return;
  var sec = Math.floor(remainingMs/1000);
  if (sec !== lastShownSec){
    drawCountdownBig(true);
    lastShownSec = sec;
    nextBandDrawTs = t + 100;
  }
}

// --- Controls overlay ---
function drawControlsScreen(){
  display.drawFillRect(0,0,W,H,BG);
  setText(1);
  var y = 6;
  printAt(6,y,"Controls:");
  y+=14; printAt(6,y,"LEFT/RIGHT : select unit (D/H/M/S)");
  y+=12; printAt(6,y,"+ / - : adjust selected unit (paused only)");
  y+=12; printAt(6,y,"M : toggle mode (Repeat / 1-Shot)");
  y+=12; printAt(6,y,"SPACE/ENTER: start/pause");
  y+=12; printAt(6,y,"E : reset remaining to set duration");
  y+=12; printAt(6,y,"H : toggle HUD");
  y+=12; printAt(6,y,"G : cycle GPIO pin (G1/G2/G3/G4)");
  y+=12; printAt(6,y,"D : cycle pulse width (200/500/1000/2000/3000 ms)");
  y+=12; printAt(6,y,"Repeat cycle includes pulse (wait = Preset - Pulse)");
  y+=12; printAt(6,y,"C : toggle this screen");
  y+=12; printAt(6,y,"Q : quit");
  y+=18; printAt(6,y,"Current:");
  y+=12; printAt(6,y,"Mode  : " + (mode===MODE_REPEAT?"Repeat":"1-Shot"));
  y+=12; printAt(6,y,"Preset: " + fmt2(cfgHours)+":"+fmt2(cfgMins)+":"+fmt2(cfgSecs) + " ("+cfgDays+"d)");
  y+=12; printAt(6,y,"GPIO  : G" + SHUTTER_PIN);
  y+=12; printAt(6,y,"Pulse : " + PULSE_MS + " ms");
  y+=12; printAt(6,y,"Shots : " + shotsCount);
}
function showControls(on){
  controlsVisible = !!on;
  if (controlsVisible){ drawControlsScreen(); }
  else { redrawAll(); }
}
function splashControls(ms){
  showControls(true);
  var start = now();
  while (running){
    handleKeys();
    if ((now() - start) >= ms) break;
    delay(20);
  }
  if (running) showControls(false);
}

// --- Editing & mode toggles ---
function applyUnitDelta(idx, delta){
  if (armed) return;
  if (idx===0) cfgDays  += delta;
  else if (idx===1) cfgHours += delta;
  else if (idx===2) cfgMins  += delta;
  else if (idx===3) cfgSecs  += delta;
  clampCfg();
  remainingMs = totalMs;
  drawCountdownThrottled(true);
  drawHud(false);
}
function toggleMode(){ mode = (mode===MODE_REPEAT?MODE_ONESHOT:MODE_REPEAT); drawHud(true); drawBanner(); }
function toggleHud(){ showHud = !showHud; drawHud(true); }
function startPause(){ armed = !armed; lastTickMs = now(); drawHud(true); drawBanner(); }
function resetRemaining(){ remainingMs = totalMs; drawCountdownThrottled(true); }

// --- GPIO helpers ---
function setShutterPin(newPin){
  if (newPin === SHUTTER_PIN) return;
  gpio.digitalWrite(SHUTTER_PIN, false);
  SHUTTER_PIN = newPin;
  gpio.pinMode(SHUTTER_PIN, "output");
  gpio.digitalWrite(SHUTTER_PIN, false);
  drawHud(true);
}
function cycleShutterPin(){
  if (pulseActive) return;
  var i, idx = -1;
  for (i=0;i<gpioPins.length;i++){ if (gpioPins[i] === SHUTTER_PIN){ idx = i; break; } }
  idx = (idx + 1) % gpioPins.length;
  setShutterPin(gpioPins[idx]);
  drawBanner();
}
function cyclePulseMs(){
  if (pulseActive) return;
  var i, idx = 0;
  for (i=0;i<pulseDurations.length;i++){ if (pulseDurations[i] === PULSE_MS){ idx = i; break; } }
  idx = (idx + 1) % pulseDurations.length;
  PULSE_MS = pulseDurations[idx];
  // Optional: keep PULSE_MS < totalMs
  if (PULSE_MS >= totalMs && totalMs > 1){ PULSE_MS = totalMs - 1; }
  drawHud(true);
}

// --- Pulse driver (non-blocking) ---
function triggerPulse(){
  pulseActive = true;
  pulseStartMs = now();
  setUiBackgroundPulse(true);
  gpio.digitalWrite(SHUTTER_PIN, true);
  shotsCount++;
  drawHud(true);
  drawBanner();
}
function updatePulse(t){
  if (!pulseActive) return;
  if ((t - pulseStartMs) >= PULSE_MS){
    gpio.digitalWrite(SHUTTER_PIN, false);
    pulseActive = false;
    setUiBackgroundPulse(false);

    if (mode===MODE_REPEAT){
      // QoL: next wait excludes pulse time to keep cycle period equal to preset
      var nextWait = totalMs - PULSE_MS;
      if (nextWait < 1) nextWait = 1;
      remainingMs = nextWait;
      armed = true;
    } else {
      armed = false;
    }

    drawHud(true);
    drawBanner();
    drawCountdownThrottled(true);
  }
}

// --- Keyboard ---
function handleKeys(){
  var ks = keyboard.getKeysPressed();
  if (!ks || ks.length===0) return;
  var i;
  for (i=0;i<ks.length;i++){
    var k = ""+ks[i];

    if (k==="Q" || k==="q"){ running=false; continue; }
    if (k==="C" || k==="c"){ showControls(!controlsVisible); continue; }

    if (controlsVisible){ continue; } // paused while overlay visible

    if (k==="H" || k==="h"){ toggleHud(); continue; }
    if (k==="M" || k==="m"){ toggleMode(); continue; }
    if (k===" " || k==="Space" || k==="SPACE" || k==="Enter"){ startPause(); continue; }
    if (k==="E" || k==="e"){ resetRemaining(); continue; }

    if (k==="G" || k==="g"){ cycleShutterPin(); if (controlsVisible) drawControlsScreen(); continue; }
    if (k==="D" || k==="d"){ cyclePulseMs(); if (controlsVisible) drawControlsScreen(); continue; }

    if (k==="ArrowLeft" || k==="LEFT" || k==="<" || k===","){
      selIdx--; if (selIdx<0) selIdx=0; drawCountdownThrottled(true); continue;
    }
    if (k==="ArrowRight" || k==="RIGHT" || k===">" || k==="."){
      selIdx++; if (selIdx>3) selIdx=3; drawCountdownThrottled(true); continue;
    }
    if (k==="+" || k==="="){ applyUnitDelta(selIdx, +1); continue; }
    if (k==="-" || k==="_"){ applyUnitDelta(selIdx, -1); continue; }
  }
}

// --- Init ---
clampCfg();
remainingMs = totalMs;
function redrawAll(){ display.drawFillRect(0,0,W,H,BG); drawBanner(); drawCountdownThrottled(true); drawHud(true); }
redrawAll();
splashControls(3000);

// --- Main loop ---
var frameMs = 45; // ~22 FPS
while (running){
  handleKeys();
  var t = now();

  if (!controlsVisible && armed && !pulseActive){
    var dt = t - lastTickMs;
    if (dt > 0){
      remainingMs -= dt;
      if (remainingMs <= 0){
        remainingMs = 0;
        drawCountdownThrottled(true);
        triggerPulse();
      } else {
        drawCountdownThrottled(false);
      }
      lastTickMs = t;
    }
  } else {
    lastTickMs = t;
  }

  updatePulse(t);
  delay(frameMs);
}

// --- Exit ---
gpio.digitalWrite(SHUTTER_PIN, false);

