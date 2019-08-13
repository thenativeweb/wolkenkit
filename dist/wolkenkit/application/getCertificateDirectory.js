'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var defaults = require('../defaults.json'),
    errors = require('../../errors');

var access = promisify(fs.access);

var getCertificateDirectory =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, directory, certificateDirectory;
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
            certificateDirectory = path.join(directory, configuration.api.host.certificate);
            _context.prev = 6;
            _context.next = 9;
            return access(certificateDirectory, fs.constants.R_OK);

          case 9:
            _context.next = 16;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](6);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 15;
              break;
            }

            throw new errors.DirectoryNotFound();

          case 15:
            throw _context.t0;

          case 16:
            return _context.abrupt("return", certificateDirectory);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[6, 11]]);
  }));

  return function getCertificateDirectory(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getCertificateDirectory;