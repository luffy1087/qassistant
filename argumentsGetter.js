var args = require('optimist').argv,
    readline = require('readline-sync');

function argumentsGetter(cfg) {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return interactiveArgumentsGetter(cfg);
    }
    //node index.js -y "development" -s "master" -p "VALENTINO" -d "Cart,Item" -c "y"
    return {
        mainRepoBranch: args["y"],
        repoBranch: args["s"],
        placeholderValueOrEmpty: args["p"],
        dlls: args["d"],
        canRemovePackagesMainRepo: args["c"] === 'y'
    };
}

function interactiveArgumentsGetter(cfg) {
    var isSecondRepoPath = cfg.patternOrPath.indexOf('{0}') === -1;
    var objectArgs = {};
    var questions = ['mainRepoBranch', 'canRemovePackagesMainRepo', 'repoBranch', 'placeholderValueOrEmpty', 'dlls'];
    
    if (isSecondRepoPath) { questions.splice(3, 1); }
    
    questions.forEach(function(argName) { objectArgs[argName] =  readline.question('Type the argument ' + argName + "\n"); });
    
    objectArgs.canRemovePackagesMainRepo = objectArgs.canRemovePackagesMainRepo === 'y';

    return objectArgs;
}

exports.argumentsGetter = argumentsGetter;