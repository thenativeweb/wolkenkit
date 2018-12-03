'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var shell = require('shelljs');

var cp =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, source, target) {
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
            if (source) {
              _context.next = 4;
              break;
            }

            throw new Error('Source is missing.');

          case 4:
            if (target) {
              _context.next = 6;
              break;
            }

            throw new Error('Target is missing.');

          case 6:
            shell.cp(options, source, target);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function cp(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cp;