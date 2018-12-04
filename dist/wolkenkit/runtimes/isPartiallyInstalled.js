'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getImages = require('./getImages'),
    getMissingImages = require('./getMissingImages');

var isPartiallyInstalled =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options) {
    var configuration, env, forVersion, images, missingImages, isRuntimePartiallyInstalled;
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
            if (options.forVersion) {
              _context.next = 8;
              break;
            }

            throw new Error('Version is missing.');

          case 8:
            configuration = options.configuration, env = options.env, forVersion = options.forVersion;
            _context.next = 11;
            return getImages({
              forVersion: forVersion
            });

          case 11:
            images = _context.sent;
            _context.next = 14;
            return getMissingImages({
              configuration: configuration,
              env: env,
              forVersion: forVersion
            });

          case 14:
            missingImages = _context.sent;
            isRuntimePartiallyInstalled = missingImages.length !== 0 && missingImages.length !== images.length;
            return _context.abrupt("return", isRuntimePartiallyInstalled);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function isPartiallyInstalled(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = isPartiallyInstalled;