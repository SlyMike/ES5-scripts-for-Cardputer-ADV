
// ES5 Bruce JS – Simple Countdown Timer with Controls Overlay
var display = require('display');
var keyboard = require('keyboard');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var running=true, timerActive=false, countdownMs=300000; // 5 min
var lastUpdate=0, lastSec=-1, controlsVisible=false;

function setTextEnv(){ if (display.setTextColor) display.setTextColor(WHITE); if (display.setTextSize) display.setTextSize(2); }
function printAt(x,y,s){ if (display.drawString) display.drawString(s,x,y); else { if (display.setCursor) display.setCursor(x,y); display.print(s);} }
function clearScreen(c){ display.drawFillRect(0,0,W,H,(c||BG)); }

function fmtTime(ms){
  var t=Math.floor(ms/1000); var h=Math.floor(t/3600); var m=Math.floor((t%3600)/60); var s=t%60;
  return (h<10?"0"+h:h)+":"+(m<10?"0"+m:m)+":"+(s<10?"0"+s:s);
}

function drawControls(){
  clearScreen(BG);
  setTextEnv();
  printAt(10,10,"Controls:");
  printAt(10,30,"Q = Quit");
  printAt(10,45,"C = Toggle Controls");
  printAt(10,60,"S = Start/Stop");
  printAt(10,75,"+/- = Adjust Time");
}

function handleKeys(){
  var ks=keyboard.getKeysPressed(); if(!ks||ks.length===0)return;
  for(var i=0;i<ks.length;i++){
    var k=""+ks[i];
    if(k==="Q"||k==="q"){running=false;}
    if(k==="C"||k==="c"){controlsVisible=!controlsVisible; clearScreen(BG); if(controlsVisible){ drawControls(); }}
    if(controlsVisible){ continue; }
    if(k==="+"||k==="="){countdownMs+=60000;}
    if(k==="-"||k==="_"){countdownMs-=60000;if(countdownMs<0)countdownMs=0;}
    if(k==="S"||k==="s"){timerActive=!timerActive;}
  }
}

// Init
clearScreen(); setTextEnv();
var frameMs=45;
while(running){
  handleKeys();
  if(!controlsVisible){
    if(timerActive && countdownMs>0){ countdownMs-=(frameMs); if(countdownMs<0)countdownMs=0; }
    var sec=Math.floor(countdownMs/1000);
    if(sec!==lastSec){ clearScreen(); setTextEnv(); printAt(20,H/2-20,fmtTime(countdownMs)); lastSec=sec; }
  }
  delay(frameMs);
}
