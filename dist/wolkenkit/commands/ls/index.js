'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared');

var ls =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(options) {
    var progress,
        directory,
        env,
        configuration,
        supportedVersions,
        installedVersions,
        _args2 = arguments;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            progress = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : noop;

            if (options) {
              _context2.next = 3;
              break;
            }

            throw new Error('Options are missing.');

          case 3:
            if (options.directory) {
              _context2.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            if (options.env) {
              _context2.next = 7;
              break;
            }

            throw new Error('Environment is missing.');

          case 7:
            directory = options.directory, env = options.env;
            _context2.next = 10;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: false
            }, progress);

          case 10:
            configuration = _context2.sent;
            _context2.next = 13;
            return shared.checkDocker({
              configuration: configuration,
              env: env
            }, progress);

          case 13:
            _context2.next = 15;
            return runtimes.getAllVersions();

          case 15:
            supportedVersions = _context2.sent;
            installedVersions = [];
            _context2.next = 19;
            return Promise.all(supportedVersions.map(
            /*#__PURE__*/
            function () {
              var _ref2 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(version) {
                var isInstalled;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return runtimes.isInstalled({
                          configuration: configuration,
                          env: env,
                          forVersion: version
                        });

                      case 2:
                        isInstalled = _context.sent;

                        if (isInstalled) {
                          installedVersions.push(version);
                        }

                      case 4:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 19:
            supportedVersions.forEach(function (version) {
              if (installedVersions.includes(version)) {
                return progress({
                  message: "".concat(version, " (installed)"),
                  type: 'list'
                });
              }

              progress({
                message: version,
                type: 'list'
              });
            });
            return _context2.abrupt("return", {
              supported: supportedVersions,
              installed: installedVersions
            });

          case 21:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function ls(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = ls;