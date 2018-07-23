var commands = require('./commands').commands;
    utils = require('./utils').utils,
    glob = require('glob'),
    async = require('async');

function changeDirCmd(path) {
    return utils.strFormat('cd {0}', path);
}

function gitCleanChangesCmd() {
    return 'git checkout .';
}

function gitCleanDirectoryCmd() {
    return 'git clean -df';
}

function gitSwitchBranchCmd(branch) {
    return utils.strFormat('git checkout {0}', branch);
}

function gitPullCmd() {
    return 'git pull';
}

function cleanPackagesCmd() {
    return 'rmdir /S /Q packages';
}

function buildCmd(devenv, project) {
    return utils.strFormat('"{0}" {1} /rebuild', devenv, project);
}

function restorePackagesCmd(path) {
    return utils.strFormat('nuget restore {0}', path);
}

function getProjectFilePath(path) {
    var files = glob.sync(utils.strFormat('{0}/*.sln', path));
    if (files && files.length == 1) {
        return files[0];
    }

    throw new Error('Error: Project not found in ' + path);
}

function spawnTask(getCommand) {
    var args = Array.prototype.slice.call(arguments, 1);
   
    return function(resolveTask) {
        commands.spawn(getCommand.apply(this, args), resolveTask);
    }
}

function execTask(getCommand) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function(resolveTask) {
        commands.exec(getCommand.apply(this, args), resolveTask);
    }
}

function prepareFirstEnvironment(path, branch, devenv) {
    async.series([
        execTask(changeDirCmd, path),
        execTask(gitCleanChangesCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(gitSwitchBranchCmd, branch),
        execTask(gitPullCmd),
        execTask(gitCleanDirectoryCmd),
        //spawnTask(buildCmd, devenv, getProjectFilePath(path))
        //onFinishedSeries
    ]);
}

function prepareSecondEnvironment(path, branch, devenv) {
    async.series([
        execTask(changeDirCmd, path),
        execTask(gitCleanChangesCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(gitSwitchBranchCmd, branch),
        execTask(gitPullCmd),
        execTask(gitCleanDirectoryCmd),
        //cleanPackagesCmd(); //exec
        //restorePackagesCmd(path); //spawn
        spawnTask(build, devenv, getProjectFilePath(path))
        //onFinishedSeries
    ]);
}

exports.prepareEnv = {
    prepareFirstEnvironment: prepareFirstEnvironment,
    prepareSecondEnvironment: prepareSecondEnvironment
};