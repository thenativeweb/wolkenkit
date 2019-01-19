'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var certificateDetails = require('certificate-details'),
    promisify = require('util.promisify');

var errors = require('../../errors'),
    getCertificateDirectory = require('./getCertificateDirectory');

var getCertificateDetails = promisify(certificateDetails.get);

var getCertificate =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, directory, certificateDirectory, certificate;
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
            _context.next = 7;
            return getCertificateDirectory({
              configuration: configuration,
              directory: directory
            });

          case 7:
            certificateDirectory = _context.sent;
            _context.prev = 8;
            _context.next = 11;
            return getCertificateDetails(certificateDirectory);

          case 11:
            certificate = _context.sent;
            _context.next = 19;
            break;

          case 14:
            _context.prev = 14;
            _context.t0 = _context["catch"](8);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 18;
              break;
            }

            throw new errors.FileNotFound();

          case 18:
            throw _context.t0;

          case 19:
            return _context.abrupt("return", certificate);

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[8, 14]]);
  }));

  return function getCertificate(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getCertificate;