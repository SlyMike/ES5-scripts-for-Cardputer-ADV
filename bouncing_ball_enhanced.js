
// Bouncing Balls Demo (ES5, Bruce)
// Keys: [1..9]=count, B=size, S=speed, H=HUD, C=controls, Q=quit

var display  = require('display');
var keyboard = require('keyboard');

// ---- Screen & colors ----
var W = display.width();
var H = display.height();
var BG    = display.color(0,0,0);
var WHITE = display.color(255,255,255);
var GREY  = display.color(60,60,60);

var PALETTE = [
  display.color(255,0,0), display.color(0,255,0), display.color(0,0,255),
  display.color(255,255,0), display.color(255,165,0), display.color(128,0,128),
  display.color(0,255,255), display.color(255,105,180)
];

// ---- State ----
var balls = [];                 // [{x,y,vx,vy,r,ci}]
var MAX_BALLS = 9;
var running = true;
var showHud = true;
var controlsVisible = false;

// FPS
var fps = 0, frames = 0, lastFpsTs = now();

// Size modes
var SIZE_SMALL=0, SIZE_MEDIUM=1, SIZE_LARGE=2;
var sizeLabels = ["Small","Medium","Large"];
var sizeMode = SIZE_MEDIUM;

// Speed modes
var SPEED_SLOW=0, SPEED_NORMAL=1, SPEED_FAST=2;
var speedLabels = ["Slow","Normal","Fast"];
var speedMode = SPEED_NORMAL;
var speedScalars = [0.7, 1.0, 1.5];

// ---- HUD ----
var HUD_W = 220, HUD_H = 14, HUD_X = 0, HUD_Y = 0;
function hud() {
  display.drawFillRect(HUD_X, HUD_Y, HUD_W, HUD_H, BG);
  if (!showHud) return;
  if (typeof display.setCursor === "function") display.setCursor(2, 2);
  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize === "function") display.setTextSize(1);
  display.print("FPS:");    display.print(fps);
  display.print("  Balls:");display.print(balls.length);
  display.print("  Size:"); display.print(sizeLabels[sizeMode]);
  display.print("  Speed:");display.print(speedLabels[speedMode]);
}

// ---- Controls overlay ----
function printAt(x,y,s){
  if (typeof display.drawString === "function") display.drawString(s, x, y);
  else { if (typeof display.setCursor === "function") display.setCursor(x,y); display.print(s); }
}

function drawControlsScreen() {
  display.drawFillRect(0, 0, W, H, BG);
  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize  === "function") display.setTextSize(1);
  var y = 6;
  printAt(6, y, "Controls:");
  y+=14; printAt(6, y, "[1..9] : set number of balls");
  y+=12; printAt(6, y, "B/b    : size (Small → Medium → Large)");
  y+=12; printAt(6, y, "S/s    : speed (Slow  → Normal → Fast)");
  y+=12; printAt(6, y, "H/h    : toggle HUD");
  y+=12; printAt(6, y, "C/c    : toggle Controls");
  y+=12; printAt(6, y, "Q/q    : quit");
  y+=18; printAt(6, y, "Current:");
  y+=12; printAt(6, y, "Balls: " + balls.length);
  y+=12; printAt(6, y, "Size : " + sizeLabels[sizeMode]);
  y+=12; printAt(6, y, "Speed: " + speedLabels[speedMode]);
}

function showControls(on) {
  controlsVisible = !!on;
  if (controlsVisible) {
    drawControlsScreen();
  } else {
    display.fill(BG);
    var i; for (i=0;i<balls.length;i++){ drawBall(balls[i]); }
    hud();
  }
}

function splashControls(ms) {
  showControls(true);
  var start = now();
  while (running) {
    handleKeys();
    if ((now() - start) >= ms) break;
    delay(20);
  }
  if (running) showControls(false);
}

// ---- Balls ----
function drawBall(b){ display.drawFillCircle(b.x, b.y, b.r, PALETTE[b.ci]); }
function eraseBall(b){ display.drawFillCircle(b.x, b.y, b.r, BG); }

function currentRadius(){
  var base = Math.max(4, Math.floor(Math.min(W,H)/14));
  if (sizeMode===SIZE_SMALL)  return Math.max(3, Math.floor(base*0.7));
  if (sizeMode===SIZE_LARGE)  return Math.floor(base*1.35);
  return base;
}

function currentSpeedScalar(){ return speedScalars[speedMode]; }

function randomSpeed(){
  var s = (random(3)+1) * (random(2)===0?-1:1);
  var v = Math.floor(s * currentSpeedScalar());
  if (v===0) v = (s<0?-1:1);
  return v;
}

function makeBall(){
  var r  = currentRadius();
  var x  = (random(W - 2*r - 1) + r + 1);
  var y  = (random(H - 2*r - 1) + r + 1);
  var vx = randomSpeed();
  var vy = randomSpeed();
  var ci = random(PALETTE.length);
  return {x:x,y:y,vx:vx,vy:vy,r:r,ci:ci};
}

function setBallCount(n){
  if (n<1) n=1; if (n>MAX_BALLS) n=MAX_BALLS;
  display.fill(BG);
  balls = [];
  var i; for(i=0;i<n;i++){ var b=makeBall(); balls.push(b); drawBall(b); }
  hud();
}

function stepBall(b){
  eraseBall(b);
  var nx = b.x + b.vx, ny = b.y + b.vy, bounced = false;

  if (nx - b.r < 0){ nx = b.r; b.vx = -b.vx; bounced = true; }
  else if (nx + b.r >= W){ nx = W - 1 - b.r; b.vx = -b.vx; bounced = true; }

  if (ny - b.r < 0){ ny = b.r; b.vy = -b.vy; bounced = true; }
  else if (ny + b.r >= H){ ny = H - 1 - b.r; b.vy = -b.vy; bounced = true; }

  b.x = nx; b.y = ny;

  if (bounced){ b.ci = (b.ci + 1) % PALETTE.length; }
  drawBall(b);
  return bounced;
}

// ---- Mode changes ----
function applySizeMode(newMode){
  if (newMode!==SIZE_SMALL && newMode!==SIZE_MEDIUM && newMode!==SIZE_LARGE) return;
  sizeMode = newMode;
  var r = currentRadius();
  display.fill(BG);
  var i, b;
  for (i=0;i<balls.length;i++){
    b = balls[i];
    if (b.x - r < 0) b.x = r;
    if (b.x + r >= W) b.x = W - 1 - r;
    if (b.y - r < 0) b.y = r;
    if (b.y + r >= H) b.y = H - 1 - r;
    b.r = r;
    drawBall(b);
  }
  hud();
}

function applySpeedMode(newMode){
  if (newMode!==SPEED_SLOW && newMode!==SPEED_NORMAL && newMode!==SPEED_FAST) return;
  var prevK = speedScalars[speedMode];
  speedMode = newMode;
  var newK  = speedScalars[speedMode];
  var i, b, sx, sy, baseVx, baseVy;
  for (i=0;i<balls.length;i++){
    b = balls[i];
    sx = (b.vx<0?-1:1); sy = (b.vy<0?-1:1);
    baseVx = Math.max(1, Math.floor(Math.abs(b.vx) / (prevK||1)));
    baseVy = Math.max(1, Math.floor(Math.abs(b.vy) / (prevK||1)));
    b.vx = Math.max(1, Math.floor(baseVx * newK)) * sx;
    b.vy = Math.max(1, Math.floor(baseVy * newK)) * sy;
    if (b.vx===0) b.vx = sx;
    if (b.vy===0) b.vy = sy;
  }
  hud();
}

// ---- Keyboard ----
function handleKeys(){
  var ks = keyboard.getKeysPressed();
  if (!ks || ks.length===0) return;
  var i;
  for (i=0;i<ks.length;i++){
    var k = "" + ks[i];

    // Quit
    if (k==="Q" || k==="q"){ running=false; continue; }

    // HUD toggle
    if (k==="H" || k==="h"){ showHud=!showHud; hud(); continue; }

    // Controls toggle
    if (k==="C" || k==="c"){ showControls(!controlsVisible); continue; }

    // If controls visible, pause other actions
    if (controlsVisible) { continue; }

    // Size
    if (k==="B" || k==="b"){ applySizeMode((sizeMode+1)%3); continue; }

    // Speed
    if (k==="S" || k==="s"){ applySpeedMode((speedMode+1)%3); continue; }

    // Digits 1..9
    if ((k.length===1 && k>="1" && k<="9") ||
        (k.indexOf("Digit")==0 && k.length>=6 && k[5]>="1" && k[5]<="9") ||
        (k.indexOf("KEY_")==0 && k.length>=5 && k[4]>="1" && k[4]<="9")){
      var d = 0;
      if (k.length===1) d = k.charCodeAt(0) - 48;
      else if (k.indexOf("Digit")==0) d = k.charCodeAt(5) - 48;
      else d = k.charCodeAt(4) - 48;
      if (d>0){ setBallCount(d); }
    }
  }
}

// ---- Init & Splash ----
display.fill(BG);
setBallCount(1);
hud();
splashControls(3000);

// ---- Main loop ----
var frameMs = 12;
while (running){
  if (!controlsVisible) {
    var i;
    for (i=0;i<balls.length;i++){ stepBall(balls[i]); }
  }

  handleKeys();

  frames++;
  var t = now();
  if (t - lastFpsTs >= 1000){
    fps = frames; frames = 0; lastFpsTs = t; hud();
  }

   delay(frameMs);
}

