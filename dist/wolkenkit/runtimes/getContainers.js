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

var getContainers =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(options) {
    var forVersion, configuration, env, sharedKey, persistData, debug, pathRuntime, entries, containers;
    return _regenerator.default.wrap(function _callee2$(_context2) {
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
            _context2.prev = 16;
            _context2.next = 19;
            return readdir(pathRuntime);

          case 19:
            entries = _context2.sent;
            _context2.next = 29;
            break;

          case 22:
            _context2.prev = 22;
            _context2.t0 = _context2["catch"](16);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'ENOENT' ? 27 : 28;
            break;

          case 27:
            throw new errors.VersionNotFound();

          case 28:
            throw _context2.t0;

          case 29:
            _context2.next = 31;
            return Promise.all(entries.map(
            /*#__PURE__*/
            function () {
              var _ref2 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(entry) {
                var pathContainer, isDirectory, container;
                return _regenerator.default.wrap(function _callee$(_context) {
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

                        return _context.abrupt("return");

                      case 6:
                        /* eslint-disable global-require */
                        container = require(path.join(pathContainer, 'container'));
                        /* eslint-enable global-require */

                        return _context.abrupt("return", container({
                          configuration: configuration,
                          env: env,
                          sharedKey: sharedKey,
                          persistData: persistData,
                          debug: debug
                        }));

                      case 8:
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

          case 31:
            _context2.t2 = function (container) {
              return container;
            };

            containers = _context2.sent.filter(_context2.t2);
            return _context2.abrupt("return", containers);

          case 34:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[16, 22]]);
  }));

  return function getContainers(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getContainers;