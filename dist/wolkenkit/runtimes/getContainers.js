'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var errors = require('../../errors'),
    getConnections = require('./getConnections');

var readdir = promisify(fs.readdir),
    stat = promisify(fs.stat);

var getContainers =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref) {
    var configuration, dangerouslyExposeHttpPorts, debug, forVersion, persistData, sharedKey, pathRuntime, entries, containers;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, forVersion = _ref.forVersion, persistData = _ref.persistData, sharedKey = _ref.sharedKey;

            if (configuration) {
              _context2.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context2.next = 5;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 5:
            if (!(debug === undefined)) {
              _context2.next = 7;
              break;
            }

            throw new Error('Debug is missing.');

          case 7:
            if (forVersion) {
              _context2.next = 9;
              break;
            }

            throw new Error('Version is missing.');

          case 9:
            if (!(persistData === undefined)) {
              _context2.next = 11;
              break;
            }

            throw new Error('Persist data is missing.');

          case 11:
            if (sharedKey) {
              _context2.next = 13;
              break;
            }

            throw new Error('Shared key is missing.');

          case 13:
            pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);
            _context2.prev = 14;
            _context2.next = 17;
            return readdir(pathRuntime);

          case 17:
            entries = _context2.sent;
            _context2.next = 27;
            break;

          case 20:
            _context2.prev = 20;
            _context2.t0 = _context2["catch"](14);
            _context2.t1 = _context2.t0.code;
            _context2.next = _context2.t1 === 'ENOENT' ? 25 : 26;
            break;

          case 25:
            throw new errors.VersionNotFound();

          case 26:
            throw _context2.t0;

          case 27:
            _context2.next = 29;
            return Promise.all(entries.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(entry) {
                var pathContainer, isDirectory, container, connections;
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

                        _context.next = 9;
                        return getConnections({
                          configuration: configuration,
                          dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
                          debug: debug,
                          forVersion: forVersion,
                          persistData: persistData,
                          sharedKey: sharedKey
                        });

                      case 9:
                        connections = _context.sent;
                        return _context.abrupt("return", container({
                          configuration: configuration,
                          connections: connections,
                          dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
                          debug: debug,
                          persistData: persistData,
                          sharedKey: sharedKey
                        }));

                      case 11:
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

          case 29:
            _context2.t2 = function (container) {
              return container;
            };

            containers = _context2.sent.filter(_context2.t2);
            return _context2.abrupt("return", containers);

          case 32:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[14, 20]]);
  }));

  return function getContainers(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getContainers;