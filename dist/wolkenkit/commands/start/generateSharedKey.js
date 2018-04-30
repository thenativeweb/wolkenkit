'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var crypto = require('crypto');

var promisify = require('util.promisify'),
    sha1 = require('sha1');

var randomBytes = promisify(crypto.randomBytes);

var generateSharedKey = function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
            var bytes, hex, sharedKey;
            return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                        switch (_context.prev = _context.next) {
                              case 0:
                                    _context.next = 2;
                                    return randomBytes(64);

                              case 2:
                                    bytes = _context.sent;
                                    hex = bytes.toString('hex');
                                    sharedKey = sha1(hex);
                                    return _context.abrupt('return', sharedKey);

                              case 6:
                              case 'end':
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