var fs = require('fs')
  , xml2js = require('xml2js')
  , utils = require('../utils/utils');


function getJson(file, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (err) {
            reject();
            throw new Error('error raised parsing xml');
        }

        var files = json.package.files
            .map(function(file) { return { src: file.$.src, dest: file.$.target }; })
            .filter(function(file) { return file.src.match(/(\.cshtml)|(\.json)|(\.js)|$/i); } );

        resolve({ nuspec: file, files: files } );
    });
}

function getXml(file, resolve, reject) {
    fs.readFile(file, function(err, result) {
        if (!err) { return void getJson.call(this, file, result.toString(), resolve, reject); }
        
        reject();
        throw new Error('Xml File not found');
    });
}

function moveViewsAndJsonInformation(secondSolutionPath, nuspecsJson) {
    for (var i = 0, nuspecJson; nuspec = nuspecsJson[i]; i++) {
        
    }
}

function start(dirs, secondSolutionPath, resolve) {
    var nuspecs = dirs.map( function (dir) { return utils.searchForFile(dir, '*.nuspec'); });
    var promises = [];
    for (var i = 0, nuspec; nuspec = nuspecs[i]; i++) {
        promises.push(new Promise(function (resolve, reject) { getXml.bind(this, nuspec, resolve, reject); }));
    }

    Promise.all(promises).then(moveViewsAndJsonInformation.bind(secondSolutionPath));
}


function ViewsAndJsonsMover() {

}

ViewsAndJsonsMover.prototype.start = start;