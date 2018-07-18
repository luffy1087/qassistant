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

exports.utils = {
    strFormat: strFormat,
    getPathByPattern: getPathByPattern
};