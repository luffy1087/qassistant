var fs = require('fs')
  , xml2js = require('xml2js')
  , utils = require('../utils/utils')
  , commands = require('../utils/commands');


function getJson(filePath, xml, resolve, reject) {
    xml2js.parseString(xml, {}, function(err, json) {
        if (err) {
            reject();
            throw new Error('error raised parsing xml');
        }

        var files = json.package.files[0].file
            .map(function(file) { return { src: file.$.src, dest: file.$.target }; })
            .filter(function(file) { 
                return file.src.match(/(\.cshtml)|(\.json)|(\.js)$/i); }
            );

        resolve({ path: filePath.split('\\').slice(0,-1).join('\\'), files: files } );
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
    for (var i = 0, nuspecJson; nuspecJson = nuspecsJson[i]; i++) {
        for (var ii = 0, file, source, destination; file = nuspecJson.files[ii]; ii++) {
            source = utils.strFormat('{0}\\{1}', nuspecJson.path, file.src);
            destination = utils.strFormat('{0}\\{1}', secondSolutionPath, file.dest.replace(/content\\/i, ''));
            commands.spawn('xcopy', [source, destination, '/S', '/Y'], function() { });
        }
    }
}

function start(dirs, secondSolutionPath, resolve) {
    var nuspecs = dirs.map( function (dir) { return utils.searchForFile(dir, '*.nuspec'); });
    var promises = [];
    for (var i = 0, nuspec; nuspec = nuspecs[i]; i++) {3
        promises.push(new Promise(getXml.bind(this, nuspec)));
    }

    Promise.all(promises)
        .then(moveViewsAndJsonInformation.bind(this, secondSolutionPath))
        .then(resolve);
}

function Mover() {

}

Mover.prototype.start = start;
module.exports = new Mover();