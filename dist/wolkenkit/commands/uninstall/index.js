'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared');

var uninstall = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
    var _this = this;

    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, version, configuration, images, installationStatus, usageStatus, missingImages;
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
            if (options.directory) {
              _context2.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context2.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.version) {
              _context2.next = 8;
              break;
            }

            throw new Error('Version is missing.');

          case 8:
            directory = options.directory, env = options.env, version = options.version;
            _context2.next = 11;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: false
            }, progress);

          case 11:
            configuration = _context2.sent;
            _context2.next = 14;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 14:
            images = void 0;
            _context2.prev = 15;
            _context2.next = 18;
            return runtimes.getImages({ forVersion: version });

          case 18:
            images = _context2.sent;
            _context2.next = 30;
            break;

          case 21:
            _context2.prev = 21;
            _context2.t0 = _context2['catch'](15);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'EVERSIONNOTFOUND' ? 26 : 28;
            break;

          case 26:
            progress({ message: 'Version does not exist.', type: 'info' });
            return _context2.abrupt('break', 29);

          case 28:
            progress({ message: _context2.t0.message, type: 'info' });

          case 29:
            throw _context2.t0;

          case 30:
            _context2.next = 32;
            return runtimes.getInstallationStatus({ configuration: configuration, env: env, forVersion: version });

          case 32:
            installationStatus = _context2.sent;

            if (!(installationStatus === 'not-installed')) {
              _context2.next = 36;
              break;
            }

            progress({ message: 'wolkenkit ' + version + ' is not installed.', type: 'info' });

            throw new errors.RuntimeNotInstalled();

          case 36:
            _context2.next = 38;
            return runtimes.getUsageStatus({ configuration: configuration, env: env, forVersion: version });

          case 38:
            usageStatus = _context2.sent;

            if (!(usageStatus === 'used' || usageStatus === 'partially-used')) {
              _context2.next = 42;
              break;
            }

            progress({ message: 'wolkenkit ' + version + ' is being used.', type: 'info' });

            throw new errors.RuntimeInUse();

          case 42:
            _context2.next = 44;
            return runtimes.getMissingImages({ configuration: configuration, env: env, forVersion: version });

          case 44:
            missingImages = _context2.sent;
            _context2.next = 47;
            return _promise2.default.all(images.map(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(image) {
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        progress({ message: 'Deleting ' + image.name + ':' + image.version + '...' });

                        if (!missingImages.find(function (missingImage) {
                          return missingImage.name === image.name;
                        })) {
                          _context.next = 4;
                          break;
                        }

                        progress({ message: 'Image ' + image.name + ':' + image.version + ' is not installed.' });

                        return _context.abrupt('return');

                      case 4:
                        _context.prev = 4;
                        _context.next = 7;
                        return docker.removeImage({ configuration: configuration, env: env, name: image.name, version: image.version });

                      case 7:
                        _context.next = 13;
                        break;

                      case 9:
                        _context.prev = 9;
                        _context.t0 = _context['catch'](4);

                        progress({ message: 'Failed to delete ' + image.name + ':' + image.version + '.', type: 'info' });

                        throw _context.t0;

                      case 13:

                        progress({ message: 'Deleted ' + image.name + ':' + image.version + '.', type: 'info' });

                      case 14:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this, [[4, 9]]);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 47:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[15, 21]]);
  }));

  return function uninstall(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = uninstall;