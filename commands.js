var process = require('child_process');


function spawn(cmd) {
  var args = Array.prototype.slice.call(arguments, 1);
  console.log(args);
  console.log(cmd.replace(/\.exe/i, ''));
  //var childProcess = spawn(cmd.replace(/\.exe/i, ''));
  var childProcess = process.spawn('pwd');

  childProcess.stdout.on('data', function(stream) {
      console.log(stream.toString());
  });

  childProcess.on('exit', function(code) {
      if (code != 0) {
          console.log('Failed: ' + code);
      }
  });

  return childProcess;
}

function onExecutionFinished(err, stdout, stderr) {
  if (err) {  
    console.log(err);
  }

  if (stdout) {
    console.log(stdout);
  }
}

function exec(cmd, onExecutionFinished) {
  process.exec(cmd, onExecutionFinished);
}

exports.commands = {
  spawn: spawn,
  exec: exec
};