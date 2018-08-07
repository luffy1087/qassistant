var utils = require('./utils').utils,
    jsDOM = require('jsdom');

function referenceFixer(args) {
    var csprojFile = utils.searchForFile(args.repoPath, '*.csproj');
}

exports.referenceFixer = referenceFixer;