var args = require('optimist').argv
  , readline = require('readline-sync')
  , utils = require('../utils/utils');

function argumentsGetter(cfg) {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return interactiveArgumentsGetter.call(this, cfg);
    }
    //node index.js -f "y" -y "development" -c "y" -s "master" -u "y" -p "VALENTINO" -d "Cart,Item"
    return {
        canBuildMainSolution: args['f'],
        mainSolutionBranch: args['y'],
        canRemovePackagesMainRepo: args['c'] === 'y',
        solutionBranch: args['s'],
        shouldUpdatePackages: args['u'] === 'y',
        solutionPlaceholder: args["p"],
        dlls: args["d"],
        solutionPath: utils.tryGetPathByPattern(cfg.solutionPatternOrPath, args["p"])
    };
}

function interactiveArgumentsGetter(cfg) {
    
    var canBuildMainSolution = readline.question('\nCan build main solusion? y/n. default: y \n') !== 'n';
    var questions = [
        { p:'mainSolutionBranch', q:'\nWhich is the branch name of the main solution?\n', shouldAsk: canBuildMainSolution },
        { p:'solutionBranch', q:'\nWhich is the brach name of the second solution?\n' },
        { p:'shouldUpdatePackages', q:'\nShould I update packages for the second solution? y/n\n', isBool: true },
        { p:'solutionPlaceholder', q:'\nType the value for the placeholder to build the path for the second solution.\n', shouldAsk: cfg.solutionPatternOrPath.indexOf('{0}') > -1},
        { p:'dlls', q:'\ntype a commna-saparated list of dlls to move.\n' }
    ];

    var answersObject = questions.reduce(function(accumulator, currentQuestion) {
        if (typeof(currentQuestion.shouldAsk) !== 'undefined' && !currentQuestion.shouldAsk) {
            return accumulator;
        }
        
        var answer = readline.question(currentQuestion.q);
        accumulator[currentQuestion.p] = currentQuestion.isBool ? answer === 'y' : answer.trim();
        
        return accumulator;
    }, {});
    
    answersObject.canBuildMainSolution = canBuildMainSolution;
    answersObject.solutionPath = utils.tryGetPathByPattern(cfg.solutionPatternOrPath, answersObject.solutionPlaceholder);

    return answersObject;
}

module.exports = argumentsGetter;