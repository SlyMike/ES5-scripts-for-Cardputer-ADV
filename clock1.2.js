
// ES5 Digital Clock with Manual Time Set for Cardputer ADV (Bruce v1.12)
// Verified: Balanced braces, no duplicate or unterminated functions.

var display  = require('display');
var keyboard = require('keyboard');
var device   = require('device');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var HUDH = 16, TITLEY = 6;

var showHud = true, controlsVisible = false, running = true;
var editMode = false, selectedUnit = 0; // 0=HH,1=MM,2=SS
var lastSec = -1;
var offsetMs = 0; // fallback offset if RTC not available

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
  var ms = now() + offsetMs;
  if (typeof device.getTime==="function" && !editMode){
    return device.getTime(); // If Bruce exposes RTC
  }
  var sec = Math.floor(ms/1000);
  var h = Math.floor((sec/3600)%24);
  var m = Math.floor((sec/60)%60);
  var s = sec%60;
  return fmt2(h)+":"+fmt2(m)+":"+fmt2(s);
}

// Apply edited time
function applyTime(h,m,s){
  if (typeof device.setTime==="function"){
    device.setTime(fmt2(h)+":"+fmt2(m)+":"+fmt2(s));
  } else {
    var totalSec = h*3600 + m*60 + s;
    offsetMs = (totalSec*1000) - now();
  }
}

// UI
function drawBanner(){
  clearRect(0,0,W,20,BG);
  setTextEnv();
  if (typeof display.setTextSize==="function") display.setTextSize(1);
  var title = editMode ? "EDIT MODE" : "Digital Clock";
  printAt(6,TITLEY,title);
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
  var charWidth = 6 * 3; // size 3
  var tw = timeStr.length * charWidth;
  var x = Math.floor((W - tw) / 2);
  var y = Math.floor((H - HUDH - 20) / 2);
  setTextEnv();
  printAt(x,y,timeStr);

  // Underline selected unit in edit mode
  if (editMode){
    var underlineY = y + 24; // just below digits
    var unitStart = selectedUnit===0 ? 0 : (selectedUnit===1 ? 3 : 6);
    var unitLen = selectedUnit===0 ? 2 : 2; // HH or MM or SS
    var ux = x + (unitStart * charWidth);
    var uw = unitLen * charWidth;
    display.drawFillRect(ux, underlineY, uw, 3, WHITE);
  }

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
    if (k==="E"||k==="e"){ editMode=!editMode; continue; }

    if (editMode){
      if (k==="ArrowLeft"||k==="LEFT"||k==="<"||k===","){ if (selectedUnit>0) selectedUnit--; continue; }
      if (k==="ArrowRight"||k==="RIGHT"||k===">"||k==="."){ if (selectedUnit<2) selectedUnit++; continue; }
      if (k==="+"||k==="="){ adjustUnit(1); continue; }
      if (k==="-"||k==="_"){ adjustUnit(-1); continue; }
      if (k==="Enter"){ confirmEdit(); continue; }
      if (k==="Escape"){ editMode=false; continue; }
    }
  }
}

// Adjust selected unit
function adjustUnit(delta){
  var t = getClockTime();
  var h = parseInt(t.substr(0,2),10);
  var m = parseInt(t.substr(3,2),10);
  var s = parseInt(t.substr(6,2),10);
  if (selectedUnit===0){ h=(h+delta+24)%24; }
  if (selectedUnit===1){ m=(m+delta+60)%60; }
  if (selectedUnit===2){ s=(s+delta+60)%60; }
  applyTime(h,m,s);
}

// Confirm edit
function confirmEdit(){
  var t = getClockTime();
  var h = parseInt(t.substr(0,2),10);
  var m = parseInt(t.substr(3,2),10);
  var s = parseInt(t.substr(6,2),10);
  applyTime(h,m,s);
  editMode=false;
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
    var sec = t.substr(t.length-2);
    if (editMode || sec!==lastSec){
      drawClock(t);
      drawBanner();
      drawHud();
      lastSec = sec;
    }
  }
  delay(frameMs);
}

// Exit: leave last frame
