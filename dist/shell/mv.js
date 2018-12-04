'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var shell = require('shelljs');

var mv =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, source, destination) {
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
            if (destination) {
              _context.next = 6;
              break;
            }

            throw new Error('Destination is missing.');

          case 6:
            shell.mv(options, source, destination);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function mv(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = mv;