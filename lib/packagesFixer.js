var fs = require('fs')
  , xml2js = require('xml2js')
  , utils = require('../utils/utils');


function saveRightPackages(rightPackages) {
    xml = xmlBuilder.buildObject(rightPackages.xmlJson);
    fs.writeFile(rightPackages.file, xml, function(err) {
        if (err) {
            console.log(utils.strFormat('Error writing file {0}', xmlJsonData.file));
        }
    });
}

function tryUpdateRightPackages(leftPackage, rightPackages) {
    for (var i = 0, rightPackage; rightPackage = rightPackages[i]; i++) {
        if (leftPackage.$.id == rightPackage.$.id) {
            rightPackage.$.id = leftPackage.$.id;
            rightPackage.$.version = leftPackage.$.version;
            rightPackage.$.targetFramework = leftPackage.$.targetFramework;
            return;
        }
    }

    rightPackages.push(leftPackage);
}  

function onReceivingJsonPackages(packagesFiles) {
    var leftPackages = packagesFiles[0].xmlJson.packages.package;
    var rightPackages = packagesFiles[1].xmlJon.packages.package;
    for (var i = 0, leftPackage; leftPackage = leftPackages[i]; i++) {
        tryUpdateRightPackages(leftPackage, rightPackages);
    }

    return rightPackages;
}

function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (!err) { return void resolve({ file: file, xmlJson: json } ); }
        
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

function start(mainSolutionPath, solutionPath) {
    var promises = [
        new Promise(getXml.bind(this, utils.getPackagesConfigFile(mainSolutionPath))),
        new Promise(getXml.bind(this, utils.getPackagesConfigFile(solutionPath)))
    ];
    
    Promise.all(promises)
     .then(onReceivingJsonPackages)
     .then(saveRightPackages);
}

function PackagesFixer() {

}

PackagesFixer.prototype.start = start;
module.exports = PackagesFixer;