var fs = require('fs')
  , xml2js = require('xml2js')
  , utils = require('./utils/utils');

function onReceivingJsonsXml(env, resolve, jsonsXml) {
    //console.log(JSON.stringify(xmlJson));
    //packages.conf must be aligned with new versions (e.g: Mongodb)
    //jsonsXml[].proj
    //jsonsXml[].xmlJson
    this.allXmlJson[env] = jsonsXml;
    resolve();
}

function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolve({ proj: file, xmlJson: json } ); }
        
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
    files.filter(function(file) { return utils.stringMatchInArray(splittedDlls, file); }, this);
    
    for (var i = 0; file = files[i]; i++) {
        promises.push(new Promise(function(resolve, reject) { getXml.call(this, file, resolve, reject); }));
    }
    
    Promise.all(promises).then(onReceivingJsonsXml.bind(this, env, resolve));
}

//Get the the references by index. 0: first, 1: second
function getlXmlJsonDataByIndex(index) {
    return this.allXmlJson[Object.keys(this.allXmlJson)[index]];
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

function referencesMerger(reference, includeObject) {
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 0);
    for (var i = 0, xmlJsonData, otherRerences; xmlJsonData = xmlJsonsData[i]; i++) {
        otherRerences = xmlJsonData.xmlJson.Project.ItemGroup[0].Reference || [];
        for (var ii = 0, otherReference; otherReference = otherRerences[ii]; ii++) {
            var otherIncludeObject  = includeToObject(otherReference.$.Include);
            if (otherIncludeObject.Dll == includeObject.Dll && otherIncludeObject.Version !== includeObject.Version) {
                reference.Hint = otherIncludeObject.Hint;
                reference.$.Include = otherIncludeObject.$.Include;
                return;
            }
        }
    }
}

function start(env, dlls, path, resolve) {
    utils.getProjectFiles(path, onGettingFiles.bind(this, env, dlls, resolve));
}

function merge() {
    //compute this.allXmlJson and create a new xml file
    var xmlBuilder = xml2js.Builder();
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 1);
    for (var i = 0, xmlJsonData, references, xml; xmlJsonData = xmlJsonsData[i]; i++) {
        references = xmlJsonData.xmlJson.Project.ItemGroup[0].Reference || [];
        for (var ii = 0, reference; reference = references[ii]; ii++) {
            referencesMerger(reference, includeToObject(reference.$.Include));
        }

        xml = xmlBuilder.buildObject(xmlJsonData.xmlJson);
        fs.writeFile(xmlJsonData.proj, xml, function(err) {
            if (err) {
                console.log(utils.strFormat('Error writing file {0}', xmlJsonData.proj));
            }
        });
    }
}

function ReferencesFixer() {

}

ReferencesFixer.prototype.start = start;
ReferencesFixer.prototype.merge = merge;
ReferencesFixer.prototype.allXmlJson = {};
module.exports = new ReferencesFixer();