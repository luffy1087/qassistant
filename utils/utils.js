var fs = require('fs')
  , pathResolver = require('path')
  , glob = require('glob');

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
    
    var values = [pattern].concat(value.concat(',').repeat(repetitions.length).slice(0, -1).split(','));
    
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
    for (var i = currentPath.length, newPath, files; i > 0; i--) {
        newPath = currentPath.slice(0, i).join('\\');
        files = glob.sync(strFormat('{0}\\{1}', newPath, regFileName));
        if (files && files.length > 0) {
            return pathResolver.resolve(files[0]);
        }
    }

    throw new Error('ERROR: searchForFile did not find any files');
}

function getSolutionFile(filePath) {
    return searchForFile(filePath, '*.sln');
}

function getProjectFiles(pathToSearch, callback) {
    var pattern = strFormat('{0}/{1}', pathToSearch, '**/*.csproj');
    
    glob(pattern, { "ignore": [ '*.Test.csproj' ] }, function(err, files) {
        if (err || files.length === 0) { throw new Error('No project files found!'); }

        var mappedFiles = files.map(function(file) { return pathResolver.resolve(file); }).filter(function(file) {  return file.indexOf('node_modules') === -1 && !file.match(/(Test)/i); });

        callback(mappedFiles);
    });
}

function stringMatchInArray(arrayString, str) {
    str = str.toLowerCase();
    for (var i = 0; s = arrayString[i]; i++) {
        if (str.indexOf(s.toLowerCase()) > -1) { return true; }
    }
    
    return false;
}

function referenceInfoToObject(includeString) {
    var info = includeString.split(',') || [];
    var objectToReturn = { Dll: info[0].trim() };
    
    for (var i = 1, currentInfo, equalsSignIndex; currentInfo = info[i]; i++) {
        currentInfo = currentInfo.trim();
        equalsSignIndex = currentInfo.indexOf("=");
        
        if (equalsSignIndex === -1) { continue; }

        equalsSignIndex = currentInfo.indexOf("=");
        objectToReturn[currentInfo.substring(0, equalsSignIndex)] = currentInfo.substring(equalsSignIndex+1);
    }

    return objectToReturn;
}

function inArray(arr, value) {
    return arr.indexOf(value) > -1;
}

function checksAndPush(arr, value) {
    if (inArray(arr, value)) {
        return;
    }

    arr.push(value);
}

function removeBackDirs(path1, path2) {
    var splittedPath1 = path1.split('\\');
    var splittedPath2 = path2.split('\\');

    while (splittedPath2[0] === '..') {
        splittedPath1.splice(splittedPath1.length-1, 1);
        splittedPath2.splice(0, 1);
    }

    return strFormat("{0}\\{1}", splittedPath1.join('\\'), splittedPath2.join('\\'));
}

module.exports = {
    strFormat: strFormat,
    tryGetPathByPattern: tryGetPathByPattern,
    searchForFolder: searchForFolder,
    searchForFile: searchForFile,
    getSolutionFile: getSolutionFile,
    getCsprojFile: getCsprojFile,
    getPackagesConfigFile: getPackagesConfigFile,
    getProjectFiles: getProjectFiles,
    stringMatchInArray: stringMatchInArray,
    referenceInfoToObject: referenceInfoToObject,
    checksAndPush: checksAndPush,
    inArray: inArray,
    removeBackDirs: removeBackDirs
};