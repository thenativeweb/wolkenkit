'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var arrayToSentence = require('array-to-sentence'),
    intersectionWith = require('lodash/intersectionWith'),
    isEqual = require('lodash/isEqual');

var docker = require('../../../docker'),
    errors = require('../../../errors');

var checkDockerServerResolvesToApplicationAddresses =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var configuration, env, applicationAddresses, dockerAddresses;
    return _regenerator.default.wrap(function _callee$(_context) {
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
            _context.prev = 11;
            _context.next = 14;
            return docker.getHostIpAddresses({
              configuration: configuration,
              env: env
            });

          case 14:
            dockerAddresses = _context.sent;
            _context.next = 22;
            break;

          case 17:
            _context.prev = 17;
            _context.t0 = _context["catch"](11);
            progress({
              message: _context.t0.message
            });
            progress({
              message: 'Failed to resolve Docker server.',
              type: 'info'
            });
            throw _context.t0;

          case 22:
            progress({
              message: "Docker server resolves to ".concat(arrayToSentence(dockerAddresses.map(function (ip) {
                return ip.address;
              })), ".")
            });

            if (!(intersectionWith(applicationAddresses, dockerAddresses, isEqual).length === 0)) {
              _context.next = 26;
              break;
            }

            progress({
              message: "Application and Docker server do not resolve to the same IP address.",
              type: 'info'
            });
            throw new errors.AddressMismatch();

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[11, 17]]);
  }));

  return function checkDockerServerResolvesToApplicationAddresses(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = checkDockerServerResolvesToApplicationAddresses;