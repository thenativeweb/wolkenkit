'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var certificateDetails = require('certificate-details'),
    promisify = require('util.promisify');

var errors = require('../errors'),
    getCertificateDirectory = require('./getCertificateDirectory');

var getCertificateDetails = promisify(certificateDetails.get);

var getCertificate =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var directory, configuration, env, certificateDirectory, certificate;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.configuration) {
              _context.next = 6;
              break;
            }

            throw new Error('Configuration is missing.');

          case 6:
            if (options.env) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            directory = options.directory, configuration = options.configuration, env = options.env;

            if (configuration.environments[env]) {
              _context.next = 11;
              break;
            }

            throw new errors.EnvironmentNotFound();

          case 11:
            _context.next = 13;
            return getCertificateDirectory({
              directory: directory,
              configuration: configuration,
              env: env
            });

          case 13:
            certificateDirectory = _context.sent;
            _context.prev = 14;
            _context.next = 17;
            return getCertificateDetails(certificateDirectory);

          case 17:
            certificate = _context.sent;
            _context.next = 25;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](14);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 24;
              break;
            }

            throw new errors.FileNotFound();

          case 24:
            throw _context.t0;

          case 25:
            return _context.abrupt("return", certificate);

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[14, 20]]);
  }));

  return function getCertificate(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getCertificate;