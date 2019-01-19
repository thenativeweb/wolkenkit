'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var isInstalled = require('./isInstalled'),
    isPartiallyInstalled = require('./isPartiallyInstalled');

var getInstallationStatus =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, forVersion, isRuntimeInstalled, isRuntimePartiallyInstalled, installationStatus;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, forVersion = _ref.forVersion;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (forVersion) {
              _context.next = 5;
              break;
            }

            throw new Error('Version is missing.');

          case 5:
            _context.next = 7;
            return isInstalled({
              configuration: configuration,
              forVersion: forVersion
            });

          case 7:
            isRuntimeInstalled = _context.sent;
            _context.next = 10;
            return isPartiallyInstalled({
              configuration: configuration,
              forVersion: forVersion
            });

          case 10:
            isRuntimePartiallyInstalled = _context.sent;
            installationStatus = 'not-installed';

            if (isRuntimeInstalled) {
              installationStatus = 'installed';
            }

            if (isRuntimePartiallyInstalled) {
              installationStatus = 'partially-installed';
            }

            return _context.abrupt("return", installationStatus);

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getInstallationStatus(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getInstallationStatus;