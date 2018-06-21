'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var request = require('requestretry');

var errors = require('../../../errors');

var waitForSshTunnel = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var host, port, result;
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
            if (options.host) {
              _context.next = 4;
              break;
            }

            throw new Error('Host is missing.');

          case 4:
            if (options.port) {
              _context.next = 6;
              break;
            }

            throw new Error('Port is missing.');

          case 6:
            host = options.host, port = options.port;
            _context.next = 9;
            return request({
              url: 'http://' + host + ':' + port + '/v1/ping',
              json: true,
              fullResponse: false,
              maxAttempts: 5,
              retryDelay: 2 * 1000,
              retryStrategy: request.RetryStrategies.HTTPOrNetworkError
            });

          case 9:
            result = _context.sent;

            if (!(result.api !== 'v1')) {
              _context.next = 12;
              break;
            }

            throw new errors.JsonMalformed();

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function waitForSshTunnel(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = waitForSshTunnel;