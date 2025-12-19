
// ES5 Bruce JS – Hello World App with Colour Palette
var display = require('display');
var keyboard = require('keyboard');

var W = display.width(), H = display.height();
var running = true;

// Define colour palettes
var bgPalette = [
  display.color(0,0,0),       // Black
  display.color(50,50,50),    // Dark Grey
  display.color(0,60,200),    // Blue
  display.color(0,150,0),     // Green
  display.color(180,0,0)      // Red
];
var textPalette = [
  display.color(255,255,255), // White
  display.color(255,255,0),   // Yellow
  display.color(0,255,255),   // Cyan
  display.color(255,0,255),   // Magenta
  display.color(255,128,0)    // Orange
];

var bgIndex = 0, textIndex = 0;
var bgColor = bgPalette[bgIndex];
var textColor = textPalette[textIndex];

function setTextEnv(size){ if(display.setTextColor) display.setTextColor(textColor); if(display.setTextSize) display.setTextSize(size||2); }
function printAt(x,y,s){ if(display.drawString) display.drawString(s,x,y); else { if(display.setCursor) display.setCursor(x,y); display.print(s);} }
function clearScreen(c){ display.drawFillRect(0,0,W,H,(c||bgColor)); }

function drawHello(){
  clearScreen(bgColor);
  setTextEnv(2);
  var msg = "Hello World";
  var x = Math.floor((W - (msg.length * 12)) / 2); // approx width per char at size 2
  var y = Math.floor(H / 2);
  printAt(x,y,msg);
}

function handleKeys(){
  var ks = keyboard.getKeysPressed(); if(!ks||ks.length===0) return;
  for(var i=0;i<ks.length;i++){
    var k = ""+ks[i];
    if(k==="Q"||k==="q"){ running=false; }
    if(k==="B"||k==="b"){ bgIndex++; if(bgIndex>=bgPalette.length) bgIndex=0; bgColor = bgPalette[bgIndex]; drawHello(); }
    if(k==="T"||k==="t"){ textIndex++; if(textIndex>=textPalette.length) textIndex=0; textColor = textPalette[textIndex]; drawHello(); }
  }
}

// Init
drawHello();

var frameMs = 45;
while(running){
   handleKeys();
  delay(frameMs);
}; // explicit semicolon
