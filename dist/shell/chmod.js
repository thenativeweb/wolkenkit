'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var shell = require('shelljs');

var chmod =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(mode, file) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (mode) {
              _context.next = 2;
              break;
            }

            throw new Error('Mode is missing.');

          case 2:
            if (file) {
              _context.next = 4;
              break;
            }

            throw new Error('File is missing.');

          case 4:
            shell.chmod(mode, file);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function chmod(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = chmod;