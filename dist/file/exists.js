'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs');

var promisify = require('util.promisify');

var statFile = promisify(fs.stat);

var exists =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(path) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (path) {
              _context.next = 2;
              break;
            }

            throw new Error('Path is missing.');

          case 2:
            _context.prev = 2;
            _context.next = 5;
            return statFile(path);

          case 5:
            _context.next = 12;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](2);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 11;
              break;
            }

            return _context.abrupt("return", false);

          case 11:
            throw _context.t0;

          case 12:
            return _context.abrupt("return", true);

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 7]]);
  }));

  return function exists(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = exists;