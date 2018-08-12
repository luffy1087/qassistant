var fs = require('fs'),
    readline = require('readline-sync'),
    Registry = require('winreg');

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

function getBuildCommand() {
    var vsPaths = new Registry({hive: Registry.HKLM, key: '\\SOFTWARE\\Wow6432Node\\Microsoft\\VisualStudio\\SxS\\VS7'});
    vsPaths.values(onRegistryValues.bind(this));
}

function onRegistryValues(err, items) {
    if (err) {
        return void console.log('WINREG ERROR: ' + err);
    }

    for (var i=0; i < items.length; i++) {
        var file = items[i].value + 'Common7\\IDE\\devenv.exe';
        
        if (!fs.existsSync(file)) { continue; }

        this.eventEmitter.emit('onBuildCommandFound', file);

        return;
    }

    throw new Error('Devenv not found the registry');
}

function onBuildCommandFound(buildCommand) {
    var json = createConfigurationJson(buildCommand);

    fs.writeFileSync('configure.json', JSON.stringify(json));

    this.eventEmitter.emit('onConfigurationCreated', json);
}

function createConfigurationJson(buildCommand) {
    return {
        mainProjectPath: askPath('mainProjectPath'),
        patternOrPath: askPath('patternOrPath (e.g: C:\\projects\\{0}\\Src)'),
        buildCommand: buildCommand,
        packagesFolder: 'packages',
        filterRegExp: 'F31\\.*'
    };
}

function getConfig() {
    if (fs.existsSync('./configure.json')) {
        return void this.eventEmitter.emit('onConfigurationCreated', require('./configure.json'));
    }
    
    this.eventEmitter.once('onBuildCommandFound', onBuildCommandFound.bind(this));
    getBuildCommand.call(this);
}

//exports.configuration = { getConfig, this.eventEmitter: this.eventEmitter };
module.exports = getConfig;