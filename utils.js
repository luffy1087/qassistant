var fs = require('fs'),
    pathResolver = require('path');

function strFormat() {
    var str = arguments[0];
    if (arguments.length == 1) { return str; }

    for (var i = 1; i < arguments.length; i++) {
        str = str.replace(new RegExp('\\{'+ (i-1) + '\\}'), arguments[i]);
    }

    return str;
}

function tryGetPathByPattern(pattern, value) {
    var repetitions = pattern.match(/{\d+}/g) || [];
    
    if (repetitions.length === 0) { return pattern; }
    
    var values = [pattern].concat(value.concat(',').repeat(repetitions).slice(0, -1).split(','));
    var path = strFormat.apply(this, values);

    if (fs.existsSync(path)) { return path; }

    throw new Error('Path does not exist');
}

function searchForFolder(filePath, folderName) {
    var currentPath = strFormat('{0}\\{1}', filePath, folderName).split('\\');
    for (var i = (currentPath.length - 1), newPath; i > 0; i--) {
        newPath = strFormat('{0}\\{1}', currentPath.slice(0, i).join('\\'), folderName);
        if (fs.existsSync(newPath)) {
            return newPath;
        }
    }

    console.log('WARNING: searchForFolder did not find any folder');
}

function searchForFile(filePath, regFileName) {
    var currentPath = filePath.split('\\');
    for (var i = currentPath.length, files; i > 0; i--) {
        newPath = currentPath.slice(0, i).join('\\');
        files = glob.sync(strFormat('{0}\\{1}', newPath, regFileName));
        if (files && files.length == 1) {
            return pathResolver.resolve(files[0]);
        }
    }

    throw new Error('WARNING: searchForFile did not find any files');
}

function getSolutionFile(filePath) {
    return searchForFile(filePath, '*.sln');
}

function getCsprojFile(filePath) {
    return searchForFile(filePath, '*.csproj');
}

function getPackagesConfigFile(filePath) {
    return searchForFile(filePath, '*.config');
}

module.exports = {
    strFormat: strFormat,
    tryGetPathByPattern: tryGetPathByPattern,
    searchForFolder: searchForFolder,
    searchForFile: searchForFile,
    getSolutionFile: getSolutionFile,
    getCsprojFile: getCsprojFile,
    getPackagesConfigFile: getPackagesConfigFile
};