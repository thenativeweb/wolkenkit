'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var os = require('os'),
    url = require('url'),
    util = require('util');

var freeport = require('freeport');

var defaults = require('../defaults.json'),
    errors = require('../../../errors'),
    file = require('../../../file'),
    startOpensshTunnel = require('./startOpensshTunnel'),
    startPuttyTunnel = require('./startPuttyTunnel');

var freeportAsync = util.promisify(freeport);

var startTunnel =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var configuration, env, privateKey, environment, server, _environment$deployme, host, port, stats, mode, serverUrl, username, addresses, tunnelServer;

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

            throw new Error('configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            configuration = options.configuration, env = options.env, privateKey = options.privateKey;
            environment = configuration.environments[env];

            if (!(!environment.type || environment.type !== 'aufwind')) {
              _context.next = 13;
              break;
            }

            progress({
              message: 'Environment is not of type aufwind.',
              type: 'info'
            });
            throw new errors.EnvironmentNotAufwind();

          case 13:
            server = "ssh://".concat(defaults.commands.shared.aufwind.ssh.host, ":").concat(defaults.commands.shared.aufwind.ssh.port, " ");

            if (environment.deployment.server) {
              _environment$deployme = environment.deployment.server, host = _environment$deployme.host, port = _environment$deployme.port;
              server = "ssh://".concat(host, ":").concat(port);
            }

            if (!privateKey) {
              _context.next = 39;
              break;
            }

            _context.prev = 16;
            _context.next = 19;
            return file.read(privateKey);

          case 19:
            _context.next = 32;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context["catch"](16);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EFILENOTFOUND' ? 26 : _context.t1 === 'EFILENOTACCESSIBLE' ? 28 : 30;
            break;

          case 26:
            progress({
              message: 'Private key not found.',
              type: 'info'
            });
            return _context.abrupt("break", 31);

          case 28:
            progress({
              message: 'Private key is not accessible.',
              type: 'info'
            });
            return _context.abrupt("break", 31);

          case 30:
            return _context.abrupt("break", 31);

          case 31:
            throw _context.t0;

          case 32:
            _context.next = 34;
            return file.stat(privateKey);

          case 34:
            stats = _context.sent;
            mode = stats.mode.toString(8);

            if (!(/^\d\d\d(4|6)00$/g.test(mode) === false)) {
              _context.next = 39;
              break;
            }

            progress({
              message: 'Private key permissions are too open.',
              type: 'info'
            });
            throw new errors.FileAccessModeTooOpen();

          case 39:
            serverUrl = url.parse(server);

            if (!(serverUrl.protocol !== 'ssh:')) {
              _context.next = 43;
              break;
            }

            progress({
              message: 'Protocol is invalid.'
            });
            throw new errors.ProtocolInvalid();

          case 43:
            username = 'wolkenkit';
            _context.t2 = {
              host: serverUrl.hostname,
              port: serverUrl.port
            };
            _context.next = 47;
            return freeportAsync();

          case 47:
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
              _context.next = 70;
              break;
            }

            progress({
              message: 'Trying to use plink...'
            });
            _context.prev = 53;
            _context.next = 56;
            return startPuttyTunnel({
              configuration: configuration,
              addresses: addresses,
              username: username,
              privateKey: privateKey
            });

          case 56:
            tunnelServer = _context.sent;
            _context.next = 70;
            break;

          case 59:
            _context.prev = 59;
            _context.t6 = _context["catch"](53);

            if (!(_context.t6.code !== 'EEXECUTABLENOTFOUND')) {
              _context.next = 69;
              break;
            }

            _context.t7 = _context.t6.code;
            _context.next = _context.t7 === 'ECONNREFUSED' ? 65 : 67;
            break;

          case 65:
            progress({
              message: 'Failed to reach aufwind server.',
              type: 'info'
            });
            return _context.abrupt("break", 68);

          case 67:
            return _context.abrupt("break", 68);

          case 68:
            throw _context.t6;

          case 69:
            progress({
              message: 'plink not found.'
            });

          case 70:
            if (tunnelServer) {
              _context.next = 90;
              break;
            }

            progress({
              message: 'Trying to use ssh...'
            });
            _context.prev = 72;
            _context.next = 75;
            return startOpensshTunnel({
              configuration: configuration,
              addresses: addresses,
              username: username,
              privateKey: privateKey
            });

          case 75:
            tunnelServer = _context.sent;
            _context.next = 90;
            break;

          case 78:
            _context.prev = 78;
            _context.t8 = _context["catch"](72);
            _context.t9 = _context.t8.code;
            _context.next = _context.t9 === 'EEXECUTABLENOTFOUND' ? 83 : _context.t9 === 'ECONNREFUSED' ? 86 : 88;
            break;

          case 83:
            progress({
              message: 'ssh not found.'
            });
            progress({
              message: 'SSH client not found.',
              type: 'info'
            });
            return _context.abrupt("break", 89);

          case 86:
            progress({
              message: 'Failed to reach aufwind server.',
              type: 'info'
            });
            return _context.abrupt("break", 89);

          case 88:
            return _context.abrupt("break", 89);

          case 89:
            throw _context.t8;

          case 90:
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

          case 92:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[16, 21], [53, 59], [72, 78]]);
  }));

  return function startTunnel(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = startTunnel;