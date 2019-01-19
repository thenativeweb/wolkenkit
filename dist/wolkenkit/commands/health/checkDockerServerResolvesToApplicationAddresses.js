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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, applicationAddresses, dockerAddresses;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, applicationAddresses = _ref.applicationAddresses;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (applicationAddresses) {
              _context.next = 5;
              break;
            }

            throw new Error('Application addresses are missing.');

          case 5:
            if (progress) {
              _context.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            _context.prev = 7;
            _context.next = 10;
            return docker.getHostIpAddresses({
              configuration: configuration
            });

          case 10:
            dockerAddresses = _context.sent;
            _context.next = 18;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](7);
            progress({
              message: _context.t0.message
            });
            progress({
              message: 'Failed to resolve Docker server.',
              type: 'info'
            });
            throw _context.t0;

          case 18:
            progress({
              message: "Docker server resolves to ".concat(arrayToSentence(dockerAddresses.map(function (ip) {
                return ip.address;
              })), ".")
            });

            if (!(intersectionWith(applicationAddresses, dockerAddresses, isEqual).length === 0)) {
              _context.next = 22;
              break;
            }

            progress({
              message: "Application and Docker server do not resolve to the same IP address.",
              type: 'info'
            });
            throw new errors.AddressMismatch();

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[7, 13]]);
  }));

  return function checkDockerServerResolvesToApplicationAddresses(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkDockerServerResolvesToApplicationAddresses;