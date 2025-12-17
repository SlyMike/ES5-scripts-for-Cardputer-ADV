
// Bouncing Balls + Keyboard + FPS (ES5 only)
// Cardputer-Adv (Bruce Interpreter)
// Controls:
//   [1..9] -> set number of balls

var display  = require('display');
var keyboard = require('keyboard');

// -------- Screen & colors --------
var W = display.width();
var H = display.height();
var BG = display.color(0,0,0);
var WHITE = display.color(255,255,255);
var PALETTE = [
  display.color(255,0,0), display.color(0,255,0), display.color(0,0,255),
  display.color(255,255,0), display.color(255,165,0), display.color(128,0,128),
  display.color(0,255,255), display.color(255,105,180)
];

// -------- State --------
var balls = [];         // [{x,y,vx,vy,r,ci}]
var MAX_BALLS = 9;

// FPS
var fps = 0, frames = 0, lastFpsTs = now();

// -------- HUD --------
function hud() {
  // small area clear & draw
  display.drawFillRect(0, 0, 150, 14, BG);
  if (typeof display.setCursor === "function") display.setCursor(2, 2);
  if (typeof display.setTextColor === "function") display.setTextColor(WHITE);
  if (typeof display.setTextSize === "function") display.setTextSize(1);
  display.print("FPS:"); display.print(fps);
  display.print("  Balls:"); display.print(balls.length);
}

// -------- Ball helpers --------
function drawBall(b){ display.drawFillCircle(b.x, b.y, b.r, PALETTE[b.ci]); }
function eraseBall(b){ display.drawFillCircle(b.x, b.y, b.r, BG); }

function makeBall() {
  var r = Math.max(4, Math.floor(Math.min(W,H)/14));
  var x = (random(W - 2*r - 1) + r + 1);
  var y = (random(H - 2*r - 1) + r + 1);
  var vx = (random(3)+1) * (random(2)===0?-1:1);
  var vy = (random(3)+1) * (random(2)===0?-1:1);
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

// one step; returns true if bounced
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

// -------- Keyboard --------
function handleKeys(){
  var ks = keyboard.getKeysPressed();
  if (!ks || ks.length===0) return;
  var i;
  for (i=0;i<ks.length;i++){
    var k = "" + ks[i];
    // digits 1..9, and common forms Digit1 / KEY_1
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

// -------- Main --------
display.fill(BG);
setBallCount(1);
hud();

var frameMs = 12;
while (true){
  var i;
   for (i=0;i<balls.length;i++){ stepBall(balls[i]); }
  handleKeys();

  frames++;
  var t = now();
  if (t - lastFpsTs >= 1000){ fps = frames; frames = 0; lastFpsTs = t; hud(); }

  delay(frameMs);
}