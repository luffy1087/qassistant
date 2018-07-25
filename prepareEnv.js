var commands = require('./commands').commands;
    utils = require('./utils').utils,
    glob = require('glob'),
    async = require('async'),
    Path = require('path'),
    currentPath = process.cwd();

var c = require('child_process');

function changeDir(path) {
    console.log(path);
    process.chdir(path);
}

function gitSwitchBranchCmd(branch) {
    return utils.strFormat('git checkout {0}', branch);
}

function gitCleanChangesCmd() {
    return 'git checkout .';
}

function gitCleanDirectoryCmd() {
    return 'git clean -df';
}

function gitResetCmd() {
    return 'git reset --hard'
}

function gitPruneLocalCmd() {
    return "git gc --prune=now";
}

function gitPullCmd() {
    return 'git pull';
}

function cleanPackagesCmd() {
    return 'rmdir /S /Q packages';
}

function buildCmd(devenv, project) {
    return utils.strFormat('"{0}" "{1}" /rebuild', devenv, project);
}

function restorePackagesCmd(path) {
    return utils.strFormat('"{0}\\nuget" restore {1}', currentPath, path);
}

function getSolutionFile(path) {
    var files = glob.sync(utils.strFormat('{0}\\*.sln', path));
    if (files && files.length == 1) {
        return Path.resolve(files[0]);
    }

    throw new Error('Error: Project not found in ' + path);
}

function spawnTask(cmd, options) {
    return function(resolveTask) {
        commands.spawn(cmd, options, resolveTask);
    }
}

function execTask(getCommand) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function(resolveTask) {
        console.log(getCommand.apply(this, args));
        commands.exec(getCommand.apply(this, args), resolveTask);
    }
}

function nodeTask(callback) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function(resolveTask) {
        callback.apply(this, args);
        resolveTask();
    }
}

function taskOrDefault(shouldRun, callback) {
    if (!shouldRun) {
        return function(resolveTask) { resolveTask(); };
    }
    
    var args = Array.prototype.slice.call(arguments, 1);
    
    return function(resolveTask) {
        callback.apply(this, args);
        resolveTask();
    }
}

function prepareFirstEnvironment(path, branch, devenv) {
    var obj = {path: path, branch: branch, devenv };
    //one argument { path: path, branch: branch, devenv }
    async.series([
        nodeTask(changeDir, path),
        execTask(gitResetCmd),
        execTask(gitCleanChangesCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(gitSwitchBranchCmd, branch),//Update to origin (not local)
        taskOrDefault(obj.canCleanPackages, cleanPackagesCmd),
        //execTask(gitPruneLocalCmd),
        execTask(gitPullCmd),
        spawnTask(utils.strFormat('{0}\\nuget', currentPath), ['restore', path]),
        spawnTask(devenv, [getSolutionFile(path), "/rebuild"])
        //onFinishedSeries
    ]);
}

function prepareSecondEnvironment(path, branch, devenv) {
    async.series([
        nodeTask(changeDir, path),
        execTask(gitCleanChangesCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(gitResetCmd),
        execTask(gitSwitchBranchCmd, branch),
        execTask(gitPullCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(cleanPackagesCmd),
        spawnTask(restorePackagesCmd, path),
        spawnTask(build, devenv, getSolutionFile(path))
        //xml parser
        //onFinishedSeries
    ]);
}

exports.prepareEnv = {
    prepareFirstEnvironment: prepareFirstEnvironment,
    prepareSecondEnvironment: prepareSecondEnvironment
};