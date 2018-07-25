var args = require('optimist').argv,
    readline = require('readline-sync');

function argumentsGetter(cfg) {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return interactiveArgumentsGetter();
    }
    //node index.js "-y" "development" "-s" "master" "-n" "VALENTINO" "-p" "Cart,Item" -c "y"
    return {
        mainRepoBranch: args["y"],
        repoBranch: args["s"],
        secondRepoNameOrPattern: args["n"],
        dlls: args["p"],
        canRemovePackagesMainRepo: args["c"] === 'y'
    };
}

function interactiveArgumentsGetter(cfg) {
    var isSecondRepoPath = cfg.patternOrPath.indexOf('{0}') === -1;
    var objectArgs = {};
    var questions = ['mainRepoBranch', 'canRemovePackagesMainRepo', 'repoBranch', 'secondRepoNameOrPattern', 'dlls'];
    
    if (isSecondRepoPath) { questions.splice(3, 1); }
    
    questions.forEach(function(argName) { bjectArgs[argName] =  readline.question('Type the argument ' + argName + "\n"); });
    
    objectArgs.canRemovePackagesMainRepo = objectArgs.canRemovePackagesMainRepo === 'y';

    return objectArgs;
}

exports.argumentsGetter = argumentsGetter;