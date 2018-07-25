var fs = require('fs'),
    readline = require('readline-sync'),
    Registry = require('winreg'),
    eventEmitter = require('events'),
    events = new eventEmitter();

function askPath(type) {
    do {
        var path = readline.question('type the full path of the ' + type + '\n');
        if (!path.match(/\{0\}/) && !fs.existsSync(path)) {
            console.log('The path does not exist');
            continue;
        }

        return path;
    }
    while(true)
}

function getDevEnvPath() {
    var vsPaths = new Registry({hive: Registry.HKLM, key: '\\SOFTWARE\\Wow6432Node\\Microsoft\\VisualStudio\\SxS\\VS7'});
    vsPaths.values(onRegistryValues);
}

function onRegistryValues(err, items) {
    if (err) {
        return void console.log('WINREG ERROR: ' + err);
    }

    for (var i=0; i < items.length; i++) {
        var file = items[i].value + 'Common7\\IDE\\devenv.exe';
        
        if (!fs.existsSync(file)) { continue; }

        events.emit('onDevPath', file);

        return;
    }

    throw new Error('Devenv not found the registry');
}

function readyToStart(devenvPath) {
    var json = createConfigurationJson(devenvPath);

    fs.writeFileSync('configure.json', JSON.stringify(json));

    events.emit('onStart', json);
}

function createConfigurationJson(devenvPath) {
    return {
        mainProjectPath: askPath('mainProjectPath'),
        patternOrPath: askPath('patternOrPath (e.g: C:\\projects\\{0}\\Src)'),
        devenvPath: devenvPath
    };
}

function getConfig() {
    if (fs.existsSync('./configure.json')) {
        return void events.emit('onStart', require('./configure.json'));
    }
    
    events.once('onDevPath', readyToStart);
    getDevEnvPath();
}

exports.configuration = { getConfig, events: events };