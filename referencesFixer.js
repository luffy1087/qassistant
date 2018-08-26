var fs = require('fs')
  , xml2js = require('xml2js');


function getJson(xml) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolveTask(null, json.ItemGroup[0].Reference); }
        
        throw new Error('error raised parsing xml');
    });
}

function getXml(file) {
    fs.readFile(file, function(err, result) {
        if (!err) { return void getJson.call(this, result.toString()); }
        
        throw new Error('Xml File not found');
    });
}

function onGettingFile(files) {
    var splittedDlls = this.arguments.dlls.split(',');
    files.filter(function(file) { return this.utils.stringMatchInArray(splittedDlls, file); }, this);
    for (var i = 0; file = files[i]; i++) {
        getXml.call(this, file);
    }
}

function fixReferences(path) {
    this.utils.getProjectFiles(path, onGettingFile.bind(this));
}

function ReferencesFixer() {
    this.fixReferences = fixReferences;
    this.allReferences = {};
}

module.exports = ReferencesFixer;