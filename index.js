var configuration = require('./configure').configuration,
    extend = require('extend'),
    prepareEnvs = require('./prepareEnv').prepareEnv
    events = configuration.events;

function startProgram(cfg) {
    var args = require('./argumentsGetter').argumentsGetter(cfg);
    var wholeObject = extend({ events: events }, cfg, args);
    prepareEnvs.prepareFirstEnvironment(wholeObject);
}

events.once('onStart', startProgram);
events.once('onFirstEnvironmentFinished', function(wholeObject) { prepareEnvs.prepareSecondEnvironment(wholeObject); });
configuration.getConfig();