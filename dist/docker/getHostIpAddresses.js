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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, environmentVariables, localhostAddresses, parsedUrl, addresses;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            _context.next = 5;
            return getEnvironmentVariables({
              configuration: configuration
            });

          case 5:
            environmentVariables = _context.sent;
            localhostAddresses = [{
              address: '127.0.0.1',
              family: 4
            }, {
              address: '::1',
              family: 6
            }];

            if (environmentVariables.DOCKER_HOST) {
              _context.next = 9;
              break;
            }

            return _context.abrupt("return", localhostAddresses);

          case 9:
            _context.prev = 9;
            parsedUrl = url.parse(environmentVariables.DOCKER_HOST);
            _context.next = 16;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](9);
            return _context.abrupt("return", localhostAddresses);

          case 16:
            if (parsedUrl.hostname) {
              _context.next = 18;
              break;
            }

            return _context.abrupt("return", localhostAddresses);

          case 18:
            _context.next = 20;
            return getIpAddresses(parsedUrl.hostname);

          case 20:
            addresses = _context.sent;
            return _context.abrupt("return", addresses);

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[9, 13]]);
  }));

  return function getHostIpAddresses(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getHostIpAddresses;