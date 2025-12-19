
// ES5 Bruce JS – Pre-flight Checker
// Paste your script text into `scriptText` below and run this checker.

var scriptText = ""; // <-- Paste your app code here as a string

function checkScript(text){
  var braceCount = 0;
  var i, warnings = [];
  var lines = text.split("\n");
  var funcNames = {};
  
  for(i=0;i<lines.length;i++){
    var line = lines[i];
    // Count braces
    for(var j=0;j<line.length;j++){
      var ch = line.charAt(j);
      if(ch==="{"){ braceCount++; }
      if(ch==="}"){ braceCount--; }
    }
    // Detect function names
    var match = line.match(/function\s+([a-zA-Z0-9_]+)/);
    if(match && match[1]){
      var fname = match[1];
      if(funcNames[fname]){ warnings.push("Duplicate function: "+fname+" (line "+(i+1)+")"); }
      funcNames[fname] = true;
    }
  }
  
  if(braceCount!==0){ warnings.push("Unbalanced braces! Net count: "+braceCount); }
  
  if(warnings.length===0){
    print("✅ Script passed checks: braces balanced, no duplicate functions.");
  } else {
    print("⚠ Issues found:");
    for(i=0;i<warnings.length;i++){ print("- "+warnings[i]); }
  }
}

// Run check
check
