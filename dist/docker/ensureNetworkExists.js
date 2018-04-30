'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var ensureNetworkExists = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var configuration, env, name, environmentVariables, _ref2, stdout, networks, doesNetworkExist;

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
            name = configuration.application + '-network';
            _context.next = 10;
            return getEnvironmentVariables({ configuration: configuration, env: env });

          case 10:
            environmentVariables = _context.sent;
            _context.next = 13;
            return shell.exec('docker network ls --format "{{json .}}"', {
              env: environmentVariables
            });

          case 13:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
            networks = stdout.split('\n').filter(function (item) {
              return item;
            }).map(function (item) {
              return JSON.parse(item);
            });
            doesNetworkExist = networks.find(function (network) {
              return network.Name === name;
            });

            if (!doesNetworkExist) {
              _context.next = 19;
              break;
            }

            return _context.abrupt('return');

          case 19:
            _context.next = 21;
            return shell.exec('docker network create ' + name, {
              env: environmentVariables
            });

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function ensureNetworkExists(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = ensureNetworkExists;