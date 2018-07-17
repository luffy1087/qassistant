var configuration = require('./configure').configuration;
var events = configuration.events;

function startProgram(cfg) {
    console.log(cfg);
    // var executeCommand = require('./commands').executeCommand;
    //cd mainProject
    //git checkout . & git clean -df & git checkout {yTosBranch} & git pull
    //build mainProject
    //cd secondProject
    //git checkout . & git clean -df & git checkout {storeBranch} & git pull & deletepackagesConfig
    //delete store packages directory
    //fix xml references (set the path for every plugins based on mainProject paths)
}

events.on('onStart', startProgram);

configuration.getConfig();