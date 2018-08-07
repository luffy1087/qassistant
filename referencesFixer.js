var utils = require('./utils').utils,
    xml2js = require('xml2js');

function referenceFixer(args) {
    var csprojFile = utils.searchForFile(args.repoPath, '*.csproj');
}

exports.referenceFixer = referenceFixer;