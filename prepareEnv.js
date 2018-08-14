var commands = require('./commands')
  , async = require('async');

function changeDir(path) {
    process.chdir(path);
}

function gitSwitchBranchCmd(branch) {
    return this.utils.strFormat('git checkout {0}', branch);
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
    return this.utils.strFormat('rmdir /S /Q {0}', path);
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
        this.eventEmitter.once('onTaskEnd', function(data) {
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

function onFirstEnvironmentFinished(resolveTask) {
    this.eventEmitter.emit('onFirstEnvironmentFinished');
    resolveTask();
}

function onSecondEnvironmentFinished(resolveTask) {
    this.eventEmitter.emit('onSecondEnvironmentFinished');
    resolveTask();
}

function secondEnvironmentStater(resolveTask) {
    this.eventEmitter.once('onFirstEnvironmentFinished', resolveTask);
}

function getFilteredPackages() {

}

function prepareFirstEnvironment() {
    console.log('Current Path is: ' + this.currentPath);
    var solutionPath = this.utils.getSolutionFile(this.configuration.mainProjectPath);
    var packagesFolder = this.utils.searchForFolder(this.configuration.mainProjectPath, 'packages');
    async.series([
        nodeTask(changeDir, this.configuration.mainProjectPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd.bind(this), this.arguments.mainRepoBranch),
        taskOrDefault(this.arguments.canRemovePackagesMainRepo && packagesFolder, execCommandTask(cleanPackagesCmd.bind(this, packagesFolder))),
        execCommandTask(gitPullCmd),
        taskOrDefault(this.arguments.canRemovePackagesMainRepo, spawnTask(this.utils.strFormat('{0}\\nuget', this.currentPath), ['restore', solutionPath])),
        spawnTask(this.configuration.buildCommand, [solutionPath, "/rebuild"]),
        onFirstEnvironmentFinished.bind(this)
    ]);
}

function prepareSecondEnvironment() {
    var solutionPath = this.utils.getSolutionFile(this.arguments.repoPath);
    var packagesFolder = this.utils.searchForFolder(this.arguments.repoPath, 'packages');
    // var packagesConfigPath = this.utils.getPackagesConfigFile(args.repoPath);
    // var packagesDirPath = this.utils.searchForFolder(repoPath, args.packagesFolder);
    async.series([
        secondEnvironmentStater.bind(this),
        nodeTask(changeDir, this.arguments.repoPath),
        execCommandTask(gitResetCmd),
        execCommandTask(gitCleanChangesCmd),
        execCommandTask(gitCleanDirectoryCmd),
        execCommandTask(gitSwitchBranchCmd.bind(this), this.arguments.repoBranch),
        execCommandTask(cleanPackagesCmd.bind(this, packagesFolder)),
        execCommandTask(gitPullCmd),
        taskOrDefault(!this.arguments.shouldUpdatePackages, spawnTask(this.utils.strFormat('{0}\\nuget', this.currentPath), ['restore', solutionPath])),
        //taskOrDefault(this.arguments.shouldUpdatePackages, eventTask(filterPackages.bind(this), executePackagesToUpdate.bind(this, packagesDirPath))),
        spawnTask(this.configuration.buildCommand, [solutionPath, "/rebuild"]),
        onSecondEnvironmentFinished.bind(this)
    ]);
}

function PrepareEnv() {
    this.prepareFirstEnvironment = prepareFirstEnvironment;
    this.prepareSecondEnvironment = prepareSecondEnvironment;
}

module.exports = PrepareEnv;