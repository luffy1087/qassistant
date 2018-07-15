var configure = require('./configure');
var args = require('./argumentsGetter');
var executeCommand = require('./commands').executeCommand;
//console.log(args);
//executeCommand('ls');
var json  = configure.getConfig();
console.log(json)