var fs = require('fs')
  , xml2js = require('xml2js')
  , stringMatchInArray = require('./utils/utils').stringMatchInArray;

function onReceivingReferences(env, resolve, referencesArray) {
    //console.log(JSON.stringify(referencesArray));
    //packages.conf must be aligned with new versions (e.g: Mongodb)
    //referencesArray[].dll
    //referencesArray[].references
    this.allReferences[env] = referencesArray;
    resolve();
}

function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolve({ proj: file, references: json.Project.ItemGroup[0].Reference } ); }
        
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

function onGettingFile(env, dlls, resolve, files) {
    if (typeof(dlls) !== 'string') { throw new Error('Dlls must be a string'); }

    var splittedDlls = dlls.split(',');
    var promises = [];
    files.filter(function(file) { return stringMatchInArray(splittedDlls, file); }, this);
    
    for (var i = 0; file = files[i]; i++) {
        promises.push(new Promise(function(resolve, reject) { getXml.call(this, file, resolve, reject); }));
    }
    
    Promise.all(promises).then(onReceivingReferences.bind(this, env, resolve));
}

function start(env, dlls, path, resolve) {
    this.utils.getProjectFiles(path, onGettingFile.bind(this, env, dlls, resolve));
}

function merge() {
    //compute this.allReferences and create a create a new xml file
}

function ReferencesFixer() {

}

ReferencesFixer.prototype.start = start;
ReferencesFixer.prototype.merge = merge;
ReferencesFixer.prototype.allReferences = {};
module.exports = new ReferencesFixer();