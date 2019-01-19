'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../docker'),
    getImages = require('./getImages');

var getMissingImages =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, forVersion, missingImages, images, i, image, name, version, isInstalled;
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
            missingImages = [];
            _context.next = 8;
            return getImages({
              forVersion: forVersion
            });

          case 8:
            images = _context.sent;
            i = 0;

          case 10:
            if (!(i < images.length)) {
              _context.next = 22;
              break;
            }

            image = images[i];
            name = image.name, version = image.version;
            _context.next = 15;
            return docker.isImageInstalled({
              configuration: configuration,
              name: name,
              version: version
            });

          case 15:
            isInstalled = _context.sent;

            if (!isInstalled) {
              _context.next = 18;
              break;
            }

            return _context.abrupt("continue", 19);

          case 18:
            missingImages.push(image);

          case 19:
            i++;
            _context.next = 10;
            break;

          case 22:
            return _context.abrupt("return", missingImages);

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getMissingImages(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getMissingImages;