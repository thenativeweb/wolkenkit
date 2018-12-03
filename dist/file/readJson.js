'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var errors = require('../errors'),
    read = require('./read');

var readJson =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(path) {
    var data, json;
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
            return read(path);

          case 4:
            data = _context.sent;
            _context.prev = 5;
            json = JSON.parse(data);
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](5);
            throw new errors.JsonMalformed();

          case 12:
            return _context.abrupt("return", json);

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[5, 9]]);
  }));

  return function readJson(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = readJson;