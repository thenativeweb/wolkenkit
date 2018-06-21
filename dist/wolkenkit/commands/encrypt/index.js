'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = require('url');

var request = require('requestretry');

var noop = require('../../../noop'),
    shared = require('../shared');

var encrypt = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var env, directory, privateKey, value, configuration, tunnel, endpoint, response, encrypted;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.value) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            env = options.env, directory = options.directory, privateKey = options.privateKey, value = options.value;
            _context.next = 11;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 11:
            configuration = _context.sent;
            _context.next = 14;
            return shared.startTunnel({ configuration: configuration, env: env, privateKey: privateKey }, progress);

          case 14:
            tunnel = _context.sent;
            endpoint = url.format({
              protocol: 'http:',
              hostname: tunnel.host,
              port: tunnel.port,
              pathname: '/v1/encrypt'
            });


            progress({ message: 'Using ' + endpoint + ' as route.' });

            _context.next = 19;
            return request({
              method: 'POST',
              url: endpoint,
              json: true,
              body: { value: value },
              fullResponse: false,
              maxAttempts: 3,
              retryDelay: 2 * 1000,
              retryStrategy: request.RetryStrategies.HTTPOrNetworkError
            });

          case 19:
            response = _context.sent;
            encrypted = response.value;


            tunnel.close();

            return _context.abrupt('return', encrypted);

          case 23:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function encrypt(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = encrypt;