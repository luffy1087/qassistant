var args = require('optimist').argv;
var readline = require('readline-sync');

function argumentsGetter() {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return void interactiveArgumentsGetter();
    }
    //node index.js "-y" "master" "-s" "reasease1" "-n" "moncler" "-p" "Cart,Item"
    return {
        yTosBranch: args["y"],
        storeBranch: args["s"],
        storeName: args["n"],
        plugins: args["p"]
    };
}

function interactiveArgumentsGetter() {
    var objectArgs = {};
    ['yTosBranch', 'storeBranch', 'storeName', 'plugins']
        .forEach(function(argName) {
            objectArgs[argName] =  readline.question('Type the argument ' + argName + "\n");
        });
    
    return objectArgs;
}

exports.argumentsGetter = argumentsGetter();