var fs = require('fs');

function strFormat() {
    var str = arguments[0];
    if (arguments.length == 1) { return str; }

    for (var i = 1; i < arguments.length; i++) {
        str = str.replace(new RegExp('\\{'+ (i-1) + '\\}'), arguments[i]);
    }

    return str;
}

function getPathByPattern(pattern, value) {
    var path = strFormat(pattern, value);

    if (fs.existsSync(path)) { return path; }

    throw new Error('Path ' + path + ' does not exist');
}

function searchForFolder(filePath, folderName) {
    var currentPath = strFormat('{0}\\{1}', filePath, folderName).split('\\');
    for (var i = (currentPath.length - 1), newPath; i > 0; i--) {
        newPath = strFormat('{0}\\{1}', currentPath.slice(0, i).join('\\'), folderName);
        if (fs.existsSync(newPath)) {
            return newPath;
        }
    }

    throw new Error('No ' + currentPath + 'found!');
}

exports.utils = {
    strFormat: strFormat,
    getPathByPattern: getPathByPattern,
    searchForFolder: searchForFolder
};