'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var errors = require('../errors'),
    shell = require('../shell');

var getInstalledPackageVersion =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(name) {
    var installedVersion, output, regExp, matches;
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
            installedVersion = '0.0.0';
            _context.prev = 3;
            _context.next = 6;
            return shell.exec("npm list -g ".concat(name), {
              silent: true
            });

          case 6:
            output = _context.sent;
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](3);
            return _context.abrupt("return", installedVersion);

          case 12:
            regExp = new RegExp("".concat(name, "@(.*?)\\s"), 'gm');
            matches = regExp.exec(output.stdout);

            if (matches) {
              _context.next = 16;
              break;
            }

            throw new errors.OutputMalformed();

          case 16:
            installedVersion = matches[1];
            return _context.abrupt("return", installedVersion);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 9]]);
  }));

  return function getInstalledPackageVersion(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getInstalledPackageVersion;