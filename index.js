var configuration = require('./configure').configuration,
    prepareEnv = require('./prepareEnv').prepareEnv,
    utils = require('./utils').utils,
    events = configuration.events;

function startProgram(cfg) {
    var args = require('./argumentsGetter').argumentsGetter();
    var secondProjPath = utils.getPathByPattern(cfg.secondProject, args.secondProjName);
    prepareEnv.prepareFirstEnvironment(cfg.mainProject, args.mainProjBranch, cfg.devenvPath);
    //prepareEnv.prepareSecondEnvironment(secondProjPath, args.secondProjBranch);
    // //fix xml references (set the path for every plugins based on mainProject paths)
    // //executeCommand(stringFormat('cd {0}', patternCmd));
}

events.on('onStart', startProgram);

configuration.getConfig();