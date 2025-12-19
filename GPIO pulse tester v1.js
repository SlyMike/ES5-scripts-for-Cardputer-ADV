
// ES5 Bruce JS – GPIO Pulse Tester with Controls Overlay
var display=require('display'); var keyboard=require('keyboard'); var gpio=require('gpio');
var W=display.width(),H=display.height();
var BG=display.color(0,0,0), BLUE=display.color(0,60,200), WHITE=display.color(255,255,255);
var running=true, pulseActive=false, pulseStart=0, PULSEMS=200, controlsVisible=false;
var gpioPins=[1,2,3,4], pinIndex=1, SHUTTERPIN=gpioPins[pinIndex];

gpio.pinMode(SHUTTERPIN,"output"); gpio.digitalWrite(SHUTTERPIN,false);

function setTextEnv(){ if(display.setTextColor)display.setTextColor(WHITE); if(display.setTextSize)display.setTextSize(1);}
function printAt(x,y,s){ if(display.drawString)display.drawString(s,x,y); else{ if(display.setCursor)display.setCursor(x,y); display.print(s);} }
function clearScreen(c){ display.drawFillRect(0,0,W,H,(c||BG)); }

function setPinSafe(newPin){
  gpio.digitalWrite(SHUTTERPIN,false);
  SHUTTERPIN=newPin; gpio.pinMode(SHUTTERPIN,"output"); gpio.digitalWrite(SHUTTERPIN,false);
}

function startPulse(){ pulseActive=true; pulseStart=now(); gpio.digitalWrite(SHUTTERPIN,true); clearScreen(BLUE);}
function stepPulse(){ if(!pulseActive)return; if((now()-pulseStart)>=PULSEMS){ gpio.digitalWrite(SHUTTERPIN,false); pulseActive=false; clearScreen(BG);} }

function drawControls(){
  clearScreen(BG);
  setTextEnv();
  printAt(10,10,"Controls:");
  printAt(10,30,"Q = Quit");
  printAt(10,45,"C = Toggle Controls");
  printAt(10,60,"P = Pulse");
  printAt(10,75,"G = Cycle Pin");
}

function handleKeys(){
  var ks=keyboard.getKeysPressed(); if(!ks||ks.length===0)return;
  for(var i=0;i<ks.length;i++){
    var k=""+ks[i];
    if(k==="Q"||k==="q"){running=false;}
    if(k==="C"||k==="c"){controlsVisible=!controlsVisible; clearScreen(BG); if(controlsVisible){ drawControls(); }}
    if(controlsVisible){ continue; }
    if(k==="P"||k==="p"){ if(!pulseActive)startPulse();}
    if(k==="G"||k==="g"){ if(!pulseActive){ pinIndex=(pinIndex+1)%gpioPins.length; setPinSafe(gpioPins[pinIndex]);}}
  }
}

// Init
clearScreen(BG); setTextEnv(); printAt(10,10,"GPIO Pulse Tester");
var frameMs=45;
while(running){
  handleKeys();
  if(!controlsVisible){ stepPulse(); }
  delay(frameMs);
}
