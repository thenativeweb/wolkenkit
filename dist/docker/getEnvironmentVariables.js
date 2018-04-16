'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hash = require('object-hash'),
    processenv = require('processenv');

var errors = require('../errors'),
    shell = require('../shell');

var cache = {};

var getEnvironmentVariables = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var configuration, env, cacheKey, environment, environmentVariables, _ref2, stdout, matches;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            configuration = options.configuration, env = options.env;
            cacheKey = hash(configuration) + '-' + env;

            if (!cache[cacheKey]) {
              _context.next = 10;
              break;
            }

            return _context.abrupt('return', cache[cacheKey]);

          case 10:
            environment = configuration.environments[env];

            if (environment) {
              _context.next = 13;
              break;
            }

            throw new errors.EnvironmentNotFound();

          case 13:
            environmentVariables = processenv();

            if (!(!environment.docker || !environment.docker.machine)) {
              _context.next = 17;
              break;
            }

            cache[cacheKey] = environmentVariables;

            return _context.abrupt('return', environmentVariables);

          case 17:
            _context.next = 19;
            return shell.exec('docker-machine env --shell bash ' + environment.docker.machine);

          case 19:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
            matches = stdout.match(/^export .*$/gm);

            if (matches) {
              _context.next = 24;
              break;
            }

            throw new errors.OutputMalformed();

          case 24:

            matches.map(function (match) {
              return match.replace(/^export /, '');
            }).map(function (match) {
              return match.replace(/"/g, '');
            }).forEach(function (match) {
              var _match$split = match.split('='),
                  _match$split2 = (0, _slicedToArray3.default)(_match$split, 2),
                  key = _match$split2[0],
                  value = _match$split2[1];

              environmentVariables[key] = value;
            });

            cache[cacheKey] = environmentVariables;

            return _context.abrupt('return', environmentVariables);

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getEnvironmentVariables(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getEnvironmentVariables;