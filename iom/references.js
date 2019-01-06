var fs = require('fs')
  , xmldom = require('xmldom')
  , utils = require('../utils/utils')
  , loadCsproj = require('./iom/loadCsproj');

/* Region Get Files And Return Xml  */

function onReceivingXmls(env, resolve, xmls) {
    //packages.config must be aligned with new versions (e.g: Mongodb)
    //xmls[].proj
    //xmls[].projPath
    //xmls[].xmlDoc
    //xmls[].assemblyName
    this.solutions[env] = xmls;
    this.csprojDirs[env] = xmls.map(function(xml) { return xml.projPath });
    resolve();
}

function onGettingFiles(env, dlls, resolve, files) {
    if (dlls && dlls.constructor === Array && dlls.length > 0) {
        files = files.filter(function(file) { return utils.stringMatchInArray(dlls, file); }, this);
    }
    
    var promises = [];
    for (var i = 0; file = files[i]; i++) {
        promises.push(new Promise(function(resolve, reject) { new loadCsproj(file, resolve, reject); }));
    }
    
    Promise.all(promises).then(onReceivingXmls.bind(this, env, resolve));
}

/* Region Merge Xml */

function writeXmls() {
    var xmlSerializer = new xmldom.XMLSerializer();
    var solutionData = this.solutions.secondSolution;

    for (var index = 0, csproj, generatedXml; csproj = solutionData[index]; index++) {
        generatedXml = xmlSerializer.serializeToString(csproj.xmlDoc, 'text/xml');
        fs.writeFile(csproj.proj, generatedXml);
    }
}

function changeReferencePath(xmlDoc, xmlHintPth, referencePath) {
    var xmlTextNode = xmlDoc.createTextNode(referencePath);
    //Remove TextNode Representing The Old Path
    xmlHintPth.removeChild(xmlHintPth.childNodes[0]);
    //Add A New TextNode Representing The New Path
    xmlHintPth.appendChild(xmlTextNode);
}

function tryChangeReference(xmlMainSolutionReference, xmlSecondSolutionReference, mainSolutionCsprojPath, xmlDoc) {
    var mainReferenceJson = utils.referenceInfoToObject(xmlMainSolutionReference.getAttribute('Include'));
    var secondReferenceJson = utils.referenceInfoToObject(xmlSecondSolutionReference.getAttribute('Include'));

    if (mainReferenceJson.Dll !== secondReferenceJson.Dll) {
        return; 
    }

    var xmlMainHintPath = xmlMainSolutionReference.getElementsByTagName('HintPath')[0];
    var xmlSecondHintPath = xmlSecondSolutionReference.getElementsByTagName('HintPath')[0];

    if (!xmlMainHintPath || !xmlSecondHintPath) {
        return;
    }

    var newReferencePath = utils.strFormat('{0}\\{1}', mainSolutionCsprojPath, xmlMainHintPath.firstChild.nodeValue);
    changeReferencePath(xmlDoc, xmlSecondHintPath, newReferencePath);
}

function tryChangeReferenceFromAssembly(assemblyName, assemblyPath, xmlSecondSolutionReference, xmlDoc) {
    var secondReferenceJson = utils.referenceInfoToObject(xmlSecondSolutionReference.getAttribute('Include'));
    
    if (assemblyName !== secondReferenceJson.Dll) {
        return;
    }

    var xmlSecondHintPath = xmlSecondSolutionReference.getElementsByTagName('HintPath')[0];

    if (!xmlSecondHintPath) {
        return;
    }

    changeReferencePath(xmlDoc, xmlSecondHintPath, assemblyPath);
}

function changeXmlCsproj(assemblyName, assemblyPath, xmlMainSolutionReference, mainSolutionCsprojPath) {
    var solutionData = this.solution.secondSolution;
    for (var csprojIndex = 0, csproj, references; csproj = solutionData[csprojIndex]; csprojIndex++) {
        references = csproj.xmlDoc.documentElement.getElementsByTagName('Reference');
        for (var referenceIndex = 0, reference; reference = references[referenceIndex]; i++) {
            tryChangeReference(xmlMainSolutionReference, reference, mainSolutionCsprojPath, csproj.xmlDoc);
            tryChangeReferenceFromAssembly(assemblyName, assemblyPath, reference, csproj.xmlDoc);
        }
    }
}

/* End Region Merge Xml */

/* Region Public Methods */

function start(env, dlls, path, resolve) {
    utils.getProjectFiles(path, onGettingFiles.bind(this, env, dlls, resolve));
}

//compute this.solutions and create a new xml file
function xmlMerge(resolve) {
    var solutionData = this.solutions.mainSolution;
    for (var csprojIndex = 0, csproj, references, assemblyPath; csproj = solutionData[csprojIndex]; csprojIndex++) {
        references = csproj.xmlDoc.documentElement.getElementsByTagName('Reference');
        assemblyPath = utils.strFormat('{0}\\{1}\\{2}\\{3}.dll', csproj.projPath, 'bin', 'debug', csproj.assemblyName);
        for (var referenceIndex = 0, reference; reference = references[referenceIndex]; i++) {
            changeXmlCsproj.call(this, csproj.assemblyName, assemblyPath, reference, csproj.projPath);
        }
    }

    writeXmls.call(this);
    resolve();
}

/* End Region Public Methods */

function ReferencesFixer() {

}

ReferencesFixer.prototype.start = start;
ReferencesFixer.prototype.xmlMerge = xmlMerge;
ReferencesFixer.prototype.solutions = {};
ReferencesFixer.prototype.csprojDirs = {};
ReferencesFixer.prototype.csprojFiles = [];
ReferencesFixer.prototype.counter = 0;
module.exports = new ReferencesFixer();