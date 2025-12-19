
// ES5 Bruce JS – Countdown Timer v6 (Improved Layout)
var display = require('display');
var keyboard = require('keyboard');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var running = true, timerActive = false, countdownMs = 300000; // 5 min
var lastSec = -1, controlsVisible = false, selectedUnit = 1; // 0=H,1=M,2=S

function setTextEnv(size){ if(display.setTextColor) display.setTextColor(WHITE); if(display.setTextSize) display.setTextSize(size||1); }
function printAt(x,y,s){ if(display.drawString) display.drawString(s,x,y); else { if(display.setCursor) display.setCursor(x,y); display.print(s);} }
function clearScreen(c){ display.drawFillRect(0,0,W,H,(c||BG)); }

function fmtTime(ms){
  var t = Math.floor(ms/1000);
  var h = Math.floor(t/3600);
  var m = Math.floor((t%3600)/60);
  var s = t%60;
  return [h,m,s];
}

function drawBanner(){
  setTextEnv(1);
  printAt(10,10,"Countdown Timer");
  printAt(W-90,10,(timerActive?"Running":"Paused"));
}

function drawControls(){
  clearScreen(BG);
  setTextEnv(1);
  printAt(10,10,"Controls:");
  printAt(10,30,"Q = Quit");
  printAt(10,45,"C = Toggle Controls");
  printAt(10,60,"S = Start/Stop");
  printAt(10,75,"+/- = Adjust");
  printAt(10,90,"Arrow L/R = Select Unit");
}

function redrawTimer(){
  clearScreen();
  drawBanner();
  var parts = fmtTime(countdownMs);
  var y = (H/2) - 30; // centre for big digits
  var xStart = 10;
  var str = (parts[0]<10?"0"+parts[0]:parts[0])+":"+(parts[1]<10?"0"+parts[1]:parts[1])+":"+(parts[2]<10?"0"+parts[2]:parts[2]);
  setTextEnv(4); // big digits
  printAt(xStart,y,str);
  // Precompute underline rectangle coords for big digits
  var unitWidth = 60; // approx width per unit at size 4
  var rectX = xStart + (selectedUnit * unitWidth);
  var rectY = y + 40; // just below digits
  var rectW = 50;
  var rectH = 4;
  display.drawFillRect(rectX,rectY,rectW,rectH,WHITE);
}

function adjustUnit(delta){
  var parts = fmtTime(countdownMs);
  if(selectedUnit===0){ parts[0]+=delta; if(parts[0]<0) parts[0]=0; }
  if(selectedUnit===1){ parts[1]+=delta; if(parts[1]<0) parts[1]=0; }
  if(selectedUnit===2){ parts[2]+=delta; if(parts[2]<0) parts[2]=0; }
  countdownMs = (parts[0]*3600000)+(parts[1]*60000)+(parts[2]*1000);
}

function handleKeys(){
  var ks = keyboard.getKeysPressed(); if(!ks||ks.length===0) return;
  for(var i=0;i<ks.length;i++){
    var k = ""+ks[i];
    if(k==="Q"||k==="q"){ running=false; }
    if(k==="C"||k==="c"){ controlsVisible=!controlsVisible; clearScreen(BG); if(controlsVisible){ drawControls(); } else { redrawTimer(); }}
    if(controlsVisible){ continue; }
    if(k==="S"||k==="s"){ timerActive=!timerActive; }
    if(k==="+"||k==="="){ adjustUnit(1); redrawTimer(); }
    if(k==="-"||k==="_"){ adjustUnit(-1); redrawTimer(); }
    if(k==="ArrowLeft"||k==="LEFT"||k==="<"||k===","){ selectedUnit--; if(selectedUnit<0) selectedUnit=2; redrawTimer(); }
    if(k==="ArrowRight"||k==="RIGHT"||k===">"||k==="."){ selectedUnit++; if(selectedUnit>2) selectedUnit=0; redrawTimer(); }
  }
}

// Init
redrawTimer();
var frameMs = 45;
while(running){
  handleKeys();
  if(!controlsVisible){
    if(timerActive && countdownMs>0){ countdownMs -= frameMs; if(countdownMs<0) countdownMs=0; }
    var sec = Math.floor(countdownMs/1000);
    if(sec!==lastSec){ redrawTimer(); lastSec=sec; }
  }
  delay(frameMs);
}; // explicit semicolon
// End of
