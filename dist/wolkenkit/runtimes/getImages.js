'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var errors = require('../../errors');

var readdir = promisify(fs.readdir),
    stat = promisify(fs.stat);

var getImages = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
    var _this = this;

    var forVersion, pathRuntime, entries, images;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (options) {
              _context2.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.forVersion) {
              _context2.next = 4;
              break;
            }

            throw new Error('Version is missing.');

          case 4:
            forVersion = options.forVersion;
            pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);
            entries = void 0;
            _context2.prev = 7;
            _context2.next = 10;
            return readdir(pathRuntime);

          case 10:
            entries = _context2.sent;
            _context2.next = 20;
            break;

          case 13:
            _context2.prev = 13;
            _context2.t0 = _context2['catch'](7);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'ENOENT' ? 18 : 19;
            break;

          case 18:
            throw new errors.VersionNotFound();

          case 19:
            throw _context2.t0;

          case 20:
            _context2.next = 22;
            return _promise2.default.all(entries.map(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(entry) {
                var pathImage, isDirectory, image;
                return _regenerator2.default.wrap(function _callee$(_context) {
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

                        return _context.abrupt('return');

                      case 6:

                        /* eslint-disable global-require */
                        image = require(path.join(pathImage, 'image'));
                        /* eslint-enable global-require */

                        return _context.abrupt('return', image());

                      case 8:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x2) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 22:
            _context2.t2 = function (image) {
              return image;
            };

            images = _context2.sent.filter(_context2.t2);
            return _context2.abrupt('return', images);

          case 25:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[7, 13]]);
  }));

  return function getImages(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getImages;