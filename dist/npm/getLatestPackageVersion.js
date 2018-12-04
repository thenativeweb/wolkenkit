'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var shell = require('../shell');

var getLatestPackageVersion =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(name) {
    var output, latestPackageVersion;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (name) {
              _context.next = 2;
              break;
            }

            throw new Error('Name is missing.');

          case 2:
            _context.next = 4;
            return shell.exec("npm view ".concat(name, " version"), {
              silent: true
            });

          case 4:
            output = _context.sent;
            latestPackageVersion = output.stdout.replace(/(\r\n|\n|\r)/gm, '');
            return _context.abrupt("return", latestPackageVersion);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getLatestPackageVersion(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getLatestPackageVersion;