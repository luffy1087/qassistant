var args = require('optimist').argv,
    readline = require('readline-sync');

function argumentsGetter() {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return interactiveArgumentsGetter();
    }
    //node index.js "-y" "master" "-s" "reasease1" "-n" "moncler" "-p" "Cart,Item"
    return {
        mainProjBranch: args["y"],
        secondProjBranch: args["s"],
        secondProjName: args["n"],
        dlls: args["p"]
    };
}

function interactiveArgumentsGetter() {
    var objectArgs = {};
    ['mainProjBranch', 'secondProjBranch', 'secondProjName', 'dlls']
        .forEach(function(argName) { objectArgs[argName] =  readline.question('Type the argument ' + argName + "\n"); });
    
    return objectArgs;
}

exports.argumentsGetter = argumentsGetter;