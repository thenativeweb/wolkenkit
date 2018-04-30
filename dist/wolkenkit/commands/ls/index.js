'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared');

var ls = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
    var _this = this;

    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var directory, env, configuration, supportedVersions, installedVersions;
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
            directory = options.directory, env = options.env;
            _context2.next = 9;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: false
            }, progress);

          case 9:
            configuration = _context2.sent;
            _context2.next = 12;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 12:
            _context2.next = 14;
            return runtimes.getAllVersions();

          case 14:
            supportedVersions = _context2.sent;
            installedVersions = [];
            _context2.next = 18;
            return _promise2.default.all(supportedVersions.map(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(version) {
                var isInstalled;
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return runtimes.isInstalled({ configuration: configuration, env: env, forVersion: version });

                      case 2:
                        isInstalled = _context.sent;


                        if (isInstalled) {
                          installedVersions.push(version);
                        }

                      case 4:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 18:

            supportedVersions.forEach(function (version) {
              if (installedVersions.includes(version)) {
                return progress({ message: version + ' (installed)', type: 'list' });
              }

              progress({ message: version, type: 'list' });
            });

            return _context2.abrupt('return', { supported: supportedVersions, installed: installedVersions });

          case 20:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function ls(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = ls;