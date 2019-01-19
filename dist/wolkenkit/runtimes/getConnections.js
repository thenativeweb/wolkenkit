'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var errors = require('../../errors');

var readdir = promisify(fs.readdir);

var getConnections =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, dangerouslyExposeHttpPorts, debug, forVersion, persistData, sharedKey, pathRuntime, connections;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, forVersion = _ref.forVersion, persistData = _ref.persistData, sharedKey = _ref.sharedKey;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context.next = 5;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 5:
            if (!(debug === undefined)) {
              _context.next = 7;
              break;
            }

            throw new Error('Debug is missing.');

          case 7:
            if (forVersion) {
              _context.next = 9;
              break;
            }

            throw new Error('Version is missing.');

          case 9:
            if (!(persistData === undefined)) {
              _context.next = 11;
              break;
            }

            throw new Error('Persist data is missing.');

          case 11:
            if (sharedKey) {
              _context.next = 13;
              break;
            }

            throw new Error('Shared key is missing.');

          case 13:
            pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);
            _context.prev = 14;
            _context.next = 17;
            return readdir(pathRuntime);

          case 17:
            _context.next = 26;
            break;

          case 19:
            _context.prev = 19;
            _context.t0 = _context["catch"](14);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'ENOENT' ? 24 : 25;
            break;

          case 24:
            throw new errors.VersionNotFound();

          case 25:
            throw _context.t0;

          case 26:
            /* eslint-disable global-require */
            connections = require(path.join(pathRuntime, 'connections'));
            /* eslint-enable global-require */

            return _context.abrupt("return", connections({
              configuration: configuration,
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            }));

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[14, 19]]);
  }));

  return function getConnections(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = getConnections;