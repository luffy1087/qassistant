var configuration = require('./configure').configuration;
var events = configuration.events;

function startProgram(cfg) {
    var args = require('./argumentsGetter').argumentsGetter();
    var executeCommand = require('./commands').executeCommand;
    var patternCmd = 'cd {0} && git checkout . && git clean -df && git checkout {1} && git pull';

    executeCommand(stringFormat(patternCmd, cfg.mainProject, args.mainProjBranch));
    //build mainProject
    prepareSecondProject(patternCmd, cfg.secondProject, args.secondProjName, args.secondProjBranch);
    //buold secondProject
    //fix xml references (set the path for every plugins based on mainProject paths)
}

function prepareSecondProject(patternCmd, cfgPath, projName, branch) {
    patternCmd = patternCmd.concat(' && rmdir /S /Q packages');
    
    var rewrittenPath = stringFormat(patternCmd, stringFormat(cfgPath, projName), branch);
    
    executeCommand(rewrittenPath);
}

function stringFormat() {

    console.log(arguments);
    var str = arguments[0];
    if (arguments.length == 1) { return str; }

    for (var i = 1; i < arguments.length; i++) {
        str = str.replace(new RegExp('\\{'+ (i-1) + '\\}'), arguments[i]);
    }

    return str;
}

events.on('onStart', startProgram);

configuration.getConfig();