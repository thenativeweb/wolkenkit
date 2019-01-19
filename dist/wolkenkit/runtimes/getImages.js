'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var errors = require('../../errors');

var readdir = promisify(fs.readdir),
    stat = promisify(fs.stat);

var getImages =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref) {
    var forVersion, pathRuntime, entries, images;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            forVersion = _ref.forVersion;

            if (forVersion) {
              _context2.next = 3;
              break;
            }

            throw new Error('Version is missing.');

          case 3:
            pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);
            _context2.prev = 4;
            _context2.next = 7;
            return readdir(pathRuntime);

          case 7:
            entries = _context2.sent;
            _context2.next = 17;
            break;

          case 10:
            _context2.prev = 10;
            _context2.t0 = _context2["catch"](4);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'ENOENT' ? 15 : 16;
            break;

          case 15:
            throw new errors.VersionNotFound();

          case 16:
            throw _context2.t0;

          case 17:
            _context2.next = 19;
            return Promise.all(entries.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(entry) {
                var pathImage, isDirectory, image;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        pathImage = path.join(pathRuntime, entry);
                        _context.next = 3;
                        return stat(pathImage);

                      case 3:
                        isDirectory = _context.sent.isDirectory();

                        if (isDirectory) {
                          _context.next = 6;
                          break;
                        }

                        return _context.abrupt("return");

                      case 6:
                        /* eslint-disable global-require */
                        image = require(path.join(pathImage, 'image'));
                        /* eslint-enable global-require */

                        return _context.abrupt("return", image());

                      case 8:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 19:
            _context2.t2 = function (image) {
              return image;
            };

            images = _context2.sent.filter(_context2.t2);
            return _context2.abrupt("return", images);

          case 22:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[4, 10]]);
  }));

  return function getImages(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getImages;