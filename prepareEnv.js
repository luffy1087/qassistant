var executeCommand = require('./commands').executeCommand;
    utils = require('./utils').utils,
    glob = require('glob'),
    currentPath = executeCommand('cd').stdout;

function changeDir(path) {
    var strCmd = utils.strFormat('cd {0}', path);
    executeCommand(strCmd);
}

function gitTasks(path, branch) {
    var gitCmdPattern = 'cd {0} && git checkout . && git clean -df && git checkout {1} && git pull';
    var strCmd = utils.strFormat(gitCmdPattern, path, branch);
    executeCommand(strCmd);
}

function cleanPackages() {
    executeCommand('rmdir /S /Q packages');
}

function build(devenv, project) {
    var strCmd = utils.strFormat('"{0}" {1} /rebuild', devenv, project);
    executeCommand(strCmd);
}

function restorePackages(path) {
    var strCmd = utils.strFormat('nuget restore {0}', path);
    executeCommand(strCmd);
}

function getProjectFilePath(path) {
    var files = glob.sync(utils.strFormat('{0}/*.sln', path));
    if (files && files.length == 1) {
        return files[0];
    }

    throw new Error('Error: Project not found in ' + path);
}

function prepareFirstEnvironment(path, branch, devenv) {
    gitTasks(path, branch);

    build(devenv, getProjectFilePath(path));
}

function prepareSecondEnvironment(path, branch) {
    changeDir(path);
    gitTasks(branch);
    cleanPackages();
    restorePackages(path);
    build(devenv, getProjectFilePath(path));
}

exports.prepareEnv = {
    prepareFirstEnvironment: prepareFirstEnvironment,
    prepareSecondEnvironment: prepareSecondEnvironment
};