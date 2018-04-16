'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var application = require('../../../application'),
    errors = require('../../../errors'),
    _require = require('../../../certificate'),
    isNameMatching = _require.isNameMatching;


var checkCertificate = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var configuration, env, directory, host, certificate, now;
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
            if (options.directory) {
              _context.next = 8;
              break;
            }

            throw new Error('Directory is missing.');

          case 8:
            if (progress) {
              _context.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            configuration = options.configuration, env = options.env, directory = options.directory;
            host = configuration.environments[env].api.address.host;
            certificate = void 0;
            _context.prev = 13;
            _context.next = 16;
            return application.getCertificate({ directory: directory, configuration: configuration, env: env });

          case 16:
            certificate = _context.sent;
            _context.next = 30;
            break;

          case 19:
            _context.prev = 19;
            _context.t0 = _context['catch'](13);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EDIRECTORYNOTFOUND' ? 24 : _context.t1 === 'EFILENOTFOUND' ? 26 : 28;
            break;

          case 24:
            progress({ message: 'Application certificate directory not found.', type: 'info' });
            return _context.abrupt('break', 29);

          case 26:
            progress({ message: 'Application certificate or private key not found.', type: 'info' });
            return _context.abrupt('break', 29);

          case 28:
            progress({ message: _context.t0.message, type: 'info' });

          case 29:
            throw _context.t0;

          case 30:

            if (certificate.subject.commonName === certificate.issuer.commonName) {
              progress({ message: 'Application certificate is self-signed.', type: 'warn' });
            }

            if (isNameMatching({ certificate: certificate, name: host })) {
              _context.next = 34;
              break;
            }

            progress({ message: 'Application certificate does not match application host ' + host + '.', type: 'info' });
            throw new errors.CertificateMismatch();

          case 34:
            now = new Date();

            if (!(certificate.metadata.validTo < now)) {
              _context.next = 38;
              break;
            }

            progress({ message: 'Application certificate has expired.', type: 'info' });
            throw new errors.CertificateExpired();

          case 38:
            if (!(now < certificate.metadata.validFrom)) {
              _context.next = 41;
              break;
            }

            progress({ message: 'Application certificate is not yet valid.', type: 'info' });
            throw new errors.CertificateNotYetValid();

          case 41:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 19]]);
  }));

  return function checkCertificate(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = checkCertificate;