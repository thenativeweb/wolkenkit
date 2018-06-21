'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var startTunnel = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var configuration, env, privateKey, environment, server, _environment$deployme, host, port, serverUrl, username, addresses, tunnelServer;

    return _regenerator2.default.wrap(function _callee$(_context) {
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

            progress({ message: 'Environment is not of type aufwind.', type: 'info' });
            throw new errors.EnvironmentNotAufwind();

          case 13:
            server = 'ssh://' + defaults.commands.shared.aufwind.ssh.host + ':' + defaults.commands.shared.aufwind.ssh.port + ' ';


            if (environment.deployment.server) {
              _environment$deployme = environment.deployment.server, host = _environment$deployme.host, port = _environment$deployme.port;


              server = 'ssh://' + host + ':' + port;
            }

            if (!privateKey) {
              _context.next = 32;
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
            _context.t0 = _context['catch'](16);
            _context.t1 = _context.t0.code;
            _context.next = _context.t1 === 'EFILENOTFOUND' ? 26 : _context.t1 === 'EFILENOTACCESSIBLE' ? 28 : 30;
            break;

          case 26:
            progress({ message: 'Private key not found.', type: 'info' });
            return _context.abrupt('break', 31);

          case 28:
            progress({ message: 'Private key is not accessible.', type: 'info' });
            return _context.abrupt('break', 31);

          case 30:
            return _context.abrupt('break', 31);

          case 31:
            throw _context.t0;

          case 32:
            serverUrl = url.parse(server);

            if (!(serverUrl.protocol !== 'ssh:')) {
              _context.next = 36;
              break;
            }

            progress({ message: 'Protocol is invalid.' });
            throw new errors.ProtocolInvalid();

          case 36:
            username = 'wolkenkit';
            _context.t2 = {
              host: serverUrl.hostname,
              port: serverUrl.port
            };
            _context.next = 40;
            return freeportAsync();

          case 40:
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
            tunnelServer = void 0;

            if (!(os.platform() === 'win32')) {
              _context.next = 64;
              break;
            }

            progress({ message: 'Trying to use plink...' });

            _context.prev = 47;
            _context.next = 50;
            return startPuttyTunnel({ addresses: addresses, username: username, privateKey: privateKey });

          case 50:
            tunnelServer = _context.sent;
            _context.next = 64;
            break;

          case 53:
            _context.prev = 53;
            _context.t6 = _context['catch'](47);

            if (!(_context.t6.code !== 'EEXECUTABLENOTFOUND')) {
              _context.next = 63;
              break;
            }

            _context.t7 = _context.t6.code;
            _context.next = _context.t7 === 'ECONNREFUSED' ? 59 : 61;
            break;

          case 59:
            progress({ message: 'Failed to reach aufwind server.', type: 'info' });
            return _context.abrupt('break', 62);

          case 61:
            return _context.abrupt('break', 62);

          case 62:
            throw _context.t6;

          case 63:

            progress({ message: 'plink not found.' });

          case 64:
            if (tunnelServer) {
              _context.next = 84;
              break;
            }

            progress({ message: 'Trying to use ssh...' });

            _context.prev = 66;
            _context.next = 69;
            return startOpensshTunnel({ addresses: addresses, username: username, privateKey: privateKey });

          case 69:
            tunnelServer = _context.sent;
            _context.next = 84;
            break;

          case 72:
            _context.prev = 72;
            _context.t8 = _context['catch'](66);
            _context.t9 = _context.t8.code;
            _context.next = _context.t9 === 'EEXECUTABLENOTFOUND' ? 77 : _context.t9 === 'ECONNREFUSED' ? 80 : 82;
            break;

          case 77:
            progress({ message: 'ssh not found.' });
            progress({ message: 'SSH client not found.', type: 'info' });
            return _context.abrupt('break', 83);

          case 80:
            progress({ message: 'Failed to reach aufwind server.', type: 'info' });
            return _context.abrupt('break', 83);

          case 82:
            return _context.abrupt('break', 83);

          case 83:
            throw _context.t8;

          case 84:

            progress({ message: 'Opened SSH tunnel from ' + addresses.from.host + ':' + addresses.from.port + ' to ' + addresses.server.host + ':' + addresses.server.port + '.' });

            return _context.abrupt('return', {
              close: function close() {
                tunnelServer.close();
                progress({ message: 'Closed SSH tunnel.' });
              },
              host: addresses.from.host,
              port: addresses.from.port,
              server: addresses.server
            });

          case 86:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[16, 21], [47, 53], [66, 72]]);
  }));

  return function startTunnel(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = startTunnel;