var exec = require('child_process').exec


function printOutput(error, stdout, stderr) {
  if (error) {
    console.log(error);
  }

  if (stderr) {
    console.log(stderr);
  }
  
  console.log(stdout);
}

exports.executeCommand = function(cmd) {
  var childProcess = exec(cmd.replace(/\.exe/i, ''), printOutput);

  childProcess.stdout.on("data", function(buffer) { console.log(buffer); });

  return childProcess;
}