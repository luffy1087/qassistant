var fs = require('fs');
var readline = require('readline-sync');
var Registry = require('winreg');
var eventEmitter = require('events');
var events = new eventEmitter();

function askPath(type, isPattern) {
    do {
        var path = readline.question('type the full path of the ' + type + '\n');
        if (!isPattern && !fs.existsSync(path)) {
            console.log('The path does not exist');
            continue;
        }

        return path;
    }
    while(true)
}

function getDevEnvPath() {
    var vsPaths = new Registry({hive: Registry.HKLM, key: '\\SOFTWARE\\Wow6432Node\\Microsoft\\VisualStudio\\SxS\\VS7'});
    vsPaths.values(function(err, items) {
        if (err) {
            return void console.log('WINREG ERROR: ' + err);
        }

        for (var i=0; i < items.length; i++) {
            var file = items[i].value + 'Common7\\IDE\\devenv.exe';
            
            if (!fs.existsSync(file)) { continue; }

            events.emit('onDevPath', file);

            break;
        }
    });
}

function readyToStart(devenvPath) {
    var configurationObject = { mainProject: askPath('mainProject'), secondProject: askPath('pattern (e.g: C:\\projects\\{0}\\Src)', true), devenvPath: devenvPath };

    fs.writeFileSync('configure.json', JSON.stringify(configurationObject));

    events.emit('onStart', configurationObject);
}

function createConfiguration() {
    events.once('onDevPath', readyToStart);

    getDevEnvPath();
}

function getConfig() {
    if (fs.existsSync('./configure.json')) {
        return void events.emit('onStart', require('./configure.json'));
    }
    
    createConfiguration();
}

exports.configuration = { getConfig, events: events };