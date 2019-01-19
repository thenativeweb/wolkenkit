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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var directory,
        env,
        progress,
        configuration,
        applicationAddresses,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, env = _ref.env;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            _context.next = 8;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 8:
            configuration = _context.sent;
            _context.next = 11;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 11:
            _context.next = 13;
            return resolveHost({
              configuration: configuration
            }, progress);

          case 13:
            applicationAddresses = _context.sent;
            _context.next = 16;
            return checkDockerServerResolvesToApplicationAddresses({
              configuration: configuration,
              applicationAddresses: applicationAddresses
            }, progress);

          case 16:
            _context.next = 18;
            return checkCertificate({
              configuration: configuration,
              directory: directory
            }, progress);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function health(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = health;