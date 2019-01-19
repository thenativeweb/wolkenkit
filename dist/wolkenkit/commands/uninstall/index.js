'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared');

var uninstall =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref) {
    var directory,
        env,
        version,
        progress,
        configuration,
        images,
        installationStatus,
        usageStatus,
        missingImages,
        _args2 = arguments;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            directory = _ref.directory, env = _ref.env, version = _ref.version;
            progress = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : noop;

            if (directory) {
              _context2.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (env) {
              _context2.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (version) {
              _context2.next = 8;
              break;
            }

            throw new Error('Version is missing.');

          case 8:
            _context2.next = 10;
            return shared.getConfiguration({
              directory: directory,
              env: env,
              isPackageJsonRequired: false
            }, progress);

          case 10:
            configuration = _context2.sent;
            _context2.next = 13;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 13:
            _context2.prev = 13;
            _context2.next = 16;
            return runtimes.getImages({
              forVersion: version
            });

          case 16:
            images = _context2.sent;
            _context2.next = 28;
            break;

          case 19:
            _context2.prev = 19;
            _context2.t0 = _context2["catch"](13);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'EVERSIONNOTFOUND' ? 24 : 26;
            break;

          case 24:
            progress({
              message: 'Version does not exist.',
              type: 'info'
            });
            return _context2.abrupt("break", 27);

          case 26:
            progress({
              message: _context2.t0.message,
              type: 'info'
            });

          case 27:
            throw _context2.t0;

          case 28:
            _context2.next = 30;
            return runtimes.getInstallationStatus({
              configuration: configuration,
              forVersion: version
            });

          case 30:
            installationStatus = _context2.sent;

            if (!(installationStatus === 'not-installed')) {
              _context2.next = 34;
              break;
            }

            progress({
              message: "wolkenkit ".concat(version, " is not installed."),
              type: 'info'
            });
            throw new errors.RuntimeNotInstalled();

          case 34:
            _context2.next = 36;
            return runtimes.getUsageStatus({
              configuration: configuration,
              forVersion: version
            });

          case 36:
            usageStatus = _context2.sent;

            if (!(usageStatus === 'used' || usageStatus === 'partially-used')) {
              _context2.next = 40;
              break;
            }

            progress({
              message: "wolkenkit ".concat(version, " is being used."),
              type: 'info'
            });
            throw new errors.RuntimeInUse();

          case 40:
            _context2.next = 42;
            return runtimes.getMissingImages({
              configuration: configuration,
              forVersion: version
            });

          case 42:
            missingImages = _context2.sent;
            _context2.next = 45;
            return Promise.all(images.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(image) {
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        progress({
                          message: "Deleting ".concat(image.name, ":").concat(image.version, "...")
                        });

                        if (!missingImages.find(function (missingImage) {
                          return missingImage.name === image.name;
                        })) {
                          _context.next = 4;
                          break;
                        }

                        progress({
                          message: "Image ".concat(image.name, ":").concat(image.version, " is not installed.")
                        });
                        return _context.abrupt("return");

                      case 4:
                        _context.prev = 4;
                        _context.next = 7;
                        return docker.removeImage({
                          configuration: configuration,
                          name: image.name,
                          version: image.version
                        });

                      case 7:
                        _context.next = 13;
                        break;

                      case 9:
                        _context.prev = 9;
                        _context.t0 = _context["catch"](4);
                        progress({
                          message: "Failed to delete ".concat(image.name, ":").concat(image.version, "."),
                          type: 'info'
                        });
                        throw _context.t0;

                      case 13:
                        progress({
                          message: "Deleted ".concat(image.name, ":").concat(image.version, "."),
                          type: 'info'
                        });

                      case 14:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this, [[4, 9]]);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 45:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[13, 19]]);
  }));

  return function uninstall(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = uninstall;