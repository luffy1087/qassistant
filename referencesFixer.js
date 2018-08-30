var fs = require('fs')
  , xml2js = require('xml2js');

function onReceivingReferences(env, referencesArray) {
    //referencesArray.dll
    //referencesArray.references
}

function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolve(null, { dll: file.replace('.csproj', ''), references: json.ItemGroup[0].Reference } ); }
        
        reject();
        throw new Error('error raised parsing xml');
    });
}

function getXml(file, resolve, reject) {
    fs.readFile(file, function(err, result) {
        if (!err) { return void getJson.call(this, file, result.toString(), resolve, reject); }
        
        reject();
        throw new Error('Xml File not found');
    });
}

function onGettingFile(env, files) {
    var splittedDlls = this.arguments.dlls.split(',');
    var promises = [];
    files.filter(function(file) { return this.utils.stringMatchInArray(splittedDlls, file); }, this);
    
    for (var i = 0; file = files[i]; i++) {
        promises.push(new Promise(function(resolve, reject) { getXml.call(this, file, resolve, reject); }));
    }
    
    Promise.all(promises).then(onReceivingReferences.bind(this, env));
}

function start(env, path) {
    this.utils.getProjectFiles(path, onGettingFile.bind(this, env));
}

function ReferencesFixer() {
    this.start = start;
    this.allReferences = {};
}

module.exports = ReferencesFixer;