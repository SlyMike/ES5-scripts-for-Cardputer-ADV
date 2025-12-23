
// ES5 GPS NMEA Parser for Cardputer ADV (Bruce v1.12)
// UART: TX=G1, RX=G2 | Baud persistence in RAM only
// Features: Time, Lat, Lon, Satellites, HDOP, Fix Status, Colour Cycling, Controls Overlay

var display = require('display');
var keyboard = require('keyboard');
var uart = require('uart');

var W = display.width(), H = display.height();
var HUDH = 16, TITLEY = 6;

// Colours
var textColors = [display.color(255,255,255), display.color(255,0,0), display.color(0,255,0), display.color(0,0,255), display.color(255,255,0)];
var bgColors = [display.color(0,0,0), display.color(0,0,64), display.color(64,64,64), display.color(0,128,128)];
var textIndex = 0, bgIndex = 0;
var textColor = textColors[textIndex], bgColor = bgColors[bgIndex];

var baudRates = [4800,9600,19200], baudIndex = 1; // Default: 9600
var showHud = true, running = true, controlsVisible = false;
var buffer = "", gpsTime="--:--:--", gpsLat="N/A", gpsLon="N/A", gpsSats="0", gpsHdop="N/A", gpsFix="V";

// Init UART
if (uart && typeof uart.setup==="function"){
  uart.setup(baudRates[baudIndex], "G1", "G2");
}

// Helpers
function setTextEnv(){ if (typeof display.setTextColor==="function") display.setTextColor(textColor); }
function printAt(x,y,s){ if (typeof display.drawString==="function") display.drawString(s,x,y); else { if (typeof display.setCursor==="function") display.setCursor(x,y); display.print(s);} }
function clearRect(x,y,w,h,c){ display.drawFillRect(x,y,w,h,(c||bgColor)); }

// UI
function drawBanner(){
  clearRect(0,0,W,20,bgColor);
  setTextEnv();
  printAt(6,TITLEY,"GPS Monitor");
}

function drawHud(){
  if (!showHud) return;
  clearRect(0,H-HUDH,W,HUDH,bgColor);
  setTextEnv();
  printAt(6,H-HUDH+2,"Sats:"+gpsSats+" Baud:"+baudRates[baudIndex]);
}

function drawMain(){
  clearRect(0,20,W,H-HUDH-20,bgColor);
  setTextEnv();
  printAt(6,40,"Time: "+gpsTime);
  printAt(6,60,"Lat: "+gpsLat);
  printAt(6,80,"Lon: "+gpsLon);
  printAt(6,100,"Fix:"+gpsFix+" HDOP:"+gpsHdop);
}

function drawControlsOverlay(){
  clearRect(0,0,W,H,bgColor);
  setTextEnv();
  printAt(6,20,"Controls:");
  printAt(6,40,"Q = Quit");
  printAt(6,60,"H = Toggle HUD");
  printAt(6,80,"B = Cycle Baud");
  printAt(6,100,"T = Text Colour");
  printAt(6,120,"G = Background Colour");
  printAt(6,140,"C = Close Overlay");
}

// Parse NMEA
function parseNMEA(line){
  if (line.indexOf("$GPRMC")===0){
    var parts=line.split(",");
    if (parts.length>6){
      gpsTime=formatTime(parts[1]);
      gpsFix=(parts[2] && parts[2].length>0)?parts[2]:"V"; // A=Active, V=Void
      gpsLat=formatCoord(parts[3],parts[4]);
      gpsLon=formatCoord(parts[5],parts[6]);
    }
  }
  if (line.indexOf("$GPGGA")===0){
    var parts=line.split(",");
    if (parts.length>8){
      gpsSats=parts[7];
      gpsHdop=(parts[8] && parts[8].length>0)?parts[8]:"N/A";
    }
  }
}

function formatTime(t){
  if (!t||t.length<6) return "--:--:--";
  return t.substr(0,2)+":"+t.substr(2,2)+":"+t.substr(4,2);
}

function formatCoord(val,dir){
  if (!val||val==="") return "N/A";
  return val+" "+dir;
}

// Input
function handleKeys(){
  var ks=keyboard.getKeysPressed(); if(!ks||ks.length===0) return;
  var i;
  for(i=0;i<ks.length;i++){
    var k=""+ks[i];
    if(k==="Q"||k==="q"){ running=false; continue; }
    if(k==="C"||k==="c"){ controlsVisible=!controlsVisible; redrawAll(); continue; }
    if(controlsVisible){ continue; } // Pause updates while overlay visible
    if(k==="H"||k==="h"){ showHud=!showHud; drawHud(); continue; }
    if(k==="B"||k==="b"){
      baudIndex=(baudIndex+1)%baudRates.length;
      if (uart && typeof uart.setup==="function"){
        uart.setup(baudRates[baudIndex],"G1","G2");
      }
      clearRect(0,40,W,40,bgColor);
      printAt(6,40,"Baud changed: "+baudRates[baudIndex]);
      drawHud();
      continue;
    }
    if(k==="T"||k==="t"){ textIndex=(textIndex+1)%textColors.length; textColor=textColors[textIndex]; redrawAll(); continue; }
    if(k==="G"||k==="g"){ bgIndex=(bgIndex+1)%bgColors.length; bgColor=bgColors[bgIndex]; redrawAll(); continue; }
  }
}

// Redraw everything
function redrawAll(){
  display.drawFillRect(0,0,W,H,bgColor);
  if (controlsVisible){ drawControlsOverlay(); return; }
  drawBanner();
  drawHud();
  drawMain();
}

// Init display
display.drawFillRect(0,0,W,H,bgColor);
drawBanner();
drawHud();
drawMain();

// Main loop
var frameMs=45;
while(running){
  handleKeys();
  if (!controlsVisible){
    var chunk=(uart && typeof uart.read==="function")?uart.read():"";
    if(chunk&&chunk.length>0){
      buffer+=chunk;
      var idx;
      while((idx=buffer.indexOf("\n"))>=0){
        var line=buffer.substr(0,idx).trim();
        buffer=buffer.substr(idx+1);
        parseNMEA(line);
        drawMain();
        drawBanner();
        drawHud();
      }
    }
  }
  delay(frameMs);
}
