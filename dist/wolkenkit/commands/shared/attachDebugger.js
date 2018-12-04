'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var axios = require('axios');

var runtimes = require('../../runtimes');

var attachDebugger =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var configuration, env, sharedKey, persistData, debug, host, runtime, containers, i, container, debugPort, response, id, debugUrl;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.sharedKey) {
              _context.next = 8;
              break;
            }

            throw new Error('Shared key is missing.');

          case 8:
            if (!(options.persistData === undefined)) {
              _context.next = 10;
              break;
            }

            throw new Error('Persist data is missing.');

          case 10:
            if (!(options.debug === undefined)) {
              _context.next = 12;
              break;
            }

            throw new Error('Debug is missing.');

          case 12:
            if (progress) {
              _context.next = 14;
              break;
            }

            throw new Error('Progress is missing.');

          case 14:
            configuration = options.configuration, env = options.env, sharedKey = options.sharedKey, persistData = options.persistData, debug = options.debug;
            host = configuration.environments[env].api.address.host, runtime = configuration.runtime.version;
            _context.next = 18;
            return runtimes.getContainers({
              forVersion: runtime,
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            });

          case 18:
            containers = _context.sent;
            i = 0;

          case 20:
            if (!(i < containers.length)) {
              _context.next = 36;
              break;
            }

            container = containers[i];

            if (container.ports) {
              _context.next = 24;
              break;
            }

            return _context.abrupt("continue", 33);

          case 24:
            debugPort = container.ports[9229];

            if (debugPort) {
              _context.next = 27;
              break;
            }

            return _context.abrupt("continue", 33);

          case 27:
            _context.next = 29;
            return axios({
              method: 'get',
              url: "http://".concat(host, ":").concat(debugPort, "/json")
            });

          case 29:
            response = _context.sent;
            id = response.data[0].id;
            debugUrl = "chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=".concat(host, ":").concat(debugPort, "/").concat(id);
            progress({
              message: "Started debugger for ".concat(container.name, " on ").concat(debugUrl, "."),
              type: 'info'
            });

          case 33:
            i++;
            _context.next = 20;
            break;

          case 36:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function attachDebugger(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = attachDebugger;