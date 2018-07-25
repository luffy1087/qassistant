var configuration = require('./configure').configuration,
    prepareEnv = require('./prepareEnv').prepareEnv,
    extend = require('extend'),
    events = configuration.events;

function startProgram(cfg) {
    var args = require('./argumentsGetter').argumentsGetter();
    var wholeObject = extend({}, cfg, args);
    prepareEnv.prepareFirstEnvironment(wholeObject);
    //prepareEnv.prepareSecondEnvironment(secondProjPath, args.secondProjBranch);
    // //fix xml references (set the path for every plugins based on mainProject paths)
    // //executeCommand(stringFormat('cd {0}', patternCmd));
}

events.on('onStart', startProgram);

configuration.getConfig();