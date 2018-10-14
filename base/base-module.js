var EventEmitter = require('events')
  , config = require('./cfg/configure')
  , argumentsGetter = require('./base/argumentsGetter');

function onConfigurationLoaded(cfg) {
    this.configuration = cfg;
    this.arguments = argumentsGetter.call(this, cfg);

    setTimeout(function() { this.eventEmitter.emit('onArgumentsSet'); }.bind(this), 0);
}

function BaseModule() {
    this.eventEmitter.once('onConfigurationCreated', onConfigurationLoaded.bind(this));
    config.getConfig.call(this);
}

BaseModule.prototype.eventEmitter = new EventEmitter();
BaseModule.prototype.currentPath = process.cwd();
module.exports = BaseModule;