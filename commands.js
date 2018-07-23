var process = require('child_process');


function spawn(cmdString, callback) {
  var cmdInfo = cmdString.split(" ");
  var cmd = cmdString[0].trim().replace(/\.exe$/i, '');
  var cmdOptions = cmdInfo.slice(1).map(function(value) { return value.trim(); });
  var spawnedProcess = process.spawn(cmd, cmdOptions);

  spawnedProcess.stdout.on('data', function(stream) { console.log(stream.toString()); });

  spawnedProcess.on('exit', function(code) {
      if (code != 0) {
        throw new Exception('Failed: ' + code);
      }

      if (callback) {
        callback();
      }
  });

  return spawnedProcess;
}

function exec(cmdString, callback) {
  var executedProcess = process.exec(cmd, function(err, stdout, stderr) {
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