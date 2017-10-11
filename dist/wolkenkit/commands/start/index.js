'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var processenv = require('processenv');

var docker = require('../../../docker'),
    errors = require('../../../errors'),
    generateSharedKey = require('./generateSharedKey'),
    health = require('../health'),
    install = require('../install'),
    noop = require('../../../noop'),
    runtimes = require('../../runtimes'),
    shared = require('../shared'),
    startContainers = require('./startContainers');

var start = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

    var directory, dangerouslyDestroyData, debug, env, configuration, runtimeVersion, _configuration$enviro, host, port, sharedKeyByUser, sharedKey, persistData, applicationStatus;

    return regeneratorRuntime.wrap(function _callee$(_context) {
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
            directory = options.directory, dangerouslyDestroyData = options.dangerouslyDestroyData, debug = options.debug, env = options.env;
            _context.next = 13;
            return shared.getConfiguration({
              env: env,
              directory: directory,
              isPackageJsonRequired: true
            }, progress);

          case 13:
            configuration = _context.sent;
            runtimeVersion = configuration.runtime.version;

            // Set the port within the configuration to the correct value (flag over
            // environment variable over default value from the package.json file).

            configuration.environments[env].api.address.port = options.port || processenv('WOLKENKIT_PORT') || configuration.environments[env].api.address.port;

            _configuration$enviro = configuration.environments[env].api.address, host = _configuration$enviro.host, port = _configuration$enviro.port;
            sharedKeyByUser = options.sharedKey || processenv('WOLKENKIT_SHARED_KEY');
            _context.t0 = sharedKeyByUser;

            if (_context.t0) {
              _context.next = 23;
              break;
            }

            _context.next = 22;
            return generateSharedKey();

          case 22:
            _context.t0 = _context.sent;

          case 23:
            sharedKey = _context.t0;
            persistData = Boolean(sharedKeyByUser);


            shared.validateCode({ directory: directory }, progress);

            _context.next = 28;
            return shared.checkDocker({ configuration: configuration, env: env }, progress);

          case 28:

            progress({ message: 'Verifying health on environment ' + env + '...', type: 'info' });
            _context.next = 31;
            return health({ directory: directory, env: env }, progress);

          case 31:

            progress({ message: 'Verifying application status...', type: 'info' });
            _context.next = 34;
            return shared.getApplicationStatus({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 34:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'running')) {
              _context.next = 38;
              break;
            }

            progress({ message: 'The application is already running.', type: 'info' });
            throw new errors.ApplicationAlreadyRunning();

          case 38:
            if (!(applicationStatus === 'partially-running')) {
              _context.next = 41;
              break;
            }

            progress({ message: 'The application is partially running.', type: 'info' });
            throw new errors.ApplicationPartiallyRunning();

          case 41:
            _context.next = 43;
            return runtimes.getInstallationStatus({ configuration: configuration, env: env, forVersion: runtimeVersion });

          case 43:
            _context.t1 = _context.sent;

            if (!(_context.t1 !== 'installed')) {
              _context.next = 48;
              break;
            }

            progress({ message: 'Installing wolkenkit ' + runtimeVersion + ' on environment ' + env + '...', type: 'info' });
            _context.next = 48;
            return install({ directory: directory, env: env, version: runtimeVersion }, progress);

          case 48:
            if (!dangerouslyDestroyData) {
              _context.next = 52;
              break;
            }

            progress({ message: 'Destroying previous data...', type: 'info' });
            _context.next = 52;
            return shared.destroyData({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 52:

            progress({ message: 'Setting up network...', type: 'info' });
            _context.next = 55;
            return docker.ensureNetworkExists({ configuration: configuration, env: env });

          case 55:

            progress({ message: 'Building Docker images...', type: 'info' });
            _context.next = 58;
            return shared.buildImages({ directory: directory, configuration: configuration, env: env }, progress);

          case 58:

            progress({ message: 'Starting Docker containers...', type: 'info' });
            _context.next = 61;
            return startContainers({ configuration: configuration, env: env, port: port, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 61:

            progress({ message: 'Using ' + sharedKey + ' as shared key.', type: 'info' });
            progress({ message: 'Waiting for https://' + host + ':' + port + '/v1/ping to reply...', type: 'info' });

            _context.next = 65;
            return shared.waitForApplication({ configuration: configuration, env: env }, progress);

          case 65:
            if (!debug) {
              _context.next = 68;
              break;
            }

            _context.next = 68;
            return shared.attachDebugger({ configuration: configuration, env: env, sharedKey: sharedKey, persistData: persistData, debug: debug }, progress);

          case 68:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function start(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = start;