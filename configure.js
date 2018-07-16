var fs = require('fs');
var readline = require('readline-sync');

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

function getConfig() {
    if (fs.existsSync('./configure.json')) {
       return require('./configure.json');
    }
    
    var configurationObject = { mainProject: askPath('mainProject'), secondProject: askPath('pattern (e.g: C:\\projects\\{MyProj}\\Src)', true) };
    fs.writeFileSync('configure.json', JSON.stringify(configurationObject));

    return configurationObject;
}

exports.getConfig = getConfig;