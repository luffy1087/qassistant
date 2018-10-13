var args = require('optimist').argv
  , readline = require('readline-sync')
  , utils = require('./utils/utils');

function argumentsGetter(cfg) {
    var numberOfArgumets = Object.keys(args).length - 2;
    if (numberOfArgumets == 0) {
        return interactiveArgumentsGetter.call(this, cfg);
    }
    //node index.js -f "y" -y "development" -c "y" -s "master" -u "y" -p "VALENTINO" -d "Cart,Item"
    return {
        canBuildMainProject: args['f'],
        mainRepoBranch: args['y'],
        canRemovePackagesMainRepo: args['c'] === 'y',
        repoBranch: args['s'],
        shouldUpdatePackages: args['u'] === 'y',
        placeholderValueOrEmpty: args["p"],
        dlls: args["d"],
        repoPath: utils.tryGetPathByPattern(cfg.patternOrPath, args["p"])
    };
}

function interactiveArgumentsGetter(cfg) {
    
    var canBuildMainProject = readline.question('Can build main project? y/n. default: y \n\n') !== 'n';
    var questions = [
        { n:'mainRepoBranch', q:'\nWhich is the branch name of the main project?\n\n', isBool: false, shouldAsk: canBuildMainProject },
        { n:'canRemovePackagesMainRepo', q:'\nShould I remove packages from the main project? y/n\n\n', isBool: true, shouldAsk: canBuildMainProject },
        { n:'repoBranch', q:'\nWhich is the brach name of the second project?\n\n', isBool: false, shouldAsk: cfg.patternOrPath.indexOf('{0}') > -1 },
        { n:'shouldUpdatePackages', q:'\nShould I update packages for the second project? y/n\n\n', isBool: true },
        { n:'placeholderValueOrEmpty', q:'\nType the value for the placeholder to build the path for the second project.\n\n', isBool: false },
        { n:'dlls', q:'\ntype a commna-saparated list of dlls to move.\n\n', isBool: false }
    ];

    var questionsObject = questions.reduce(function(accumulator, current) {
        if (typeof(current.shouldAsk) !== 'undefined' && !current.shouldAsk) { return accumulator;  }
        
        accumulator[current.n] = readline.question(current.q);
        accumulator[current.n] = current.isBool ? accumulator[current.n] === 'y' : accumulator[current.n];
        
        return accumulator;
    }, {});
    
    questionsObject.canBuildMainProject = canBuildMainProject;
    questionsObject.repoPath = utils.tryGetPathByPattern(cfg.patternOrPath, questionsObject.placeholderValueOrEmpty);

    return questionsObject;
}

module.exports = argumentsGetter;