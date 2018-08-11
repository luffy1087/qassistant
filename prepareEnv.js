var commands = require('./commands').commands;
    utils = require('./utils').utils,
    glob = require('glob'),
    async = require('async'),
    pathResolver = require('path'),
    packagesReader = require('./packagesReader'),
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

function executePackagesToUpdate(packagesDirPath, packages, resolveTask) {
    var nugetPath = utils.strFormat('{0}\\nuget', currentPath);
    var series = [];
    for (var i = 0, package; package = packages[i]; i++) {
        series.push(spawnTask(nugetPath, ['install', package, '-OutputDirectory', packagesDirPath] ));
    }
    series.push(resolveTask);
    async.series(series);
}

function spawnTask(cmd, options) {
    return function(resolveTask) {
        commands.spawn(cmd, options, resolveTask);
    };
}

function execCommandTask(getCommand) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function(resolveTask) {
        commands.exec(getCommand.apply(this, args), resolveTask);
    };
}

function nodeTask(callback) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function(resolveTask) {
        callback.apply(this, args);
        resolveTask();
    };
}

function eventTask(task, onTaskEnd) {
    
    return function(resolveTask) {
        this.args.events.once('onTaskEnd', function(data) {
            onTaskEnd(data, resolveTask);
        });

        task();
    };
}

function taskOrDefault(shouldRun, task) {
    if (!shouldRun) {
        return function(resolveTask) { resolveTask(); };
    }
    
    return function(resolveTask) {
       task(resolveTask);
    };
}

function onFirstEnvironmentFinished(args) {
    args.events.emit('onFirstEnvironmentFinished', args);
}

function onSecondEnvironmentFinished(args) {
    args.events.emit('onSecondEnvironmentFinished', args);
}

function prepareFirstEnvironment(args) {
    var solutionPath = utils.getSolutionFile(args.mainProjectPath);
    async.series([
        nodeTask(changeDir, args.mainProjectPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd, args.mainRepoBranch),
        taskOrDefault(args.canRemovePackagesMainRepo, execCommandTask(cleanPackagesCmd.bind(this, args.mainProjectPath))),
        execCommandTask(gitPullCmd),
        taskOrDefault(args.canRemovePackagesMainRepo, spawnTask(utils.strFormat('{0}\\nuget', currentPath), ['restore', solutionPath])),
        spawnTask(args.devenvPath, [solutionPath, "/rebuild"]),
        onFirstEnvironmentFinished.bind(this, args)
    ]);
}

function prepareSecondEnvironment(args) {
    var reader = new packagesReader(args);
    var solutionPath = utils.getSolutionFile(args.repoPath);
    var packagesConfigPath = utils.getPackagesConfigFile(args.repoPath);
    var packagesDirPath = utils.searchForFolder(repoPath, args.packagesFolder);
    async.series([
        nodeTask(changeDir, args.repoPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd, args.repoBranch),
        taskOrDefault(true, cleanPackagesCmd.bind(this, args.repoPath)),
        execCommandTask(gitPullCmd),
        taskOrDefault(!args.shouldUpdatePackages, spawnTask(utils.strFormat('{0}\\nuget', currentPath), ['restore', solutionPath])),
        taskOrDefault(args.shouldUpdatePackages, eventTask(reader.readAndFilterPackages.bind(this, packagesConfigPath), executePackagesToUpdate.bind(this, packagesDirPath))),
        spawnTask(args.devenvPath, [solutionPath, "/rebuild"]),
        onSecondEnvironmentFinished.bind(this, args)
    ]);
}

exports.prepareEnv = {
    prepareFirstEnvironment: prepareFirstEnvironment,
    prepareSecondEnvironment: prepareSecondEnvironment
};