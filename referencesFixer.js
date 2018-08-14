var xml2js = require('xml2js');

function ReferencesFixer() {
    var csprojFile = this.utils.searchForFile(this.arguments.repoPath, '*.csproj');
}

module.exports = ReferencesFixer;