var commands = require('./commands').commands;
    utils = require('./utils').utils,
    glob = require('glob'),
    async = require('async'),
    pathResolver = require('path'),
    currentPath = process.cwd();

function changeDir(path) {
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

function gitPullCmd() {
    return 'git pull';
}

function cleanPackagesCmd(path) {
    return utils.strFormat('rmdir /S /Q {0}', utils.searchForFolder(path, 'packages'));
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

function taskOrDefault(shouldRun, getCommand) {
    if (!shouldRun) {
        return function(resolveTask) { resolveTask(); };
    }
    
    var args = Array.prototype.slice.call(arguments, 2);
    
    return execTask(getCommand, args);
}

function onFirstEnvironmentFinished(args) {
    args.events.emit('onFirstEnvironmentFinished', args);
}

function onSecondEnvironmentFinished(args) {
    args.events.emit('onSecondEnvironmentFinished', args);
}

function prepareFirstEnvironment(args) {
    async.series([
        nodeTask(changeDir, args.mainProjectPath),
        execTask(gitResetCmd),
        execTask(gitCleanChangesCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(gitSwitchBranchCmd, args.mainRepoBranch),//Update to origin (not local)
        taskOrDefault(args.canRemovePackagesMainRepo, cleanPackagesCmd.bind(this, args.mainProjectPath)),
        execTask(gitPullCmd),
        spawnTask(utils.strFormat('{0}\\nuget', currentPath), ['restore', args.mainProjectPath]),
        spawnTask(args.devenvPath, [utils.getSolutionFile(args.mainProjectPath), "/rebuild"]),
        onFirstEnvironmentFinished.bind(this, args)
    ]);
}

function prepareSecondEnvironment(args) {
    async.series([
        nodeTask(changeDir, args.repoPath),
        execTask(gitResetCmd),
        execTask(gitCleanChangesCmd),
        execTask(gitCleanDirectoryCmd),
        execTask(gitSwitchBranchCmd, args.repoBranch),
        taskOrDefault(true, cleanPackagesCmd.bind(this, args.repoPath)),
        execTask(gitPullCmd),
        spawnTask(utils.strFormat('{0}\\nuget', currentPath), ['restore', args.repoPath]),
        spawnTask(args.devenvPath, [utils.getSolutionFile(args.repoPath), "/rebuild"]),
        onSecondEnvironmentFinished.bind(this, args)
    ]);
}

exports.prepareEnv = {
    prepareFirstEnvironment: prepareFirstEnvironment,
    prepareSecondEnvironment: prepareSecondEnvironment
};