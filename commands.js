var exec = require('child_process').exec


function printOutput(error, stdout, stderr) {
  if (error) {
    console.log(error);
  }
  console.log(stdout);
}

exports.executeCommand = function(cmd, isLongProcess) {
  var childProcess = exec(cmd.replace(/\.exe/i, ''));

  if (isLongProcess) {
    childProcess.stdout.on("data", function(buffer) { console.log(buffer); });
  }

  return childProcess;
}