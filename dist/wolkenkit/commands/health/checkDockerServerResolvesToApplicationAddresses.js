'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var arrayToSentence = require('array-to-sentence'),
    intersectionWith = require('lodash/intersectionWith'),
    isEqual = require('lodash/isEqual');

var docker = require('../../../docker'),
    errors = require('../../../errors');

var checkDockerServerResolvesToApplicationAddresses = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var configuration, env, applicationAddresses, dockerAddresses;
    return _regenerator2.default.wrap(function _callee$(_context) {
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
            if (options.applicationAddresses) {
              _context.next = 8;
              break;
            }

            throw new Error('Application addresses are missing.');

          case 8:
            if (progress) {
              _context.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            configuration = options.configuration, env = options.env, applicationAddresses = options.applicationAddresses;
            dockerAddresses = void 0;
            _context.prev = 12;
            _context.next = 15;
            return docker.getHostIpAddresses({ configuration: configuration, env: env });

          case 15:
            dockerAddresses = _context.sent;
            _context.next = 23;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context['catch'](12);

            progress({ message: _context.t0.message });
            progress({ message: 'Failed to resolve Docker server.', type: 'info' });

            throw _context.t0;

          case 23:

            progress({ message: 'Docker server resolves to ' + arrayToSentence(dockerAddresses.map(function (ip) {
                return ip.address;
              })) + '.' });

            if (!(intersectionWith(applicationAddresses, dockerAddresses, isEqual).length === 0)) {
              _context.next = 27;
              break;
            }

            progress({ message: 'Application and Docker server do not resolve to the same IP address.', type: 'info' });

            throw new errors.AddressMismatch();

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[12, 18]]);
  }));

  return function checkDockerServerResolvesToApplicationAddresses(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = checkDockerServerResolvesToApplicationAddresses;