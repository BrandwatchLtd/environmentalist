'use strict';

var sinon = require('sinon');
var assert = require('assert');
var Config = require('../index').Config;

describe('config', function () {
    var DEFAULT_CONFIG = {
        PORT: 4567,
        NODE_ENV: 'production',
        DEFAULT_VALUE: 'default',
        IS_TRUE: null,
        IS_FALSE: null,
        NUMBER: null
    };

    function createConfig(env, options) {
        return new Config(DEFAULT_CONFIG, env, options);
    }

    it('exposes each of the environment constants', function () {
        var config = createConfig();
        assert.equal(config.PRODUCTION, 'production');
        assert.equal(config.DEVELOPMENT, 'development');
        assert.equal(config.TEST, 'test');
    });

    it('exposes the prefix', function () {
        var prefix = 'DOGE';
        var config = createConfig({}, {prefix: prefix});
        assert.equal(config.prefix, prefix);
    });

    it('does not allow the prefix to be changed', function () {
        var config = createConfig();
        assert.throws(function () {
            config.prefix = 'CANT OVERRIDE';
        });
    });

    describe('.get', function () {
        it('returns the value from the defaults object', function () {
            var config = createConfig();
            assert.equal(config.get('DEFAULT_VALUE'), 'default');
        });

        it('returns the value from the defaults object', function () {
            var config = createConfig();
            assert.throws(function () {
                config.get('MISSING_VALUE');
            }, Error);
        });

        it('allows a fallback value to be provided', function () {
            var config = createConfig();
            assert.equal(config.get('MISSING_VALUE', 'found'), 'found');
        });

        it('returns the result of a value if a function is provided', function () {
            var value = sinon.stub().returns('callback');
            var config = new Config({LAZY_VALUE: value});
            assert.equal(config.get('LAZY_VALUE'), 'callback');
            sinon.assert.calledWith(value, config);
        });

        it('overrides existing options with environment variables', function () {
            var config = createConfig({DEFAULT_VALUE: 'overidden'});
            assert.equal(config.get('DEFAULT_VALUE'), 'overidden');
        });

        it('can be configured to use a prefix when looking for environment variables', function () {
            var config = createConfig({MYAPP_DEFAULT_VALUE: 'overidden'}, {prefix: 'MYAPP'});
            assert.equal(config.get('DEFAULT_VALUE'), 'overidden');
        });

        it('allows overidding of special variables without a prefix', function () {
            var config = createConfig({NODE_ENV: 'test', PORT: 1984}, {prefix: 'MYAPP'});
            assert.equal(config.get('NODE_ENV'), 'test');
            assert.equal(config.get('PORT'), 1984);
        });

        it('allows special unprefix variables to be provided', function () {
            var config = createConfig({DEFAULT_VALUE: 'overidden'}, {
                prefix: 'MYAPP',
                unprefixed: ['DEFAULT_VALUE']
            });
            assert.equal(config.get('DEFAULT_VALUE'), 'overidden');
        });

        it('extracts unprefixed keys even if they are not part of the default object', function () {
            var config = createConfig({UNPREFIXED: 'foo'}, {
                unprefixed: ['UNPREFIXED']
            });
            assert.equal(config.get('UNPREFIXED'), 'foo');
        });

        it('ensures NODE_ENV and PORT are always unprefixed', function () {
            var config = createConfig({PORT: 1234}, {
                unprefixed: ['UNPREFIXED']
            });
            assert.equal(config.get('PORT'), 1234);
        });

        it('coreces "true" and "false" environment variables into booleans', function () {
            var config = createConfig({IS_TRUE: 'true', IS_FALSE: 'false'});
            assert.strictEqual(config.get('IS_TRUE'), true);
            assert.strictEqual(config.get('IS_FALSE'), false);
        });

        it('coerces numeric strings into integers', function () {
            var config = createConfig({NUMBER: '2046'});
            assert.strictEqual(config.get('NUMBER'), 2046);
        });

        it('does not coerce alpha-numeric strings into integers', function () {
            var config = createConfig({NUMBER: 'http://localhost:2046'});
            assert.strictEqual(config.get('NUMBER'), 'http://localhost:2046');
        });
    });

    describe('.isProduction', function () {
        it('returns true if the node environment is set to production', function () {
            var config = createConfig({NODE_ENV: 'production'});
            assert.equal(config.isProduction(), true);
        });

        it('returns false if the node environment is not set to production', function () {
            var config = createConfig({NODE_ENV: 'development'});
            assert.equal(config.isProduction(), false);
        });
    });

    describe('.isDevelopment', function () {
        it('returns true if the node environment is set to development', function () {
            var config = createConfig({NODE_ENV: 'development'});
            assert.equal(config.isDevelopment(), true);
        });

        it('returns false if the node environment is not set to development', function () {
            var config = createConfig();
            assert.equal(config.isDevelopment(), false);
        });
    });

    describe('.isTest', function () {
        it('returns true if the node environment is set to test', function () {
            var config = createConfig({NODE_ENV: 'test'});
            assert.equal(config.isTest(), true);
        });

        it('returns false if the node environment is not set to test', function () {
            var config = createConfig();
            assert.equal(config.isTest(), false);
        });
    });

    describe('.isIntegration', function () {
        it('returns true if the node environment is set to integration', function () {
            var config = createConfig({NODE_ENV: 'integration'});
            assert.equal(config.isIntegration(), true);
        });

        it('returns false if the node environment is not set to integration', function () {
            var config = createConfig();
            assert.equal(config.isIntegration(), false);
        });
    });

    describe('.isTestOrIntegration', function () {
        it('returns true if the node environment is set to integration', function () {
            var config = createConfig({NODE_ENV: 'integration'});
            assert.equal(config.isTestOrIntegration(), true);
        });

        it('returns true if the node environment is set to test', function () {
            var config = createConfig({NODE_ENV: 'test'});
            assert.equal(config.isTestOrIntegration(), true);
        });

        it('returns false if the node environment is not set to integration', function () {
            var config = createConfig();
            assert.equal(config.isTestOrIntegration(), false);
        });
    });
});
