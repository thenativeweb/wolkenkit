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
    var _i, _Object$entries, _Object$entries$_i, range, handler;

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
            _i = 0, _Object$entries = Object.entries(handlers);

          case 11:
            if (!(_i < _Object$entries.length)) {
              _context.next = 20;
              break;
            }

            _Object$entries$_i = (0, _slicedToArray2.default)(_Object$entries[_i], 2), range = _Object$entries$_i[0], handler = _Object$entries$_i[1];

            if (!semver.satisfies(version, range)) {
              _context.next = 17;
              break;
            }

            _context.next = 16;
            return handler();

          case 16:
            return _context.abrupt("return", _context.sent);

          case 17:
            _i++;
            _context.next = 11;
            break;

          case 20:
            _context.next = 22;
            return handlers.default();

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function switchSemver(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = switchSemver;