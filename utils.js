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

function searchForFolder(folderName) {
    var currentPath = process.cwd().split('\\');
    for (var i = currentPath.length-1, folderToSearch; i >= 0; i--) {
        folderToSearch = strFormat('{0}\\{1}', currentPath.slice(0, i).join('\\'), folderName);
        if (fs.existsSync(folderToSearch)) {
            return searchForFolder;
        }
    }

}

exports.utils = {
    strFormat: strFormat,
    getPathByPattern: getPathByPattern,
    searchForFolder: searchForFolder
};