/* A simple config object for a node application. Accepts two objects, the
 * first is a set of defaults. The second is an environment object. All app
 * specific environment variables can have a prefix this will be stripped by
 * the config.
 *
 * If a function is used for a config value this will be evaluated at
 * runtime providing access to the entire config object as an argument.
 */
'use strict';

var PRODUCTION = 'production';
var DEVELOPMENT = 'development';
var TEST = 'test';
var INTEGRATION = 'integration';

exports.PRODUCTION = PRODUCTION;
exports.DEVELOPMENT = DEVELOPMENT;
exports.TEST = TEST;
exports.INTEGRATION = INTEGRATION;

exports.Config = function Config(values, env, options) {
    var config = {};
    env = env || {};
    options = defaults(options, {
        prefix: '',
        unprefixed: ['PORT', 'NODE_ENV'],
        environments: {
            PRODUCTION: PRODUCTION,
            DEVELOPMENT: DEVELOPMENT,
            TEST: TEST,
            INTEGRATION: INTEGRATION
        }
    });

    options.unprefixed.concat(['PORT', 'NODE_ENV']);

    // Extract the unprefixed keys.
    options.unprefixed.forEach(function (key) {
        var envValue = has(env, key) ? coerce(env[key]) : null;
        config[key] = envValue;
    });

    // Extract the default keys.
    Object.keys(values).forEach(function (key) {
        var envVar = prefix(key);
        var envValue = has(env, envVar) ? coerce(env[envVar]) : null;
        config[key] = envValue !== null ? envValue : values[key];
    });

    this.PRODUCTION = options.environments.PRODUCTION;
    this.DEVELOPMENT = options.environments.DEVELOPMENT;
    this.TEST = options.environments.TEST;
    this.INTEGRATION = options.environments.INTEGRATION;

    this.get = function get(key, fallback) {
        var hasKey = has(config, key);
        var hasFallback = arguments.length === 2;
        var value = hasKey ? config[key] : fallback;

        if (!hasKey && !hasFallback) {
            throw new Error('Missing config key: ' + key);
        }

        return typeof value === 'function' ? value(this) : value;
    };

    this.isProduction = function isProduction() {
        return this.get('NODE_ENV') === this.PRODUCTION;
    };

    this.isDevelopment = function isDevelopment() {
        return this.get('NODE_ENV') === this.DEVELOPMENT;
    };

    this.isTest = function isTest() {
        return this.get('NODE_ENV') === this.TEST;
    };

    this.isIntegration = function isIntegration() {
        return this.get('NODE_ENV') === this.INTEGRATION;
    };

    this.isTestOrIntegration = function isTestOrIntegration() {
        return this.isTest() || this.isIntegration();
    };

    this.version = function version() {
        if (!options.version) {
            throw new Error('Version must be provided when instantiating Config');
        }
        return options.version;
    };

    Object.defineProperty(this, 'prefix', {
        value: options.prefix
    });

    function prefix(key) {
        var isUnprefixed = options.unprefixed.indexOf(key) > -1;
        var prefixed = options.prefix ? options.prefix.toUpperCase() + '_'  + key : key;
        return isUnprefixed ? key : prefixed;
    }
};

function has(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function defaults(obj, def) {
    var clone = {};
    var key;

    for (key in obj) {
        if (has(obj, key)) {
            clone[key] = obj[key];
        }
    }

    for (key in def) {
        clone[key] = has(obj, key) ? obj[key] : def[key];
    }

    return clone;
}

function coerce(value) {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (/^\d+$/.test(value)) {
        return parseInt(value, 10);
    }
    return value;
}
