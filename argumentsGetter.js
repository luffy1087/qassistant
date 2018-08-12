var args = require('optimist').argv
  , readline = require('readline-sync');

function argumentsGetter(cfg) {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return interactiveArgumentsGetter.call(this, cfg);
    }
    //node index.js -y "development" -s "master" -p "VALENTINO" -d "Cart,Item" -c "y"
    return {
        mainRepoBranch: args['y'],
        canRemovePackagesMainRepo: args['c'] === 'y',
        repoBranch: args['s'],
        shouldUpdatePackages: args['u'] === 'y',
        placeholderValueOrEmpty: args["p"],
        dlls: args["d"],
        repoPath: this.utils.tryGetPathByPattern(cfg.patternOrPath, args["p"])
    };
}

function interactiveArgumentsGetter(cfg) {
    var isSecondRepoPath = cfg.patternOrPath.indexOf('{0}') > -1;
    var objectArgs = {};
    objectArgs.mainRepoBranch = readline.question('Which is the branch name of the main project?\n');
    objectArgs.canRemovePackagesMainRepo = readline.question('Should I remove packages from the main project? y/n\n') === 'y';
    objectArgs.repoBranch = readline.question('Which is the brach name of the second project?\n');
    objectArgs.shouldUpdatePackages = readline.question('Should I update packages for the second project? y/n\n') === 'y';
    if (isSecondRepoPath) {
        objectArgs.placeholderValueOrEmpty = readline.question('Type the value for the placeholder to build the path for the second project.\n');
    }
    objectArgs.dlls = readline.question('type a commna-saparated list of dlls to move.\n');
    objectArgs.repoPath = this.utils.tryGetPathByPattern(cfg.patternOrPath, objectArgs.placeholderValueOrEmpty);

    return objectArgs;
}

module.exports = argumentsGetter;