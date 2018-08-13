var eventEmitter = require('events')
  , getConfig = require('./configure')
  , argumentsGetter = require('./argumentsGetter')
  , utils = require('./utils');

function onConfigurationLoaded(cfg) {
    this.configuration = cfg;
    this.arguments = argumentsGetter.call(this, cfg);

    setTimeout(function() { this.eventEmitter.emit('onArgumentsSet'); }.bind(this), 0);
}

function Base() {
    this.eventEmitter.once('onConfigurationCreated', onConfigurationLoaded.bind(this));
    getConfig.call(this);
}

Base.prototype.currentPath = process.cwd();
Base.prototype.eventEmitter = new eventEmitter();
Base.prototype.utils = utils;
Base.prototype.glob = require('glob'),
Base.prototype.async = require('async'),
Base.prototype.pathResolver = require('path'),
module.exports = Base;