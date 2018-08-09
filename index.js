var configuration = require('./configure').configuration,
    extend = require('extend'),
    prepareEnvs = require('./prepareEnv').prepareEnv,
    referencesFixer = require('./referencesFixer'),
    events = configuration.events;

function startProgram(cfg) {
    var args = require('./argumentsGetter').argumentsGetter(cfg);
    var wholeObject = extend({ events: events }, cfg, args);
    
    prepareEnvs.prepareFirstEnvironment(wholeObject);
}

function startFixer(wholeObject) {
    
}

events.once('onStart', startProgram);
events.once('onFirstEnvironmentFinished', function(wholeObject) { prepareEnvs.prepareSecondEnvironment(wholeObject); });
events.once('onSecondEnvironmentFinished', function(wholeObject) { startFixer(wholeObject); });
configuration.getConfig();