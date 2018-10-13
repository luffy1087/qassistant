var commands = require('./utils/commands')
  , utils = require('./utils/utils')
  , async = require('async')
  , referencesFixer = require('./referencesFixer');

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

function syncTask(callback) {
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

function onFirstEnvironmentFinished(resolveTask) {
    this.eventEmitter.emit('onFirstEnvironmentFinished');
    
    if (resolveTask) {
        resolveTask();
    }
}

function onSecondEnvironmentFinished(resolveTask) {
    this.eventEmitter.emit('onSecondEnvironmentFinished');
    
    if (resolveTask) {
        resolveTask();
    }
}

function secondEnvironmentStater(resolveTask) {
    this.eventEmitter.once('onFirstEnvironmentFinished', resolveTask);
}

function prepareFirstEnvironment() {
    if (!this.arguments.canBuildMainProject) {
        return void onFirstEnvironmentFinished();
    }

    var solutionPath = utils.getSolutionFile(this.configuration.mainProjectPath);
    var packagesFolder = utils.searchForFolder(this.configuration.mainProjectPath, this.configuration.packagesFolder);
    async.series([
        syncTask(changeDir, this.configuration.mainProjectPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd.bind(this), this.arguments.mainRepoBranch),
        execCommandTask(cleanPackagesCmd.bind(this, packagesFolder)),
        execCommandTask(gitPullCmd),
        taskOrDefault(this.arguments.canRemovePackagesMainRepo, spawnTask(utils.strFormat('{0}\\nuget', this.currentPath), ['restore', solutionPath])),
        spawnTask(this.configuration.buildCommand, [solutionPath, "/rebuild"]),
        onFirstEnvironmentFinished.bind(this)
    ]);
}

function prepareSecondEnvironment() {
    var solutionPath = utils.getSolutionFile(this.arguments.repoPath);
    var packagesFolder = utils.searchForFolder(this.arguments.repoPath, this.configuration.packagesFolder);
    var packagesConfigPath = utils.getPackagesConfigFile(this.arguments.repoPath);
    async.series([
        secondEnvironmentStater.bind(this),
        syncTask(changeDir, this.arguments.repoPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd.bind(this), this.arguments.repoBranch),
        taskOrDefault(!!packagesFolder, execCommandTask(cleanPackagesCmd.bind(this, packagesFolder))),
        execCommandTask(gitPullCmd),
        spawnTask(utils.strFormat('{0}\\nuget', this.currentPath), ['restore', solutionPath]),
        //ReferenceFixer
        spawnTask(this.configuration.buildCommand, [solutionPath, "/rebuild"]),
        onSecondEnvironmentFinished.bind(this)
    ]);
}

function PrepareEnv() {
    this.prepareFirstEnvironment = prepareFirstEnvironment;
    this.prepareSecondEnvironment = prepareSecondEnvironment;
}

module.exports = PrepareEnv;