'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var crypto = require('crypto');

var promisify = require('util.promisify'),
    sha1 = require('sha1');

var randomBytes = promisify(crypto.randomBytes);

var generateSharedKey =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var bytes, hex, sharedKey;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return randomBytes(64);

          case 2:
            bytes = _context.sent;
            hex = bytes.toString('hex');
            sharedKey = sha1(hex);
            return _context.abrupt("return", sharedKey);

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function generateSharedKey() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = generateSharedKey;