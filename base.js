var PackagesReader = require('./packagesReader');

function Base() {
    this.currentPath = process.cwd();
    this.packagesReader = new PackagesReader();
}

module.exports = Base;