
// ES5 Bruce JS – Hello World HUD Version
var display = require('display');
var keyboard = require('keyboard');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var running = true, controlsVisible = false;

// Colour palettes
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
var bgNames = ["Black","Grey","Blue","Green","Red"];
var textNames = ["White","Yellow","Cyan","Magenta","Orange"];

var bgIndex = 0, textIndex = 0;
var bgColor = bgPalette[bgIndex];
var textColor = textPalette[textIndex];

var HUDH = 16, TITLEY = 6;

function setTextEnv(size){ if(display.setTextColor) display.setTextColor(textColor); if(display.setTextSize) display.setTextSize(size||2); }
function printAt(x,y,s){ if(display.drawString) display.drawString(s,x,y); else { if(display.setCursor) display.setCursor(x,y); display.print(s);} }
function clearScreen(c){ display.drawFillRect(0,0,W,H,(c||bgColor)); }
function clearRect(x,y,w,h,c){ display.drawFillRect(x,y,w,h,(c||bgColor)); }

function drawBanner(status){
  clearRect(0,0,W,20,bgColor);
  setTextEnv(1);
  printAt(6,TITLEY,"Hello HUD");
  var wpx = status.length * 6;
  var x = W - (wpx + 6); if(x<100) x=100;
  printAt(x,TITLEY,status);
}

function drawHud(){
  clearRect(0,H-HUDH,W,HUDH,bgColor);
  setTextEnv(1);
  printAt(6,H-HUDH+2,"BG:"+bgNames[bgIndex]+" TXT:"+textNames[textIndex]);
}

function drawControls(){
  clearScreen(bgColor);
  setTextEnv(1);
  printAt(10,10,"Controls:");
  printAt(10,30,"Q = Quit");
  printAt(10,45,"C = Toggle Controls");
  printAt(10,60,"B = Change Background");
  printAt(10,75,"T = Change Text Colour");
}

function drawHello(){
  clearScreen(bgColor);
  drawBanner("Active");
  drawHud();
  setTextEnv(3);
  var msg = "Hello World";
  var x = Math.floor((W - (msg.length * 20)) / 2); // 24  approx width per char at size 4
  var y = Math.floor(H / 2) - 20;
  printAt(x,y,msg);
}

function handleKeys(){
  var ks = keyboard.getKeysPressed(); if(!ks||ks.length===0) return;
  for(var i=0;i<ks.length;i++){
    var k = ""+ks[i];
    if(k==="Q"||k==="q"){ running=false; }
    if(k==="C"||k==="c"){ controlsVisible=!controlsVisible; clearScreen(bgColor); if(controlsVisible){ drawControls(); } else { drawHello(); }}
    if(controlsVisible){ continue; }
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
// End of script
