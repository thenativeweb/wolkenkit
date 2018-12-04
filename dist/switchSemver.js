'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var semver = require('semver');

var switchSemver =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(version, handlers) {
    var _arr, _i, _arr$_i, range, handler;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (version) {
              _context.next = 2;
              break;
            }

            throw new Error('Version is missing.');

          case 2:
            if (handlers) {
              _context.next = 4;
              break;
            }

            throw new Error('Handlers are missing.');

          case 4:
            if (handlers.default) {
              _context.next = 6;
              break;
            }

            throw new Error('Default is missing.');

          case 6:
            if (semver.valid(version)) {
              _context.next = 10;
              break;
            }

            _context.next = 9;
            return handlers.default();

          case 9:
            return _context.abrupt("return", _context.sent);

          case 10:
            _arr = Object.entries(handlers);
            _i = 0;

          case 12:
            if (!(_i < _arr.length)) {
              _context.next = 21;
              break;
            }

            _arr$_i = (0, _slicedToArray2.default)(_arr[_i], 2), range = _arr$_i[0], handler = _arr$_i[1];

            if (!semver.satisfies(version, range)) {
              _context.next = 18;
              break;
            }

            _context.next = 17;
            return handler();

          case 17:
            return _context.abrupt("return", _context.sent);

          case 18:
            _i++;
            _context.next = 12;
            break;

          case 21:
            _context.next = 23;
            return handlers.default();

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function switchSemver(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = switchSemver;