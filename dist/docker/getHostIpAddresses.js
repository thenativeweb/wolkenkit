'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var url = require('url');

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    getIpAddresses = require('../network/getIpAddresses');

var getHostIpAddresses =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, env, environmentVariables, localhostAddresses, parsedUrl, addresses;
    return _regenerator.default.wrap(function _callee$(_context) {
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
            return getEnvironmentVariables({
              configuration: configuration,
              env: env
            });

          case 9:
            environmentVariables = _context.sent;
            localhostAddresses = [{
              address: '127.0.0.1',
              family: 4
            }, {
              address: '::1',
              family: 6
            }];

            if (environmentVariables.DOCKER_HOST) {
              _context.next = 13;
              break;
            }

            return _context.abrupt("return", localhostAddresses);

          case 13:
            _context.prev = 13;
            parsedUrl = url.parse(environmentVariables.DOCKER_HOST);
            _context.next = 20;
            break;

          case 17:
            _context.prev = 17;
            _context.t0 = _context["catch"](13);
            return _context.abrupt("return", localhostAddresses);

          case 20:
            if (parsedUrl.hostname) {
              _context.next = 22;
              break;
            }

            return _context.abrupt("return", localhostAddresses);

          case 22:
            _context.next = 24;
            return getIpAddresses(parsedUrl.hostname);

          case 24:
            addresses = _context.sent;
            return _context.abrupt("return", addresses);

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 17]]);
  }));

  return function getHostIpAddresses(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getHostIpAddresses;