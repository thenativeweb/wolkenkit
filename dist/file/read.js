'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');

var promisify = require('util.promisify');

var errors = require('../errors');

var readFile = promisify(fs.readFile);

var read = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(path) {
    var data;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (path) {
              _context.next = 2;
              break;
            }

            throw new Error('Path is missing.');

          case 2:
            data = void 0;
            _context.prev = 3;
            _context.next = 6;
            return readFile(path, { encoding: 'utf8' });

          case 6:
            data = _context.sent;
            _context.next = 17;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](3);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'ENOENT' ? 14 : _context.t1 === 'EACCES' ? 15 : 16;
            break;

          case 14:
            throw new errors.FileNotFound();

          case 15:
            throw new errors.FileNotAccessible();

          case 16:
            throw _context.t0;

          case 17:
            return _context.abrupt('return', data);

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 9]]);
  }));

  return function read(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = read;