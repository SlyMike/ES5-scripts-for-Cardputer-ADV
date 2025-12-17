
// Bouncing Ball for Bruce Interpreter (ES5 only)
// - Uses require('display')
// - No let/const, no arrow functions, no promises, no setInterval/setTimeout
// - Uses delay(ms) for frame pacing

var display = require('display');   // BJS display module
// Colors
var BG = display.color(0, 0, 0);
var PALETTE = [
  display.color(255,   0,   0), // Red
  display.color(  0, 255,   0), // Green
  display.color(  0,   0, 255), // Blue
  display.color(255, 255,   0), // Yellow
  display.color(255, 165,   0), // Orange
  display.color(128,   0, 128), // Purple
  display.color(  0, 255, 255), // Cyan
  display.color(255, 105, 180)  // Hot pink
];

// Screen geometry
var W = display.width();   // e.g., 240
var H = display.height();  // e.g., 135

// Ball state
var ball = {
  x: Math.floor(W / 2),
  y: Math.floor(H / 2),
  vx: 2,     // pixels per frame (adjust for speed)
  vy: 2,
  r: Math.max(4, Math.floor(Math.min(W, H) / 12)), // radius auto-scaled
  ci: 0      // color index
};

// Helpers
function drawBall(x, y, r, color) {
  display.drawFillCircle(x, y, r, color);
}
function eraseBall(x, y, r) {
  display.drawFillCircle(x, y, r, BG);
}

// Advance one frame: move, bounce, recolor on edge hit
function step() {
  // erase previous
  eraseBall(ball.x, ball.y, ball.r);

  var nx = ball.x + ball.vx;
  var ny = ball.y + ball.vy;
  var bounced = false;

  // Left/Right walls
  if (nx - ball.r < 0) {
    nx = ball.r;
    ball.vx = -ball.vx;
    bounced = true;
  } else if (nx + ball.r >= W) {
    nx = W - 1 - ball.r;
    ball.vx = -ball.vx;
    bounced = true;
  }

  // Top/Bottom walls
  if (ny - ball.r < 0) {
    ny = ball.r;
    ball.vy = -ball.vy;
    bounced = true;
  } else if (ny + ball.r >= H) {
    ny = H - 1 - ball.r;
    ball.vy = -ball.vy;
    bounced = true;
  }

  // commit
  ball.x = nx;
  ball.y = ny;

  // color shift on any bounce
  if (bounced) {
    ball.ci = (ball.ci + 1) % PALETTE.length;
  }

  // draw new
  drawBall(ball.x, ball.y, ball.r, PALETTE[ball.ci]);
}

// ---- main ----
display.fill(BG);                    // clear screen
drawBall(ball.x, ball.y, ball.r, PALETTE[ball.ci]);

var frameDelayMs = 12;               // ~80 FPS busy loop; adjust if needed
while (true) {
  step();
  delay(frameDelayMs);               // interpreter-provided blocking delay
}
