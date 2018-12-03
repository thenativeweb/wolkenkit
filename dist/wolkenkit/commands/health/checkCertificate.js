'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var application = require('../../../application'),
    errors = require('../../../errors'),
    _require = require('../../../certificate'),
    isNameMatching = _require.isNameMatching;

var checkCertificate =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var configuration, env, directory, host, certificate, now;
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
            _context.prev = 12;
            _context.next = 15;
            return application.getCertificate({
              directory: directory,
              configuration: configuration,
              env: env
            });

          case 15:
            certificate = _context.sent;
            _context.next = 29;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context["catch"](12);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EDIRECTORYNOTFOUND' ? 23 : _context.t1 === 'EFILENOTFOUND' ? 25 : 27;
            break;

          case 23:
            progress({
              message: 'Application certificate directory not found.',
              type: 'info'
            });
            return _context.abrupt("break", 28);

          case 25:
            progress({
              message: 'Application certificate or private key not found.',
              type: 'info'
            });
            return _context.abrupt("break", 28);

          case 27:
            progress({
              message: _context.t0.message,
              type: 'info'
            });

          case 28:
            throw _context.t0;

          case 29:
            if (certificate.subject.commonName === certificate.issuer.commonName) {
              progress({
                message: 'Application certificate is self-signed.',
                type: 'warn'
              });
            }

            if (isNameMatching({
              certificate: certificate,
              name: host
            })) {
              _context.next = 33;
              break;
            }

            progress({
              message: "Application certificate does not match application host ".concat(host, "."),
              type: 'info'
            });
            throw new errors.CertificateMismatch();

          case 33:
            now = new Date();

            if (!(certificate.metadata.validTo < now)) {
              _context.next = 37;
              break;
            }

            progress({
              message: 'Application certificate has expired.',
              type: 'info'
            });
            throw new errors.CertificateExpired();

          case 37:
            if (!(now < certificate.metadata.validFrom)) {
              _context.next = 40;
              break;
            }

            progress({
              message: 'Application certificate is not yet valid.',
              type: 'info'
            });
            throw new errors.CertificateNotYetValid();

          case 40:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[12, 18]]);
  }));

  return function checkCertificate(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = checkCertificate;