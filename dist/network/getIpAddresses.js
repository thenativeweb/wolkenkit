'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var dns = require('dns');

var promisify = require('util.promisify');

var ip = require('./ip');

var lookup = promisify(dns.lookup);

var getIpAddresses = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(hostOrIp) {
    var addresses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (hostOrIp) {
              _context.next = 2;
              break;
            }

            throw new Error('Host or IP is missing.');

          case 2:
            if (!ip.is(hostOrIp)) {
              _context.next = 4;
              break;
            }

            return _context.abrupt('return', [{ address: hostOrIp, family: ip.getFamily(hostOrIp) }]);

          case 4:
            _context.next = 6;
            return lookup(hostOrIp, { all: true });

          case 6:
            addresses = _context.sent;
            return _context.abrupt('return', addresses);

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getIpAddresses(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getIpAddresses;