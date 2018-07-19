var executeCommand = require('./commands').executeCommand;
    utils = require('./utils').utils,
    glob = require('glob'),
    async = require('async');

function changeDir(path) {
    return executeCommand(utils.strFormat('cd {0}', path));
}

function gitCleanChanges() {
    return executeCommand('git', 'checkout', '.');
}

function gitCleanDirectory() {
    return executeCommand('git', 'clean', '-df');
}

function gitSwitchBranch(branch) {
    return executeCommand('git', 'checkout', branch);
}

function gitPull() {
    return executeCommand('git', 'pull');
}

function gitTasks(path, branch) {
    var gitCmdPattern = 'cd {0} && git checkout . && git clean -df && git checkout {1} && git pull';
    var strCmd = utils.strFormat(gitCmdPattern, path, branch);
    
    return executeCommand(strCmd);
}

function cleanPackages() {
    executeCommand('rmdir /S /Q packages');
}

function build(devenv, project) {
    var strCmd = utils.strFormat('"{0}" {1} /rebuild', devenv, project);
    
    return executeCommand(strCmd);
}

function restorePackages(path) {
    var strCmd = utils.strFormat('nuget restore {0}', path);
    
    return executeCommand(strCmd);
}

function getProjectFilePath(path) {
    var files = glob.sync(utils.strFormat('{0}/*.sln', path));
    if (files && files.length == 1) {
        return files[0];
    }

    throw new Error('Error: Project not found in ' + path);
}

function resolveCallback(task) {
    var args = Array.prototype.slice.call(arguments, 1);
   
    return function(resolve) {
        var childProcess = task.apply(this, args);
        
        childProcess.stdout.on('end', function(stream) { resolve(); });
    }
}

function prepareFirstEnvironment(path, branch, devenv) {
    async.series([
        resolveCallback(changeDir, path),
        resolveCallback(gitCleanChanges),
        resolveCallback(gitCleanDirectory),
        resolveCallback(gitSwitchBranch, branch),
        resolveCallback(gitPull),
        resolveCallback(gitCleanDirectory),
        //resolveCallback(build, devenv, getProjectFilePath(path))
    ]);
}

function prepareSecondEnvironment(path, branch, devenv) {
    async.series([
        resolveCallback(changeDir, path),
        resolveCallback(gitCleanChanges),
        resolveCallback(gitCleanDirectory),
        resolveCallback(gitSwitchBranch, branch),
        resolveCallback(gitPull),
        resolveCallback(gitCleanDirectory),
        resolveCallback(build, devenv, getProjectFilePath(path)),
        //cleanPackages();
        //restorePackages(path);
        resolveCallback(build, devenv, getProjectFilePath(path))
    ]);
}

exports.prepareEnv = {
    prepareFirstEnvironment: prepareFirstEnvironment,
    prepareSecondEnvironment: prepareSecondEnvironment
};