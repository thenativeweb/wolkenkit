'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = require('../errors'),
    read = require('./read');

var readJson = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(path) {
    var data, json;
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
            _context.next = 4;
            return read(path);

          case 4:
            data = _context.sent;
            json = void 0;
            _context.prev = 6;

            json = JSON.parse(data);
            _context.next = 13;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context['catch'](6);
            throw new errors.JsonMalformed();

          case 13:
            return _context.abrupt('return', json);

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[6, 10]]);
  }));

  return function readJson(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = readJson;