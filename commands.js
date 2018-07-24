var childProcess = require('child_process');


function spawn(cmd, options, callback) {
  var correctCmd = cmd.replace(/\.exe/i, '').trim();
  var spawnedProcess = childProcess.spawn(correctCmd, options);

  spawnedProcess.stdout.on('data',function(stream) {
    console.log(stream.toString());
  });

  spawnedProcess.on('exit', function(code) {
      if (code != 0) {
        console.log(code);
      }

      if (callback) {
        callback();
      }
  });

  spawnedProcess.on('error', function(error) {
    console.log(error);
  });

  return spawnedProcess;
}

function exec(cmdString, callback) {
  var executedProcess = childProcess.exec(cmdString, function(err, stdout, stderr) {
    if (err) {  
      console.log(err);
    }
  
    if (stdout) {
      console.log(stdout);
    }

    if (callback) {
      callback();
    }
  });

  return executedProcess;
}

exports.commands = {
  spawn: spawn,
  exec: exec
};