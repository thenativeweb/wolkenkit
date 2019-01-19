'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var axios = require('axios');

var network = require('../../../network');

var attachDebugger =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, dangerouslyExposeHttpPorts, debug, persistData, sharedKey, containers, host, addresses, i, container, debugPort, response, id, debugUrl;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, persistData = _ref.persistData, sharedKey = _ref.sharedKey;

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
            if (!(persistData === undefined)) {
              _context.next = 9;
              break;
            }

            throw new Error('Persist data is missing.');

          case 9:
            if (sharedKey) {
              _context.next = 11;
              break;
            }

            throw new Error('Shared key is missing.');

          case 11:
            if (progress) {
              _context.next = 13;
              break;
            }

            throw new Error('Progress is missing.');

          case 13:
            _context.next = 15;
            return configuration.containers({
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 15:
            containers = _context.sent;
            host = configuration.api.host.name;
            _context.prev = 17;
            _context.next = 20;
            return network.getIpAddresses(host);

          case 20:
            addresses = _context.sent;
            _context.next = 28;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](17);
            progress({
              message: _context.t0.message
            });
            progress({
              message: "Failed to resolve ".concat(host, "."),
              type: 'info'
            });
            throw _context.t0;

          case 28:
            i = 0;

          case 29:
            if (!(i < containers.length)) {
              _context.next = 45;
              break;
            }

            container = containers[i];

            if (container.ports) {
              _context.next = 33;
              break;
            }

            return _context.abrupt("continue", 42);

          case 33:
            debugPort = container.ports[9229];

            if (debugPort) {
              _context.next = 36;
              break;
            }

            return _context.abrupt("continue", 42);

          case 36:
            _context.next = 38;
            return axios({
              method: 'get',
              url: "http://".concat(addresses[0].address, ":").concat(debugPort, "/json")
            });

          case 38:
            response = _context.sent;
            id = response.data[0].id;
            debugUrl = "chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=".concat(host, ":").concat(debugPort, "/").concat(id);
            progress({
              message: "Started debugger for ".concat(container.name, " on ").concat(debugUrl, "."),
              type: 'info'
            });

          case 42:
            i++;
            _context.next = 29;
            break;

          case 45:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[17, 23]]);
  }));

  return function attachDebugger(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = attachDebugger;