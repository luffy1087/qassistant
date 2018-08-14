var EventEmitter = require('events')
  , getConfig = require('./configure')
  , argumentsGetter = require('./argumentsGetter')
  , utils = require('./utils');

function onConfigurationLoaded(cfg) {
    this.configuration = cfg;
    this.arguments = argumentsGetter.call(this, cfg);

    setTimeout(function() { this.eventEmitter.emit('onArgumentsSet'); }.bind(this), 0);
}

function ModelBase() {
    this.eventEmitter.once('onConfigurationCreated', onConfigurationLoaded.bind(this));
    getConfig.call(this);
}

ModelBase.prototype.eventEmitter = new EventEmitter();
ModelBase.prototype.utils = utils;
module.exports = ModelBase;
