'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var shell = require('../shell');

var installPackage =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(packageName, version) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (packageName) {
              _context.next = 2;
              break;
            }

            throw new Error('Name is missing.');

          case 2:
            if (version) {
              _context.next = 4;
              break;
            }

            throw new Error('Version is missing.');

          case 4:
            _context.next = 6;
            return shell.exec("npm install -g ".concat(packageName, "@").concat(version), {
              silent: true
            });

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function installPackage(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = installPackage;