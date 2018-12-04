'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var arrayToSentence = require('array-to-sentence');

var network = require('../../../network');

var resolveHost =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var configuration, env, host, addresses;
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
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            configuration = options.configuration, env = options.env;
            host = configuration.environments[env].api.address.host;
            _context.prev = 10;
            _context.next = 13;
            return network.getIpAddresses(host);

          case 13:
            addresses = _context.sent;
            _context.next = 21;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context["catch"](10);
            progress({
              message: _context.t0.message
            });
            progress({
              message: "Failed to resolve ".concat(host, "."),
              type: 'info'
            });
            throw _context.t0;

          case 21:
            progress({
              message: "Application host ".concat(host, " resolves to ").concat(arrayToSentence(addresses.map(function (ip) {
                return ip.address;
              })), ".")
            });
            return _context.abrupt("return", addresses);

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[10, 16]]);
  }));

  return function resolveHost(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = resolveHost;