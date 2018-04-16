'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var checkCertificate = require('./checkCertificate'),
    checkDockerServerResolvesToApplicationAddresses = require('./checkDockerServerResolvesToApplicationAddresses'),
    noop = require('../../../noop'),
    resolveHost = require('./resolveHost'),
    shared = require('../shared');

var health = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, configuration, applicationAddresses;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            directory = options.directory, env = options.env;
            _context.next = 9;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 9:
            configuration = _context.sent;
            _context.next = 12;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 12:
            _context.next = 14;
            return resolveHost({ configuration: configuration, env: env }, progress);

          case 14:
            applicationAddresses = _context.sent;
            _context.next = 17;
            return checkDockerServerResolvesToApplicationAddresses({ configuration: configuration, env: env, applicationAddresses: applicationAddresses }, progress);

          case 17:
            _context.next = 19;
            return checkCertificate({ configuration: configuration, env: env, directory: directory }, progress);

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function health(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = health;