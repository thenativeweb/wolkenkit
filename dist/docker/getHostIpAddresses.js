'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = require('url');

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    getIpAddresses = require('../network/getIpAddresses');

var getHostIpAddresses = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var configuration, env, environmentVariables, localhostAddresses, parsedUrl, addresses;
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
            _context.next = 9;
            return getEnvironmentVariables({ configuration: configuration, env: env });

          case 9:
            environmentVariables = _context.sent;
            localhostAddresses = [{ address: '127.0.0.1', family: 4 }, { address: '::1', family: 6 }];

            if (environmentVariables.DOCKER_HOST) {
              _context.next = 13;
              break;
            }

            return _context.abrupt('return', localhostAddresses);

          case 13:
            parsedUrl = void 0;
            _context.prev = 14;

            parsedUrl = url.parse(environmentVariables.DOCKER_HOST);
            _context.next = 21;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context['catch'](14);
            return _context.abrupt('return', localhostAddresses);

          case 21:
            if (parsedUrl.hostname) {
              _context.next = 23;
              break;
            }

            return _context.abrupt('return', localhostAddresses);

          case 23:
            _context.next = 25;
            return getIpAddresses(parsedUrl.hostname);

          case 25:
            addresses = _context.sent;
            return _context.abrupt('return', addresses);

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[14, 18]]);
  }));

  return function getHostIpAddresses(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getHostIpAddresses;