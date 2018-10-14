var fs = require('fs')
  , xml2js = require('xml2js')
  , stringMatchInArray = require('./utils/utils').stringMatchInArray;

function onReceivingReferences(env, resolve, referencesArray) {
    //console.log(JSON.stringify(referencesArray));
    //packages.conf must be aligned with new versions (e.g: Mongodb)
    //referencesArray[].proj
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

function onGettingFiles(env, dlls, resolve, files) {
    if (typeof(dlls) !== 'string') { throw new Error('Dlls must be a string'); }

    var splittedDlls = dlls.split(',');
    var promises = [];
    files.filter(function(file) { return stringMatchInArray(splittedDlls, file); }, this);
    
    for (var i = 0; file = files[i]; i++) {
        promises.push(new Promise(function(resolve, reject) { getXml.call(this, file, resolve, reject); }));
    }
    
    Promise.all(promises).then(onReceivingReferences.bind(this, env, resolve));
}

//Get the the references by index. 0: first, 1: second
function getReferencesByIndex(index) {
    return this.allReferences[Object.keys(this.allReferences)[index]]; 
}

//string to object
function includeToObject(includeString) {
    var info = includeString.split(',') || [];
    var objectToReturn = {};
    for (var i = 0, currentInfo, equalsSignIndex;  currentInfo = info[i]; i++) {
        currentInfo = currentInfo.trim();
        if (currentInfo.indexOf('=') === -1) {
            objectToReturn.Dll = currentInfo;
            continue;
        }

        equalsSignIndex = currentInfo.indexOf("=");
        objectToReturn[currentInfo.substring(0, equalsSignIndex)] = currentInfo.substring(equalsSignIndex+1);
    }

    return objectToReturn;
}

function compareReference(reference, includeObject) {
    var firstProjectReference = getReferencesByIndex.call(this, 0);
    for (var i = 0; i < firstProjectReference.length; i++) {
        for (var ii = 0, cmp_reference; cmp_reference = firstProjectReference.references[ii]; ii++) {
            var cmp_include  = includeToObject(cmp_reference.$.Include);
            if (cmp_include.Dll == includeObject.Dll && cmp_include.Version !== includeObject.Version) {
                return void (reference.Hint = cmp_include.Hint);
            }
        }
    }
}

function start(env, dlls, path, resolve) {
    this.utils.getProjectFiles(path, onGettingFiles.bind(this, env, dlls, resolve));
}

function merge() {
    //compute this.allReferences and create a new xml file
    var targetProjectsReferences = getReferencesByIndex.call(this, 1);
    for (var i = 0; i < targetProjectsReferences.length; i++) {
        for (var ii = 0, reference; reference = targetProjectsReferences.references[ii]; ii++) {
            compareReference(reference, includeToObject(reference.$.Include));
        }
    }
}

function ReferencesFixer() {

}

ReferencesFixer.prototype.start = start;
ReferencesFixer.prototype.merge = merge;
ReferencesFixer.prototype.allReferences = {};
module.exports = new ReferencesFixer();