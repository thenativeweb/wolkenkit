'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var os = require('os'),
    url = require('url'),
    util = require('util');

var freeportCallback = require('freeport');

var defaults = require('../../defaults.json'),
    errors = require('../../../errors'),
    file = require('../../../file'),
    startOpensshTunnel = require('./startOpensshTunnel'),
    startPuttyTunnel = require('./startPuttyTunnel');

var freeport = util.promisify(freeportCallback);

var startTunnel =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var configuration, _ref$privateKey, privateKey, type, deployment, server, stats, mode, serverUrl, username, addresses, tunnelServer;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, _ref$privateKey = _ref.privateKey, privateKey = _ref$privateKey === void 0 ? undefined : _ref$privateKey;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('configuration is missing.');

          case 3:
            if (progress) {
              _context.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            type = configuration.type, deployment = configuration.deployment;

            if (!(type !== 'aufwind')) {
              _context.next = 9;
              break;
            }

            progress({
              message: 'Environment is not of type aufwind.',
              type: 'info'
            });
            throw new errors.EnvironmentNotAufwind();

          case 9:
            server = "ssh://".concat(defaults.commands.shared.aufwind.ssh.host, ":").concat(defaults.commands.shared.aufwind.ssh.port, " ");

            if (deployment.server) {
              server = "ssh://".concat(deployment.server.host, ":").concat(deployment.server.port);
            }

            if (!privateKey) {
              _context.next = 35;
              break;
            }

            _context.prev = 12;
            _context.next = 15;
            return file.read(privateKey);

          case 15:
            _context.next = 28;
            break;

          case 17:
            _context.prev = 17;
            _context.t0 = _context["catch"](12);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EFILENOTFOUND' ? 22 : _context.t1 === 'EFILENOTACCESSIBLE' ? 24 : 26;
            break;

          case 22:
            progress({
              message: 'Private key not found.',
              type: 'info'
            });
            return _context.abrupt("break", 27);

          case 24:
            progress({
              message: 'Private key is not accessible.',
              type: 'info'
            });
            return _context.abrupt("break", 27);

          case 26:
            return _context.abrupt("break", 27);

          case 27:
            throw _context.t0;

          case 28:
            _context.next = 30;
            return file.stat(privateKey);

          case 30:
            stats = _context.sent;
            mode = stats.mode.toString(8);

            if (!(/^\d\d\d(4|6)00$/g.test(mode) === false)) {
              _context.next = 35;
              break;
            }

            progress({
              message: 'Private key permissions are too open.',
              type: 'info'
            });
            throw new errors.FileAccessModeTooOpen();

          case 35:
            serverUrl = url.parse(server);

            if (!(serverUrl.protocol !== 'ssh:')) {
              _context.next = 39;
              break;
            }

            progress({
              message: 'Protocol is invalid.'
            });
            throw new errors.ProtocolInvalid();

          case 39:
            username = 'wolkenkit';
            _context.t2 = {
              host: serverUrl.hostname,
              port: serverUrl.port
            };
            _context.next = 43;
            return freeport();

          case 43:
            _context.t3 = _context.sent;
            _context.t4 = {
              host: 'localhost',
              port: _context.t3
            };
            _context.t5 = {
              host: defaults.commands.shared.aufwind.http.host,
              port: defaults.commands.shared.aufwind.http.port
            };
            addresses = {
              server: _context.t2,
              from: _context.t4,
              to: _context.t5
            };

            if (!(os.platform() === 'win32')) {
              _context.next = 66;
              break;
            }

            progress({
              message: 'Trying to use plink...'
            });
            _context.prev = 49;
            _context.next = 52;
            return startPuttyTunnel({
              addresses: addresses,
              configuration: configuration,
              privateKey: privateKey,
              username: username
            });

          case 52:
            tunnelServer = _context.sent;
            _context.next = 66;
            break;

          case 55:
            _context.prev = 55;
            _context.t6 = _context["catch"](49);

            if (!(_context.t6.code !== 'EEXECUTABLENOTFOUND')) {
              _context.next = 65;
              break;
            }

            _context.t7 = _context.t6.code;
            _context.next = _context.t7 === 'ECONNREFUSED' ? 61 : 63;
            break;

          case 61:
            progress({
              message: 'Failed to reach aufwind server.',
              type: 'info'
            });
            return _context.abrupt("break", 64);

          case 63:
            return _context.abrupt("break", 64);

          case 64:
            throw _context.t6;

          case 65:
            progress({
              message: 'plink not found.'
            });

          case 66:
            if (tunnelServer) {
              _context.next = 86;
              break;
            }

            progress({
              message: 'Trying to use ssh...'
            });
            _context.prev = 68;
            _context.next = 71;
            return startOpensshTunnel({
              addresses: addresses,
              configuration: configuration,
              privateKey: privateKey,
              username: username
            });

          case 71:
            tunnelServer = _context.sent;
            _context.next = 86;
            break;

          case 74:
            _context.prev = 74;
            _context.t8 = _context["catch"](68);
            _context.t9 = _context.t8.code;
            _context.next = _context.t9 === 'EEXECUTABLENOTFOUND' ? 79 : _context.t9 === 'ECONNREFUSED' ? 82 : 84;
            break;

          case 79:
            progress({
              message: 'ssh not found.'
            });
            progress({
              message: 'SSH client not found.',
              type: 'info'
            });
            return _context.abrupt("break", 85);

          case 82:
            progress({
              message: 'Failed to reach aufwind server.',
              type: 'info'
            });
            return _context.abrupt("break", 85);

          case 84:
            return _context.abrupt("break", 85);

          case 85:
            throw _context.t8;

          case 86:
            progress({
              message: "Opened SSH tunnel from ".concat(addresses.from.host, ":").concat(addresses.from.port, " to ").concat(addresses.server.host, ":").concat(addresses.server.port, ".")
            });
            return _context.abrupt("return", {
              close: function close() {
                tunnelServer.close();
                progress({
                  message: 'Closed SSH tunnel.'
                });
              },
              host: addresses.from.host,
              port: addresses.from.port,
              server: addresses.server
            });

          case 88:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[12, 17], [49, 55], [68, 74]]);
  }));

  return function startTunnel(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = startTunnel;