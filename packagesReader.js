var fs = require('fs')
  , xml2js = require('xml2js')
  , async = require('async');

function getXmlFile(path, resolveTask) {
    fs.readFile(path, function(err, result) {
        if (!err) { return void resolveTask(null, result.toString()); }
        
        throw new Error('Xml File not found');
    });
}

function parseXml(xmlString, resolveTask) {
    xml2js.parseString(xmlString, function(err, json) {
        if (!err) { return void resolveTask(null, json.packages.package); }
        
        throw new Error('error raised parsing xml');
    });
}

function filterPackages(regExpString, packages, resolveTask) {
    var regExp = new RegExp(regExpString, 'gi');
    var filteredPackages = packages.filter(function(package) { return regExp.test(package.$.id); });
    
    resolveTask(null, filteredPackages);
}

function executeTask(task) {
    var args = Array.prototype.slice.call(arguments, 1);

    return function() {
        var resolvedArgs = Array.prototype.slice.call(arguments, 0);
        task.apply(this, args.concat(resolvedArgs));
    }
}

function readPackagesDirectory() {

}

function onTaskEnd(data, resolveTask) {
    this.args.events.emit('onTaskEnd', data);
    
    resolveTask();
}

function readAndFilterPackages(path, regExpString) {
    async.waterfall([
        executeTask(getXmlFile, path),
        executeTask(parseXml),
        executeTask(filterPackages, regExpString),
        onTaskEnd.bind(this)
    ]);
}

function packagesReaderClazz(args) {
    this.args = args;
}

packagesReaderClass.prototype.readAndFilterPackages = readAndFilterPackages;
packagesReaderClass.prototype.readPackagesDirectory = readPackagesDirectory;

exports.packagesReader = packagesReaderClazz;