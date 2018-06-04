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

var getContainers = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
    var _this = this;

    var forVersion, configuration, env, sharedKey, persistData, debug, pathRuntime, entries, containers;
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
            if (options.configuration) {
              _context2.next = 6;
              break;
            }

            throw new Error('Configuration is missing.');

          case 6:
            if (options.env) {
              _context2.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            if (options.sharedKey) {
              _context2.next = 10;
              break;
            }

            throw new Error('Shared key is missing.');

          case 10:
            if (!(options.persistData === undefined)) {
              _context2.next = 12;
              break;
            }

            throw new Error('Persist data is missing.');

          case 12:
            if (!(options.debug === undefined)) {
              _context2.next = 14;
              break;
            }

            throw new Error('Debug is missing.');

          case 14:
            forVersion = options.forVersion, configuration = options.configuration, env = options.env, sharedKey = options.sharedKey, persistData = options.persistData, debug = options.debug;
            pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);
            entries = void 0;
            _context2.prev = 17;
            _context2.next = 20;
            return readdir(pathRuntime);

          case 20:
            entries = _context2.sent;
            _context2.next = 30;
            break;

          case 23:
            _context2.prev = 23;
            _context2.t0 = _context2['catch'](17);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'ENOENT' ? 28 : 29;
            break;

          case 28:
            throw new errors.VersionNotFound();

          case 29:
            throw _context2.t0;

          case 30:
            _context2.next = 32;
            return _promise2.default.all(entries.map(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(entry) {
                var pathContainer, isDirectory, container;
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        pathContainer = path.join(pathRuntime, entry);
                        _context.next = 3;
                        return stat(pathContainer);

                      case 3:
                        isDirectory = _context.sent.isDirectory();

                        if (isDirectory) {
                          _context.next = 6;
                          break;
                        }

                        return _context.abrupt('return');

                      case 6:

                        /* eslint-disable global-require */
                        container = require(path.join(pathContainer, 'container'));
                        /* eslint-enable global-require */

                        return _context.abrupt('return', container({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }));

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

          case 32:
            _context2.t2 = function (container) {
              return container;
            };

            containers = _context2.sent.filter(_context2.t2);
            return _context2.abrupt('return', containers);

          case 35:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[17, 23]]);
  }));

  return function getContainers(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getContainers;