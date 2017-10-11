'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var arrayToSentence = require('array-to-sentence');

var network = require('../../../network');

var resolveHost = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options, progress) {
    var configuration, env, host, addresses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            configuration = options.configuration, env = options.env;
            host = configuration.environments[env].api.address.host;
            addresses = void 0;
            _context.prev = 11;
            _context.next = 14;
            return network.getIpAddresses(host);

          case 14:
            addresses = _context.sent;
            _context.next = 22;
            break;

          case 17:
            _context.prev = 17;
            _context.t0 = _context['catch'](11);

            progress({ message: _context.t0.message });
            progress({ message: 'Failed to resolve ' + host + '.', type: 'info' });

            throw _context.t0;

          case 22:

            progress({ message: 'Application host ' + host + ' resolves to ' + arrayToSentence(addresses.map(function (ip) {
                return ip.address;
              })) + '.' });

            return _context.abrupt('return', addresses);

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[11, 17]]);
  }));

  return function resolveHost(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = resolveHost;