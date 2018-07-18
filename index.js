var configuration = require('./configure').configuration;
var events = configuration.events;
var executeCommand = require('./commands').executeCommand;
var glob = require('glob');

function startProgram(cfg) {
    // var args = require('./argumentsGetter').argumentsGetter();
    // var patternCmd = 'cd {0} && git checkout . && git clean -df && git checkout {1} && git pull';
    // var currentPath = executeCommand('cd');

    //executeCommand(stringFormat(patternCmd, cfg.mainProject, args.mainProjBranch));
    build(cfg.mainProject, cfg.devenvPath);
    //prepareSecondProject(patternCmd, cfg.secondProject, args.secondProjName, args.secondProjBranch);
    //buold secondProject
    //fix xml references (set the path for every plugins based on mainProject paths)
    //executeCommand(stringFormat('cd {0}', patternCmd));
}

function prepareSecondProject(patternCmd, cfgPath, projName, branch) {
    patternCmd = patternCmd.concat(' && rmdir /S /Q packages');
    
    var rewrittenPath = stringFormat(patternCmd, stringFormat(cfgPath, projName, projName), branch);
    
    executeCommand(rewrittenPath);
}

function build(path, devEnv) {
    var projectFile = glob.sync(stringFormat('{0}/*.sln', path))[0];
    executeCommand(stringFormat('"{0}" {1} /rebuild', devEnv, projectFile));
}

function stringFormat() {
    var str = arguments[0];
    if (arguments.length == 1) { return str; }

    for (var i = 1; i < arguments.length; i++) {
        str = str.replace(new RegExp('\\{'+ (i-1) + '\\}'), arguments[i]);
    }

    return str;
}

events.on('onStart', startProgram);

configuration.getConfig();