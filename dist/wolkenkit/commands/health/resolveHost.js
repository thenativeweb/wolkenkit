'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var arrayToSentence = require('array-to-sentence');

var network = require('../../../network');

var resolveHost =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, host, addresses;
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
            if (progress) {
              _context.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            host = configuration.api.host.name;
            _context.prev = 6;
            _context.next = 9;
            return network.getIpAddresses(host);

          case 9:
            addresses = _context.sent;
            _context.next = 17;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](6);
            progress({
              message: _context.t0.message
            });
            progress({
              message: "Failed to resolve ".concat(host, "."),
              type: 'info'
            });
            throw _context.t0;

          case 17:
            progress({
              message: "Application host ".concat(host, " resolves to ").concat(arrayToSentence(addresses.map(function (ip) {
                return ip.address;
              })), ".")
            });
            return _context.abrupt("return", addresses);

          case 19:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[6, 12]]);
  }));

  return function resolveHost(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = resolveHost;