var exec = require('child_process').exec;


function printOutput(error, stdout, stderr) {
  console.log(stdout);
}

exports.executeCommand = function(cmd) {
  exec(cmd, printOutput);
}