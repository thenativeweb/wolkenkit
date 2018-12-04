'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var processenv = require('processenv');

var docker = require('../../../../docker'),
    errors = require('../../../../errors'),
    generateSharedKey = require('./generateSharedKey'),
    health = require('../../health'),
    install = require('../../install'),
    noop = require('../../../../noop'),
    runtimes = require('../../../runtimes'),
    shared = require('../../shared'),
    startContainers = require('./startContainers'),
    stop = require('../../stop'),
    verifyThatPortsAreAvailable = require('./verifyThatPortsAreAvailable');

var cli =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var directory, dangerouslyDestroyData, debug, env, configuration, environment, port, runtimeVersion, sharedKeyByUser, sharedKey, persistData, applicationStatus;
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
            environment = configuration.environments[env]; // Set the port within the configuration to the correct value (flag over
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
            return shared.checkDocker({
              configuration: configuration,
              env: env
            }, progress);

          case 29:
            progress({
              message: "Verifying health on environment ".concat(env, "..."),
              type: 'info'
            });
            _context.next = 32;
            return health({
              directory: directory,
              env: env
            }, progress);

          case 32:
            progress({
              message: 'Verifying application status...',
              type: 'info'
            });
            _context.next = 35;
            return shared.getApplicationStatus({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 35:
            applicationStatus = _context.sent;

            if (!(applicationStatus === 'running')) {
              _context.next = 39;
              break;
            }

            progress({
              message: "The application is already running.",
              type: 'info'
            });
            throw new errors.ApplicationAlreadyRunning();

          case 39:
            if (!(applicationStatus === 'partially-running')) {
              _context.next = 42;
              break;
            }

            progress({
              message: "The application is partially running.",
              type: 'info'
            });
            throw new errors.ApplicationPartiallyRunning();

          case 42:
            progress({
              message: 'Verifying that ports are available...',
              type: 'info'
            });
            _context.next = 45;
            return verifyThatPortsAreAvailable({
              forVersion: runtimeVersion,
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 45:
            _context.next = 47;
            return runtimes.getInstallationStatus({
              configuration: configuration,
              env: env,
              forVersion: runtimeVersion
            });

          case 47:
            _context.t1 = _context.sent;

            if (!(_context.t1 !== 'installed')) {
              _context.next = 52;
              break;
            }

            progress({
              message: "Installing wolkenkit ".concat(runtimeVersion, " on environment ").concat(env, "..."),
              type: 'info'
            });
            _context.next = 52;
            return install({
              directory: directory,
              env: env,
              version: runtimeVersion
            }, progress);

          case 52:
            if (!dangerouslyDestroyData) {
              _context.next = 56;
              break;
            }

            progress({
              message: 'Destroying previous data...',
              type: 'info'
            });
            _context.next = 56;
            return shared.destroyData({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 56:
            progress({
              message: 'Setting up network...',
              type: 'info'
            });
            _context.next = 59;
            return docker.ensureNetworkExists({
              configuration: configuration,
              env: env
            });

          case 59:
            progress({
              message: 'Building Docker images...',
              type: 'info'
            });
            _context.next = 62;
            return shared.buildImages({
              directory: directory,
              configuration: configuration,
              env: env
            }, progress);

          case 62:
            progress({
              message: 'Starting Docker containers...',
              type: 'info'
            });
            _context.next = 65;
            return startContainers({
              configuration: configuration,
              env: env,
              port: port,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 65:
            progress({
              message: "Using ".concat(sharedKey, " as shared key."),
              type: 'info'
            });
            _context.prev = 66;
            _context.next = 69;
            return shared.waitForApplicationAndValidateLogs({
              configuration: configuration,
              env: env
            }, progress);

          case 69:
            _context.next = 81;
            break;

          case 71:
            _context.prev = 71;
            _context.t2 = _context["catch"](66);
            _context.t3 = _context.t2.code;
            _context.next = _context.t3 === 'ERUNTIMEERROR' ? 76 : 79;
            break;

          case 76:
            _context.next = 78;
            return stop({
              directory: directory,
              dangerouslyDestroyData: false,
              env: env,
              configuration: configuration
            }, noop);

          case 78:
            return _context.abrupt("break", 80);

          case 79:
            return _context.abrupt("break", 80);

          case 80:
            throw _context.t2;

          case 81:
            if (!debug) {
              _context.next = 84;
              break;
            }

            _context.next = 84;
            return shared.attachDebugger({
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            }, progress);

          case 84:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[66, 71]]);
  }));

  return function cli(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = cli;