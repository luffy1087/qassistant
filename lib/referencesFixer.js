var fs = require('fs')
  , xml2js = require('xml2js')
  , utils = require('../utils/utils');

/* Region Get Files And Return Json  */

function onReceivingJsonsXml(env, resolve, jsonsXml) {
    //console.log(JSON.stringify(xmlJson));
    //packages.config must be aligned with new versions (e.g: Mongodb)
    //jsonsXml[].proj
    //jsonsXml[].xmlJson
    this.allXmlJson[env] = jsonsXml;
    this.csprojDirs[env] = jsonsXml.map(function(json) { return json.proj.split('\\').slice(0, -1).join('\\'); });
    resolve();
}

function splitGroupsByName(xmlJson) {
    var splittedGroups = { references: [], indexes: { reference: 0 } };
    for (var i = 0, itemGroup; itemGroup = xmlJson.Project.ItemGroup[i]; i) {
        if (!itemGroup.Reference) { continue; }

        splitGroupsByName.indexes.reference = i;
        splittedGroups.references.concat(itemGroup.Reference);
    }
}

function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolve({ proj: file, xmlJson: json, groupsByName: splitGroupsByName(json) } ); }
        
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
    if (dlls && dlls.constructor === Array && dlls.length > 0) {
        files = files.filter(function(file) { return utils.stringMatchInArray(dlls, file); }, this);
    }
    
    var promises = [];
    for (var i = 0; file = files[i]; i++) {
        promises.push(new Promise(function(resolve, reject) { getXml.call(this, file, resolve, reject); }));
    }
    
    Promise.all(promises).then(onReceivingJsonsXml.bind(this, env, resolve));
}

/* End Region Get Files And Retun Json */

/* Region Merge Json */

//Get the the references by index. 0: first, 1: second
function getlXmlJsonDataByIndex(index) {
    return this.allXmlJson[Object.keys(this.allXmlJson)[index]];
}

//string to object
function convertStringToObject(includeString) {
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

function changeCsproj(groupToCycle, callback) {
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 0);
    for (var i = 0, xmlJsonData; xmlJsonData = xmlJsonsData[i]; i++) {
        for (var index = 0, item; item = xmlJsonData.groupsByName[groupToCycle][index]; index++) {
            callback(item, xmlJsonData.proj);
        }
    }   
}

function tryChangeReference(reference, otherSolutionReference) {
    var includeObject = convertStringToObject(reference.$.Include);
    var otherIncludeObject = convertStringToObject(otherSolutionReference.$.Include);
    
    if (otherIncludeObject.Dll !== includeObject.Dll) { return; }
    
    if (otherIncludeObject.Version !== includeObject.Version) {
        reference.Hint = otherIncludeObject.Hint;
        reference.$.Include = otherIncludeObject.$.Include;
    }
}

/* End Region Merge Json */

/* Region Public Methods */

function start(env, dlls, path, resolve) {
    utils.getProjectFiles(path, onGettingFiles.bind(this, env, dlls, resolve));
}

function merge(resolve) {
    //compute this.allXmlJson and create a new xml file
    var xmlBuilder = xml2js.Builder();
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 1); //second project
    for (var i = 0, xmlJsonData, references, referencesIndex, xml; xmlJsonData = xmlJsonsData[i]; i++) {
        referencesIndex = xmlJsonData.groupsByName.indexes.reference;
        references = xmlJsonData.Project.ItemGroup[referencesIndex];
        for (var refIndex = 0, reference; reference = references[refIndex]; refIndex++) {
            changeCsproj('reference', tryChangeReference.bind(reference));
        }

        xml = xmlBuilder.buildObject(xmlJsonData.xmlJson);
        fs.writeFile(xmlJsonData.proj, xml, function(err) {
            if (!err) { return; }
            
            console.log(utils.strFormat('Error writing file {0}', xmlJsonData.proj));
        });
    }
    resolve();
}

/* End Region Public Methods */

function ReferencesFixer() {

}

ReferencesFixer.prototype.start = start;
ReferencesFixer.prototype.merge = merge;
ReferencesFixer.prototype.allXmlJson = {};
ReferencesFixer.prototype.csprojDirs = {};
module.exports = new ReferencesFixer();