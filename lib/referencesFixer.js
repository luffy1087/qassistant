var fs = require('fs')
  , xml2js = require('xml2js')
  , xmldom = require('xmldom')
  , utils = require('../utils/utils')
  , path = require('path');

/* Region Get Files And Return Json  */

function onReceivingJsonsXml(env, resolve, jsonsXml) {
    //console.log(JSON.stringify(xmlJson));
    //packages.config must be aligned with new versions (e.g: Mongodb)
    //jsonsXml[].proj
    //jsonsXml[].xmlJson
    this.allXmlJson[env] = jsonsXml;
    this.csprojDirs[env] = jsonsXml.map(function(json) { return path.dirname(json.proj) });
    resolve();
}

function splitGroupsByName(xmlJson) {
    var splittedGroups = { references: [], indexes: { reference: 0 } };
    for (var i = 0, itemGroup; itemGroup = xmlJson.Project.ItemGroup[i]; i++) {
        if (!itemGroup.Reference) { continue; }

        splittedGroups.indexes.reference = i;
        splittedGroups.references = splittedGroups.references.concat(itemGroup.Reference);
    }

    return splittedGroups;
}

function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolve({ proj: file, projPath: path.dirname(file), xmlJson: json, xmlDoc: new xmldom.DOMParser().parseFromString(xml, 'text/xml'), groupsByName: splitGroupsByName(json) }); }
        
        reject();
        throw new Error('error raised parsing xml');
    });
}

function getXml(file, resolve, reject) {
    fs.readFile(file, function(err, result) {
        if (!err) { return void resolve({ proj: file, projPath: path.dirname(file), xmlDoc: new xmldom.DOMParser().parseFromString(result.toString(), 'text/xml') }); }
        
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

function changeCsproj(groupToCycle, callback) {
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 0); //first solution
    var isChanged = false;
    for (var i = 0, xmlJsonData; xmlJsonData = xmlJsonsData[i]; i++) {
        for (var index = 0, reference; reference = xmlJsonData.groupsByName[groupToCycle][index]; index++) {
            isChanged = callback(reference) || isChanged;
        }
    }
    
    return isChanged;
}

function reverseChangeCsproj(groupToCycle, callback) {
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 1); //second solution
    var isChanged = false;
    for (var i = 0, xmlJsonData; xmlJsonData = xmlJsonsData[i]; i++) {
        for (var index = 0, reference; reference = xmlJsonData.groupsByName[groupToCycle][index]; index++) {
            isChanged = callback(reference) || isChanged;
        }
    }
    
    return isChanged;
}

function xmlChangeCsproj(xmlFirstSolutionRef, firstProjPath) {
    var xmlJsonsData = this.allXmlJson.solution;
    var isChanged = false;
    for (var i = 0, xmlJsonData; xmlJsonData = xmlJsonsData[i]; i++) {
        var xmlDoc = xmlJsonData.xmlDoc;
        var references = xmlDoc.documentElement.getElementsByTagName('Reference');
        for (var index = 0, reference; reference = references[index]; index++) {
            var dll1 = xmlFirstSolutionRef.getAttribute('Include').split(',')[0];
            var dll2 = reference.getAttribute('Include').split(',')[0];
            if (dll1 === dll2) {
                var hintPath1 = reference.getElementsByTagName('HintPath')[0];
                var hintPath2 = xmlFirstSolutionRef.getElementsByTagName('HintPath')[0];
                if (hintPath1 && hintPath2) {
                    //console.log(hintPath1.firstChild.nodeValue);
                    //xmlDoc.documentElement.removeChild(hintPath1.firstChild);
                    //hintPath1.parentNode.removeChild(hintPath1.firstChild);
                    var textNode = xmlJsonData.xmlDoc.createTextNode(utils.strFormat('{0}\\{1}', firstProjPath, hintPath2.firstChild.nodeValue));
                    hintPath1.removeChild(hintPath1.childNodes[0]);
                    hintPath1.appendChild(textNode);
                    //hintPath2.appendChild(hintPath2.firstChild);
                    //hintPath1.firstChild.nodeValue = hintPath2.firstChild.nodeValue
                }
                //hintPath1[0].nodeValue = hintPath2[0].nodeValue;
            }
        }
    }
}

function tryChangeReference(reference, firstSolutionReference) {
    var includeObject = utils.referenceInfoToObject(reference.$.Include);
    var otherIncludeObject = utils.referenceInfoToObject(firstSolutionReference.$.Include);
    if (otherIncludeObject.Dll !== includeObject.Dll || otherIncludeObject.Version === includeObject.Version) {
        return false;
    }
    
    reference.HintPath = firstSolutionReference.HintPath;
    reference.$.Include = firstSolutionReference.$.Include;

    return true;
}

function reverseTryChangeReference(firstSolutionReference, firstSolutionPath, secondSolutionReference) {
    var firstSolutionReferenceObject = utils.referenceInfoToObject(firstSolutionReference.$.Include);
    var secondSolutionReferenceObject = utils.referenceInfoToObject(secondSolutionReference.$.Include);
    
    if (secondSolutionReferenceObject.Dll !== firstSolutionReferenceObject.Dll) {
        return false;
    }
    
    // if (firstSolutionReference.HintPath) {
    //     secondSolutionReference.HintPath = utils.strFormat('{0}\\{1}', firstSolutionPath, firstSolutionReference.HintPath);
    // }

    // if (firstSolutionReference.$.Include) {
    //     secondSolutionReference.$.Include = firstSolutionReference.$.Include;
    // }

    // if (secondSolutionReference.Private) {
    //     secondSolutionReference.Private = 'False';
    // }

    return !!firstSolutionReference.HintPath || !!firstSolutionReference.$.Include;
}

function writeXml() {
    var xmlBuilder = new xml2js.Builder({ renderOpts: { newline: '\r\n', pretty: true, indent: '  ' }, xmldec: { encoding: 'utf-8' } });
    var domParser = new xmldom.DOMParser();
    var xmlSerializer = new xmldom.XMLSerializer();
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 1); //second solution
    xmlJsonsData.forEach(function (xmlJsonData) {
        //var xml = xmlBuilder.buildObject(xmlJsonData.xmlJson);
        //var doc = domParser.parseFromString(xml, 'text/xml');
        //console.log(doc.documentElement.getElementsByTagName('Import')[0].getAttribute('Project')));
        //var imports = xmlJsonData.xmlDoc.documentElement.getElementsByTagName('Import');
        //for (var i = 1; i < imports.length; i++) {
            //var project = doc.documentElement.getElementsByTagName('Project')[0];
            //doc.documentElement.removeChild(imports[i]);
            //doc.documentElement.appendChild(imports[i]);
        //}
        var newXml = xmlSerializer.serializeToString(xmlJsonData.xmlDoc, 'text/xml');
        //console.log(newXml + '\r\n');
        fs.writeFile(xmlJsonData.proj, newXml);
    });
}

/* End Region Merge Json */

/* Region Public Methods */

function start(env, dlls, path, resolve) {
    utils.getProjectFiles(path, onGettingFiles.bind(this, env, dlls, resolve));
}

function merge(resolve) {
    //compute this.allXmlJson and create a new xml file
    var xmlBuilder = new xml2js.Builder({ renderOpts: { newline: '\r\n', pretty: true, indent: '  ' }, xmldec: { encoding: 'utf-8' } });
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 1); //second solution
    for (var i = 0, xmlJsonData, references, xml; xmlJsonData = xmlJsonsData[i]; i++) {
        references = xmlJsonData.xmlJson.Project.ItemGroup[xmlJsonData.groupsByName.indexes.reference].Reference;
        for (var refIndex = 0, reference; reference = references[refIndex]; refIndex++) {
            changeCsproj.call(this, 'references', tryChangeReference.bind(this, reference));
        }

        xml = xmlBuilder.buildObject(xmlJsonData.xmlJson);
        fs.writeFileSync(xmlJsonData.proj, xml);
    }
    resolve();
}

function reverseMerge(resolve) {
    //compute this.allXmlJson and create a new xml file
    var xmlBuilder = new xml2js.Builder({ renderOpts: { newline: '\r\n', pretty: true, indent: '  ' }, xmldec: { encoding: 'utf-8' } });
    var xmlJsonsData = getlXmlJsonDataByIndex.call(this, 0); //first solution
    var referencesToAdd = [];
    for (var i = 0, xmlJsonData, references, xml; xmlJsonData = xmlJsonsData[i]; i++) {
        references = xmlJsonData.xmlJson.Project.ItemGroup[xmlJsonData.groupsByName.indexes.reference].Reference;
        for (var refIndex = 0, reference; reference = references[refIndex]; refIndex++) {
            if (!reverseChangeCsproj.call(this, 'references', reverseTryChangeReference.bind(this, reference, xmlJsonData.projPath))) {
                referencesToAdd.push(reference);
            }
        }
    }

    writeXml.call(this);

    resolve();
}


function xmlMerge(resolve) {
        //compute this.allXmlJson and create a new xml file
        var xmlJsonsData = this.allXmlJson.mainSolution;
        for (var i = 0, xmlJsonData, references, xml; xmlJsonData = xmlJsonsData[i]; i++) {
            references = xmlJsonData.xmlDoc.documentElement.getElementsByTagName('Reference');
            for (var refIndex = 0, reference; reference = references[refIndex]; refIndex++) {
                xmlChangeCsproj.call(this, reference, xmlJsonData.projPath);
            }
        }
    
        writeXml.call(this);
    
        resolve();
}

/* End Region Public Methods */

function ReferencesFixer() {

}

ReferencesFixer.prototype.start = start;
ReferencesFixer.prototype.merge = merge;
ReferencesFixer.prototype.reverseMerge = reverseMerge;
ReferencesFixer.prototype.xmlMerge = xmlMerge;
ReferencesFixer.prototype.allXmlJson = {};
ReferencesFixer.prototype.csprojDirs = {};
module.exports = new ReferencesFixer();