var eventEmitter = require('events'),
    getConfig = require('./configure'),
    argumentsGetter = require('./argumentsGetter'),
    utils = require('./utils');

function onConfigurationLoaded(cfg) {
    this.configuration = cfg;
    this.arguments = argumentsGetter.call(this, cfg);
}

function Base() {
    this.eventEmitter.once('onConfigurationCreated', onConfigurationLoaded.bind(this));
    getConfig.call(this);
}

Base.prototype.eventEmitter = new eventEmitter();
Base.prototype.utils = utils;
module.exports = Base;