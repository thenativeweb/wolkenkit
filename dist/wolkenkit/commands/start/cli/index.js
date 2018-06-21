'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var processenv = require('processenv');

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    generateSharedKey = require('./generateSharedKey'),
    health = require('../../health'),
    install = require('../../install'),
    runtimes = require('../../../runtimes'),
    shared = require('../../shared'),
    startContainers = require('./startContainers'),
    verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

var cli = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var directory, dangerouslyDestroyData, debug, env, configuration, environment, port, runtimeVersion, sharedKeyByUser, sharedKey, persistData, applicationStatus;
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
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (!(options.dangerouslyDestroyData === undefined)) {
              _context.next = 6;
              break;
            }

            throw new Error('Dangerously destroy data is missing.');

          case 6:
            if (!(options.debug === undefined)) {
              _context.next = 8;
              break;
            }

            throw new Error('Debug is missing.');

          case 8:
            if (options.env) {
              _context.next = 10;
              break;
            }

            throw new Error('Environment is missing.');

          case 10:
            if (options.configuration) {
              _context.next = 12;
              break;
            }

            throw new Error('Configuration is missing.');

          case 12:
            if (progress) {
              _context.next = 14;
              break;
            }

            throw new Error('Progress is missing.');

          case 14:
            directory = options.directory, dangerouslyDestroyData = options.dangerouslyDestroyData, debug = options.debug, env = options.env, configuration = options.configuration;
            environment = configuration.environments[env];

            // Set the port within the configuration to the correct value (flag over
            // environment variable over default value from the package.json file).

            environment.api.address.port = options.port || processenv('WOLKENKIT_PORT') || environment.api.address.port;

            port = environment.api.address.port;
            runtimeVersion = configuration.runtime.version;
            sharedKeyByUser = options.sharedKey || processenv('WOLKENKIT_SHARED_KEY');
            _context.t0 = sharedKeyByUser;

            if (_context.t0) {
              _context.next = 25;
              break;
            }

            _context.next = 24;
            return generateSharedKey();

          case 24:
            _context.t0 = _context.sent;

          case 25:
            sharedKey = _context.t0;
            persistData = Boolean(sharedKeyByUser);
            _context.next = 29;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 29:

            progress({ message: 'Verifying health on environment ' + env + '...', type: 'info' });
            _context.next = 32;
            return health({ directory: directory, env: env }, progress);

          case 32:

            progress({ message: 'Verifying application status...', type: 'info' });
            _context.next = 35;
            return shared.getApplicationStatus({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 35:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'running')) {
              _context.next = 39;
              break;
            }

            progress({ message: 'The application is already running.', type: 'info' });
            throw new errors.ApplicationAlreadyRunning();

          case 39:
            if (!(applicationStatus === 'partially-running')) {
              _context.next = 42;
              break;
            }

            progress({ message: 'The application is partially running.', type: 'info' });
            throw new errors.ApplicationPartiallyRunning();

          case 42:

            progress({ message: 'Verifying that ports are available...', type: 'info' });
            _context.next = 45;
            return verifyThatPortsAreAvailable({ forVersion: runtimeVersion, configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 45:
            _context.next = 47;
            return runtimes.getInstallationStatus({ configuration: configuration, env: env, forVersion: runtimeVersion });

          case 47:
            _context.t1 = _context.sent;

            if (!(_context.t1 !== 'installed')) {
              _context.next = 52;
              break;
            }

            progress({ message: 'Installing wolkenkit ' + runtimeVersion + ' on environment ' + env + '...', type: 'info' });
            _context.next = 52;
            return install({ directory: directory, env: env, version: runtimeVersion }, progress);

          case 52:
            if (!dangerouslyDestroyData) {
              _context.next = 56;
              break;
            }

            progress({ message: 'Destroying previous data...', type: 'info' });
            _context.next = 56;
            return shared.destroyData({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 56:

            progress({ message: 'Setting up network...', type: 'info' });
            _context.next = 59;
            return docker.ensureNetworkExists({ configuration: configuration, env: env });

          case 59:

            progress({ message: 'Building Docker images...', type: 'info' });
            _context.next = 62;
            return shared.buildImages({ directory: directory, configuration: configuration, env: env }, progress);

          case 62:

            progress({ message: 'Starting Docker containers...', type: 'info' });
            _context.next = 65;
            return startContainers({ configuration: configuration, env: env, port: port, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 65:

            progress({ message: 'Using ' + sharedKey + ' as shared key.', type: 'info' });

            _context.next = 68;
            return shared.waitForApplication({ configuration: configuration, env: env }, progress);

          case 68:
            if (!debug) {
              _context.next = 71;
              break;
            }

            _context.next = 71;
            return shared.attachDebugger({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 71:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function cli(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cli;