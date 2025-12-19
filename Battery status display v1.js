
// ES5 Bruce JS – Battery Status Display with Controls Overlay
var display = require('display');
var keyboard = require('keyboard');
var device = require('device');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var running = true, lastUpdate = 0, controlsVisible = false;

function setTextEnv(){ if (display.setTextColor) display.setTextColor(WHITE); if (display.setTextSize) display.setTextSize(1); }
function printAt(x,y,s){ if (display.drawString) display.drawString(s,x,y); else { if (display.setCursor) display.setCursor(x,y); display.print(s);} }
function clearScreen(c){ display.drawFillRect(0,0,W,H,(c||BG)); }

function batteryText(){
  var p = 0;
  if (device && typeof device.getBatteryCharge==="function"){ p = device.getBatteryCharge(); }
  var voltage = 3.6 + ((p/100)*0.6); // scale 3.6V–4.2V
  var vStr = Math.floor(voltage*100+0.5)/100; // 2 decimals
  return "Battery: "+p+"% ("+vStr+"V)";
}

function drawControls(){
  clearScreen(BG);
  setTextEnv();
  printAt(10,10,"Controls:");
  printAt(10,30,"Q = Quit");
  printAt(10,45,"C = Toggle Controls");
}

function handleKeys(){
  var ks = keyboard.getKeysPressed(); if (!ks||ks.length===0) return;
  for (var i=0;i<ks.length;i++){
    var k = ""+ks[i];
    if (k==="Q"||k==="q"){ running=false; }
    if (k==="C"||k==="c"){ controlsVisible=!controlsVisible; clearScreen(BG); if(controlsVisible){ drawControls(); } }
  }
}

// Init
clearScreen(); setTextEnv(); printAt(10,10,"Battery Monitor");
var frameMs = 45;
while(running){
  handleKeys();
  if(!controlsVisible){
    if ((now()-lastUpdate)>=1000){ // update every second
      clearScreen();
      setTextEnv();
      printAt(10,10,"Battery Monitor");
      printAt(10,40,batteryText());
      lastUpdate = now();
    }
  }
  delay(frameMs);
}
