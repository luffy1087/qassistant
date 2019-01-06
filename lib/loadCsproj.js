var fs = require('fs')
  , xmldom = require('xmldom')
  , utils = require('../utils/utils');

function getDependenciesByXml(xmlDoc) {
    var xmlDependencies = xmlDoc.documentElement.getElementsByTagName('ProjectReference');

    if (xmlDependencies.length === 0) { return []; }

    for (var i = 0, sibling, dependencies = []; sibling = xmlDependencies.item(i); i++) {
        dependencies.push(sibling.getAttribute('Include'));
    }

    return dependencies;
}

function getFileName(assemblyProjPath, projFile) {
    return utils.strFormat('{0}\\{1}', assemblyProjPath, projFile);
}

function onReadXml(filePath, err, result) {
    if (err) { throw new Error('xml not found'); }

    var xmlDoc = new xmldom.DOMParser().parseFromString(result.toString(), 'text/xml');
    var dependencies = getDependenciesByXml(xmlDoc);
    this.incrementCounter();
    this.incrementExpectedCounter(dependencies.length + 1);

    //check globl object

    for (var i = 0, dependency; dependency = dependencies[i]; i++) {
        loadXml(getFileName(filePath, dependency));
    }

    if (this.areCountersEqual()) { 
        return void this.resolve(); //{ proj: file, projPath: assemblyProjPath, xmlDoc: xmlDoc, assemblyName: assemblyName }
    }
}

function loadXml(filePath) {
    fs.readFile(filePath, onReadXml.bind(this, filePath)); 
}

function loadCsproj(filePath, loadedXmlsObject, resolve, reject) {
    this.loadedXmlsObjects = loadedXmlsObject;
    this.resolve = resolve;
    this.reject = reject;
    loadXml.call(this, filePath);
}

loadCsproj.prototype.counter = -1;
loadCsproj.prototype.loadedCounter = -1;
loadCsproj.prototype.incrementCounter = function() { this.counter++ };
loadCsproj.prototype.incrementExpectedCounter = function(howMany) { this.expectedCounter; };
loadCsproj.prototype.areCountersEqual = function() { return this.counter === this.expectedCounter; };
exports.loadCsproj = loadCsproj;