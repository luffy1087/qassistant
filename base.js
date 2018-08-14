function Base() {
    this.currentPath = process.cwd();
    this.packagesReader = require('./packagesReader');
}

module.exports = Base;