'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs');

var promisify = require('util.promisify');

var statFile = promisify(fs.stat);

var stat =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(path) {
    var stats;
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
            _context.next = 4;
            return statFile(path);

          case 4:
            stats = _context.sent;
            return _context.abrupt("return", stats);

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function stat(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = stat;