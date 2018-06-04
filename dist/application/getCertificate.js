'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var certificateDetails = require('certificate-details'),
    promisify = require('util.promisify');

var errors = require('../errors'),
    getCertificateDirectory = require('./getCertificateDirectory');

var getCertificateDetails = promisify(certificateDetails.get);

var getCertificate = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var directory, configuration, env, certificateDirectory, certificate;
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
            return getCertificateDirectory({ directory: directory, configuration: configuration, env: env });

          case 13:
            certificateDirectory = _context.sent;
            certificate = void 0;
            _context.prev = 15;
            _context.next = 18;
            return getCertificateDetails(certificateDirectory);

          case 18:
            certificate = _context.sent;
            _context.next = 26;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context['catch'](15);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 25;
              break;
            }

            throw new errors.FileNotFound();

          case 25:
            throw _context.t0;

          case 26:
            return _context.abrupt('return', certificate);

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[15, 21]]);
  }));

  return function getCertificate(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getCertificate;