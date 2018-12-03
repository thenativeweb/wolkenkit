'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs');

var promisify = require('util.promisify');

var errors = require('../errors');

var readFile = promisify(fs.readFile);

var read =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(path) {
    var data;
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
            return readFile(path, {
              encoding: 'utf8'
            });

          case 5:
            data = _context.sent;
            _context.next = 16;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](2);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'ENOENT' ? 13 : _context.t1 === 'EACCES' ? 14 : 15;
            break;

          case 13:
            throw new errors.FileNotFound();

          case 14:
            throw new errors.FileNotAccessible();

          case 15:
            throw _context.t0;

          case 16:
            return _context.abrupt("return", data);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 8]]);
  }));

  return function read(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = read;