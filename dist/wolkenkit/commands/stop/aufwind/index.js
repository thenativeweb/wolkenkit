'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var shared = require('../../shared');

var aufwind =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var directory, env, privateKey, configuration, tunnel, application, endpoint;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (options.configuration) {
              _context.next = 8;
              break;
            }

            throw new Error('Configuration is missing.');

          case 8:
            if (progress) {
              _context.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            directory = options.directory, env = options.env, privateKey = options.privateKey, configuration = options.configuration;
            _context.next = 13;
            return shared.startTunnel({
              configuration: configuration,
              env: env,
              privateKey: privateKey
            }, progress);

          case 13:
            tunnel = _context.sent;
            application = configuration.application;
            endpoint = {
              protocol: 'http:',
              method: 'POST',
              hostname: tunnel.host,
              port: tunnel.port,
              pathname: "/v1/applications/".concat(application, "/stop/").concat(env)
            };
            _context.next = 18;
            return shared.streamApplication({
              directory: directory,
              endpoint: endpoint,
              tunnel: tunnel
            }, progress);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function aufwind(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = aufwind;