var configure = require('./configure');
var args = require('./argumentsGetter');
var executeCommand = require('./commands').executeCommand;
//cd mainProject
//git checkout . & git clean -df & git checkout {yTosBranch} & git pull
//build mainProject
//git checkout . & git clean -df & git checkout {storeBranch} & git pull
//delete store packages directory
//fix xml references (set the path for every plugins based on mainProject paths)