var commands = require('./commands').commands;
    utils = require('./utils').utils,
    glob = require('glob'),
    async = require('async');

function changeDir(path) {
    return commands.exec(utils.strFormat('cd {0}', path));
}

function gitCleanChanges() {
    return commands.exec('git checkout .');
}

function gitCleanDirectory() {
    return commands.exec('git clean -df');
}

function gitSwitchBranch(branch) {
    return commands.exec(utils.strFormat('git checkout {0}', branch));
}

function gitPull() {
    return commands.exec('git pull');
}

function gitTasks(path, branch) {
    var gitCmdPattern = 'cd {0} && git checkout . && git clean -df && git checkout {1} && git pull';
    var strCmd = utils.strFormat(gitCmdPattern, path, branch);
    
    return commands.exec(strCmd);
}

function cleanPackages() {
    commands.exec('rmdir /S /Q packages');
}

function build(devenv, project) {
    var strCmd = utils.strFormat('"{0}" {1} /rebuild', devenv, project);
    
    return commands.spawn(strCmd);
}

function restorePackages(path) {
    var strCmd = utils.strFormat('nuget restore {0}', path);
    
    return commands.spawn(strCmd);
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

function execTask(task) {
    var args = Array.prototype.slice.call(arguments, 1);
   
    return function(resolve) {
        task();
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