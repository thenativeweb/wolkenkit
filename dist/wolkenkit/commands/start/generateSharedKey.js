'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var crypto = require('crypto');

var promisify = require('util.promisify'),
    sha1 = require('sha1');

var randomBytes = promisify(crypto.randomBytes);

var generateSharedKey = function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            var bytes, hex, sharedKey;
            return regeneratorRuntime.wrap(function _callee$(_context) {
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