var fs = require('fs')
  , xmldom = require('xmldom')
  , utils = require('../utils/utils')
  , path = require('path');

function getDependenciesByXml(xmlDoc) {
    var xmlDependencies = xmlDoc.documentElement.getElementsByTagName('ProjectReference');

    if (xmlDependencies.length === 0) { return []; }

    for (var i = 0, sibling, dependencies = []; sibling = xmlDependencies.item(i); i++) {
        dependencies.push(sibling.getAttribute('Include'));
    }

    return dependencies;
}

function getAssemblyName(xmlDoc) {
    return xmlDoc.documentElement.getElementsByTagName('AssemblyName')[0];
}

function getFileName(assemblyProjPath, projFile) {
    return utils.strFormat('{0}\\{1}', path.dirname(assemblyProjPath), projFile);
}

function onReadXml(filePath, err, result) {
    if (err) { throw new Error('xml not found'); }

    if (this.isAlreadyLoaded(filePath)) { return; }

    var xmlDoc = new xmldom.DOMParser().parseFromString(result.toString(), 'text/xml');
    var dependencies = getDependenciesByXml(xmlDoc);
    this.incrementCounter();
    this.incrementExpectedCounter(dependencies.length + 1);
    this.addLoadedCsprojs(filePath);
    this.addCsproj({ fileName: filePath, filePath: utils.path(filePath), assemblyName: getAssemblyName(xmlDoc), xmlDoc: xmlDoc });

    for (var i = 0, dependency; dependency = dependencies[i]; i++) {
        loadXml.call(this, getFileName(filePath, dependency));
    }

    if (this.areCountersEqual()) {
        return void this.resolve(this.csprojs);
    }
}

function loadXml(filePath) {
    fs.readFile(filePath, onReadXml.bind(this, filePath)); 
}

function loadCsproj(filePath, resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
    loadXml.call(this, filePath);
}

loadCsproj.prototype.counter = -1;
loadCsproj.prototype.expectedCounter = -1;
loadCsproj.prototype.loadedCsprojs = [];
loadCsproj.prototype.csprojs = [];
loadCsproj.prototype.incrementCounter = function() { this.counter++ };
loadCsproj.prototype.incrementExpectedCounter = function(howMany) { this.expectedCounter += howMany; };
loadCsproj.prototype.areCountersEqual = function() { return this.counter === this.expectedCounter; };
loadCsproj.prototype.isAlreadyLoaded = function(fileName) { return utils.inArray(this.loadedCsprojs, fileName); };
loadCsproj.prototype.addLoadedCsprojs = function(fileName) { utils.checksAndPush(this.loadedCsprojs, fileName); };
loadCsproj.prototype.addCsproj = function(data) { this.csprojs.push(data); };
exports.loadCsproj = loadCsproj;