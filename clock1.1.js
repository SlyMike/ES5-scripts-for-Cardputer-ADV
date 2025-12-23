// ES5 Digital Clock for Cardputer ADV (Bruce v1.12)
// Verified: Balanced braces, no duplicate or unterminated functions.

var display  = require('display');
var keyboard = require('keyboard');
var device   = require('device');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var HUDH = 16, TITLEY = 6;

var showHud = true, controlsVisible = false, running = true;
var lastSec = -1;

// Helpers
function setTextEnv(){ if (typeof display.setTextColor==="function") display.setTextColor(WHITE); }
function printAt(x,y,s){ if (typeof display.drawString==="function") display.drawString(s,x,y); else { if (typeof display.setCursor==="function") display.setCursor(x,y); display.print(s);} }
function clearRect(x,y,w,h,c){ display.drawFillRect(x,y,w,h,(c||BG)); }
function fmt2(n){ return (n<10?"0":"")+n; }

// Battery text
function batteryText(){
  if (device && typeof device.getBatteryCharge==="function"){
    var p = device.getBatteryCharge();
    return "Batt: "+p+"%";
  }
  return "Batt: N/A";
}

// Get clock time (RTC or uptime fallback)
function getClockTime(){
  if (typeof device.getTime==="function"){
    return device.getTime(); // If Bruce exposes RTC
  }
  var ms = now();
  var sec = Math.floor(ms/1000);
  var h = Math.floor((sec/3600)%24);
  var m = Math.floor((sec/60)%60);
  var s = sec%60;
  return fmt2(h)+":"+fmt2(m)+":"+fmt2(s);
}

// UI
function drawBanner(){
  clearRect(0,0,W,20,BG);
  setTextEnv();
  if (typeof display.setTextSize==="function") display.setTextSize(1);
  printAt(6,TITLEY,"Digital Clock");
}

function drawHud(){
  if (!showHud) return;
  clearRect(0,H-HUDH,W,HUDH,BG);
  setTextEnv();
  if (typeof display.setTextSize==="function") display.setTextSize(1);
  printAt(6,H-HUDH+2,batteryText());
}

function drawClock(timeStr){
  clearRect(0,20,W,H-HUDH-20,BG);
  if (typeof display.setTextSize==="function") display.setTextSize(3);
  var charWidth = 6 * 3; // base width * size
  var tw = timeStr.length * charWidth;
  var x = Math.floor((W - tw) / 2);
  var y = Math.floor((H - HUDH - 20) / 2);
  setTextEnv();
  printAt(x,y,timeStr);
  if (typeof display.setTextSize==="function") display.setTextSize(1);
}

// Input
function handleKeys(){
  var ks = keyboard.getKeysPressed(); if (!ks||ks.length===0) return;
  var i;
  for (i=0;i<ks.length;i++){
    var k = ""+ks[i];
    if (k==="Q"||k==="q"){ running=false; continue; }
    if (k==="C"||k==="c"){ controlsVisible=!controlsVisible; continue; }
    if (controlsVisible){ continue; }
    if (k==="H"||k==="h"){ showHud=!showHud; drawHud(); continue; }
  }
}

// Init
display.drawFillRect(0,0,W,H,BG);
drawBanner();
drawHud();

// Main loop
var frameMs = 45;
while (running){
  handleKeys();
  if (!controlsVisible){
    var t = getClockTime();
    var sec = t.substr(t.length-2); // last two chars = seconds
    if (sec!==lastSec){
      drawClock(t);
      drawBanner();
      drawHud();
      lastSec = sec;
    }
  }
  delay(frameMs);
}

// Exit: leave last frame
