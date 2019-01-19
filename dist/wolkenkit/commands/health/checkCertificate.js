'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var application = require('../../application'),
    errors = require('../../../errors'),
    _require = require('../../../certificate'),
    isNameMatching = _require.isNameMatching;

var checkCertificate =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, directory, host, certificate, now;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, directory = _ref.directory;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (directory) {
              _context.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (progress) {
              _context.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            host = configuration.api.host.name;
            _context.prev = 8;
            _context.next = 11;
            return application.getCertificate({
              configuration: configuration,
              directory: directory
            });

          case 11:
            certificate = _context.sent;
            _context.next = 25;
            break;

          case 14:
            _context.prev = 14;
            _context.t0 = _context["catch"](8);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EDIRECTORYNOTFOUND' ? 19 : _context.t1 === 'EFILENOTFOUND' ? 21 : 23;
            break;

          case 19:
            progress({
              message: 'Application certificate directory not found.',
              type: 'info'
            });
            return _context.abrupt("break", 24);

          case 21:
            progress({
              message: 'Application certificate or private key not found.',
              type: 'info'
            });
            return _context.abrupt("break", 24);

          case 23:
            progress({
              message: _context.t0.message,
              type: 'info'
            });

          case 24:
            throw _context.t0;

          case 25:
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
              _context.next = 29;
              break;
            }

            progress({
              message: "Application certificate does not match application host ".concat(host, "."),
              type: 'info'
            });
            throw new errors.CertificateMismatch();

          case 29:
            now = new Date();

            if (!(certificate.metadata.validTo < now)) {
              _context.next = 33;
              break;
            }

            progress({
              message: 'Application certificate has expired.',
              type: 'info'
            });
            throw new errors.CertificateExpired();

          case 33:
            if (!(now < certificate.metadata.validFrom)) {
              _context.next = 36;
              break;
            }

            progress({
              message: 'Application certificate is not yet valid.',
              type: 'info'
            });
            throw new errors.CertificateNotYetValid();

          case 36:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[8, 14]]);
  }));

  return function checkCertificate(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkCertificate;