'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var runtimes = require('../../runtimes'),
    shared = require('../shared');

var ls =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref, progress) {
    var directory, env, configuration, supportedVersions, installedVersions;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            directory = _ref.directory, env = _ref.env;

            if (directory) {
              _context2.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            if (env) {
              _context2.next = 5;
              break;
            }

            throw new Error('Environment is missing.');

          case 5:
            if (progress) {
              _context2.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            _context2.next = 9;
            return shared.getConfiguration({
              directory: directory,
              env: env,
              isPackageJsonRequired: false
            }, progress);

          case 9:
            configuration = _context2.sent;
            _context2.next = 12;
            return shared.checkDocker({
              configuration: configuration
            }, progress);

          case 12:
            _context2.next = 14;
            return runtimes.getAllVersions();

          case 14:
            supportedVersions = _context2.sent;
            installedVersions = [];
            _context2.next = 18;
            return Promise.all(supportedVersions.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
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

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 18:
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

          case 20:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function ls(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = ls;