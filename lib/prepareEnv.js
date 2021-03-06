var commands = require('../utils/commands')
  , utils = require('../utils/utils')
  , async = require('async')
  , referencesFixer = require('./referencesFixer');

function changeDir(path) {
    console.log('Changing dir to ' + path);
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
    return utils.strFormat('rmdir /S /Q {0}', path);
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

function task(callback) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function(resolveTask) {
        callback.apply(this, args);
        resolveTask();
    };
}

function eventTask(task, onTaskEnd) {
    
    return function(resolveTask) {
        this.eventEmitter.once('onTaskEnd', function(data) {
            onTaskEnd(data, resolveTask);
        });

        task();
    }.bind(this);
}

function taskOrDefault(shouldRun, task) {
    if (!shouldRun) {
        return function(resolveTask) { resolveTask(); };
    }
    
    return function(resolveTask) {
       task(resolveTask);
    };
}

function onFirstSolutionTasksFinished(resolveTask) {
    this.eventEmitter.emit('onFirstSolutionTasksFinished');
    
    if (resolveTask) {
        resolveTask();
    }
}

function onSecondSolutionTasksFinished(resolveTask) {
    this.eventEmitter.emit('onSecondSolutionTasksFinished');
    
    if (resolveTask) {
        resolveTask();
    }
}

function firstSolitionTasksWaiter(resolveTask) {
    this.eventEmitter.once('onFirstSolutionTasksFinished', resolveTask);
}

function prepareFirstEnvironment() {
    if (!this.arguments.canBuildMainSolution) {
        return void onFirstSolutionTasksFinished.call(this);
    }

    var slnFilePath = utils.getSolutionFile(this.configuration.mainSolution);
    var packagesFolder = utils.searchForFolder(this.configuration.mainSolution, this.configuration.packagesFolder);
    async.series([
        task(changeDir, this.configuration.mainSolution),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd.bind(this), this.arguments.mainSolutionBranch),
        execCommandTask(gitPullCmd),
        taskOrDefault(!!packagesFolder, execCommandTask(cleanPackagesCmd.bind(this, packagesFolder))),
        spawnTask(utils.strFormat('{0}\\{1}\\nuget', this.currentPath, 'bin'), ['restore', slnFilePath]),
        spawnTask(this.configuration.buildCommand, [slnFilePath, "/rebuild"]),
        onFirstSolutionTasksFinished.bind(this)
    ]);
}

function prepareSecondEnvironment() {
    var slnFilePath = utils.getSolutionFile(this.arguments.solutionPath);
    var packagesFolder = utils.searchForFolder(this.arguments.solutionPath, this.configuration.packagesFolder);
    async.series([
        firstSolitionTasksWaiter.bind(this),
        task(changeDir, this.arguments.solutionPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd.bind(this), this.arguments.solutionBranch),
        taskOrDefault(!!packagesFolder, execCommandTask(cleanPackagesCmd.bind(this, packagesFolder))),
        execCommandTask(gitPullCmd),
        spawnTask(utils.strFormat('{0}\\{1}\\nuget', this.currentPath, 'bin'), ['restore', slnFilePath]),
        //ReferenceFixer
        spawnTask(this.configuration.buildCommand, [slnFilePath, "/rebuild"]),
        onSecondSolutionTasksFinished.bind(this)
    ]);
}

function PrepareEnv() {
    this.prepareFirstEnvironment = prepareFirstEnvironment;
    this.prepareSecondEnvironment = prepareSecondEnvironment;
}

module.exports = PrepareEnv;