'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var checkCertificate = require('./checkCertificate'),
    checkDockerServerResolvesToApplicationAddresses = require('./checkDockerServerResolvesToApplicationAddresses'),
    noop = require('../../../noop'),
    resolveHost = require('./resolveHost'),
    shared = require('../shared');

var health =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var progress,
        directory,
        env,
        configuration,
        applicationAddresses,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (options) {
              _context.next = 3;
              break;
            }

            throw new Error('Options are missing.');

          case 3:
            if (options.directory) {
              _context.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (options.env) {
              _context.next = 7;
              break;
            }

            throw new Error('Environment is missing.');

          case 7:
            directory = options.directory, env = options.env;
            _context.next = 10;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 10:
            configuration = _context.sent;
            _context.next = 13;
            return shared.checkDocker({
              configuration: configuration,
              env: env
            }, progress);

          case 13:
            _context.next = 15;
            return resolveHost({
              configuration: configuration,
              env: env
            }, progress);

          case 15:
            applicationAddresses = _context.sent;
            _context.next = 18;
            return checkDockerServerResolvesToApplicationAddresses({
              configuration: configuration,
              env: env,
              applicationAddresses: applicationAddresses
            }, progress);

          case 18:
            _context.next = 20;
            return checkCertificate({
              configuration: configuration,
              env: env,
              directory: directory
            }, progress);

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function health(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = health;