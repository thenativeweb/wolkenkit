'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var isInUse = require('./isInUse'),
    isPartiallyInUse = require('./isPartiallyInUse');

var getUsageStatus =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, forVersion, isRuntimeInUse, isRuntimePartiallyInUse, usageStatus;
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
            return isInUse({
              configuration: configuration,
              forVersion: forVersion
            });

          case 7:
            isRuntimeInUse = _context.sent;
            _context.next = 10;
            return isPartiallyInUse({
              configuration: configuration,
              forVersion: forVersion
            });

          case 10:
            isRuntimePartiallyInUse = _context.sent;
            usageStatus = 'not-used';

            if (isRuntimeInUse) {
              usageStatus = 'used';
            }

            if (isRuntimePartiallyInUse) {
              usageStatus = 'partially-used';
            }

            return _context.abrupt("return", usageStatus);

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getUsageStatus(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getUsageStatus;