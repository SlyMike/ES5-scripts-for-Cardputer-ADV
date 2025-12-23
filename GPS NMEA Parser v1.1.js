
// ES5 GPS NMEA Parser for Cardputer ADV (Bruce v1.12)
// UART: TX=G1, RX=G2 | Baud persistence in ES5i_baud.txt

var display = require('display');
var keyboard = require('keyboard');
var uart = require('uart');
var fs = require('fs');

var W = display.width(), H = display.height();
var BG = display.color(0,0,0), WHITE = display.color(255,255,255);
var HUDH = 16, TITLEY = 6;

var baudRates = [4800,9600,19200], baudIndex = 1;
var showHud = true, running = true;
var buffer = "", gpsTime="--:--:--", gpsLat="N/A", gpsLon="N/A", gpsSats="0";

// Load saved baud rate
if (fs && typeof fs.readFile==="function"){
  var saved = fs.readFile("/ES5i_baud.txt");
  if (saved && saved.length>0){
    var val = parseInt(saved,10);
    var idx = baudRates.indexOf(val);
    if (idx>=0){ baudIndex = idx; }
  }
}

// Init UART safely
if (uart && typeof uart.setup==="function"){
  uart.setup(baudRates[baudIndex], "G1", "G2");
}

// Helpers
function setTextEnv(){ if (typeof display.setTextColor==="function") display.setTextColor(WHITE); }
function printAt(x,y,s){ if (typeof display.drawString==="function") display.drawString(s,x,y); else { if (typeof display.setCursor==="function") display.setCursor(x,y); display.print(s);} }
function clearRect(x,y,w,h,c){ display.drawFillRect(x,y,w,h,(c||BG)); }

// UI
function drawBanner(){
  clearRect(0,0,W,20,BG);
  setTextEnv();
  printAt(6,TITLEY,"GPS Monitor");
}

function drawHud(){
  if (!showHud) return;
  clearRect(0,H-HUDH,W,HUDH,BG);
  setTextEnv();
  printAt(6,H-HUDH+2,"Sats:"+gpsSats+" Baud:"+baudRates[baudIndex]);
}

function drawMain(){
  clearRect(0,20,W,H-HUDH-20,BG);
  setTextEnv();
  printAt(6,40,"Time: "+gpsTime);
  printAt(6,60,"Lat: "+gpsLat);
  printAt(6,80,"Lon: "+gpsLon);
}

// Parse NMEA
function parseNMEA(line){
  if (line.indexOf("$GPRMC")===0){
    var parts=line.split(",");
    if (parts.length>6){
      gpsTime=formatTime(parts[1]);
      gpsLat=formatCoord(parts[3],parts[4]);
      gpsLon=formatCoord(parts[5],parts[6]);
    }
  }
  if (line.indexOf("$GPGGA")===0){
    var parts=line.split(",");
    if (parts.length>7){ gpsSats=parts[7]; }
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
    if(k==="H"||k==="h"){ showHud=!showHud; drawHud(); continue; }
    if(k==="B"||k==="b"){
      baudIndex=(baudIndex+1)%baudRates.length;
      if (fs && typeof fs.writeFile==="function"){
        fs.writeFile("/ES5i_baud.txt",""+baudRates[baudIndex]);
      }
      // Show message instead of re-init (safe approach)
      clearRect(0,40,W,40,BG);
      printAt(6,40,"Baud saved: "+baudRates[baudIndex]);
      printAt(6,60,"Restart to apply");
      drawHud();
      continue;
    }
  }
}

// Init display
display.drawFillRect(0,0,W,H,BG);
drawBanner();
drawHud();
drawMain();

// Main loop
var frameMs=45;
while(running){
  handleKeys();
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
  delay(frameMs);
}
